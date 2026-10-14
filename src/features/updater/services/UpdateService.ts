import { isTauri } from '@/utils/tauriBridge';
import { ChangelogParser } from './ChangelogParser';
import type {
  UpdateInfo,
  DownloadProgress,
  StructuredChangelog,
} from '../types';

// 当前应用客户端内置版本号（与 package.json / Cargo.toml 同步）
export const APP_CURRENT_VERSION = '2.3.2';

// 官方发布端点与仓库配置
export const REPO_OWNER = 'S2mpleX';
export const REPO_NAME = 'novelforge';
export const OFFICIAL_RELEASES_URL = `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases`;
export const OFFICIAL_LATEST_ENDPOINT = `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/latest/download/latest.json`;

export class UpdateService {
  private static cachedActiveUpdate: any = null;

  /**
   * 检查远端是否有可用更新
   * @param forceCheck 是否强制跳过缓存直接请求
   */
  static async checkForUpdates(forceCheck: boolean = false): Promise<UpdateInfo> {
    // 1. 如果在原生 Tauri 桌面环境中运行
    if (isTauri()) {
      try {
        const { check } = await import('@tauri-apps/plugin-updater');
        
        // 调用 Tauri Updater 原生 API 检查
        const update = await check({
          timeout: 15000, // 15 秒超时
        });

        if (!update) {
          // 确认为最新版本
          this.cachedActiveUpdate = null;
          return {
            currentVersion: APP_CURRENT_VERSION,
            latestVersion: APP_CURRENT_VERSION,
            isAvailable: false,
            changelog: ChangelogParser.parse(
              '当前已是最新稳定版本，暂无可用更新。',
              APP_CURRENT_VERSION
            ),
          };
        }

        // 发现新版本
        this.cachedActiveUpdate = update;
        const latestVersion = update.version || APP_CURRENT_VERSION;
        const isHigher = ChangelogParser.compareSemVer(latestVersion, update.currentVersion || APP_CURRENT_VERSION) > 0;

        const structuredChangelog = ChangelogParser.parse(
          update.body || '新版本性能优化及功能升级。',
          latestVersion,
          update.date
        );
        structuredChangelog.releaseUrl = `${OFFICIAL_RELEASES_URL}/tag/v${latestVersion}`;

        return {
          currentVersion: update.currentVersion || APP_CURRENT_VERSION,
          latestVersion,
          releaseDate: update.date,
          changelog: structuredChangelog,
          isAvailable: isHigher,
        };
      } catch (err: any) {
        this.cachedActiveUpdate = null;
        console.error('Tauri 原生更新检测异常:', err);

        // 细化区分错误类型
        const msg = String(err.message || err);
        let errorDetail = '检查更新失败：网络连接异常，无法访问更新服务器。';
        if (msg.includes('network') || msg.includes('timed out') || msg.includes('timeout')) {
          errorDetail = '网络连接超时：无法连接至 GitHub Releases 服务器，请检查网络或代理设置。';
        } else if (msg.includes('403') || msg.includes('rate limit')) {
          errorDetail = '请求受限 (HTTP 403)：访问发布服务器频率超限，请稍后重试。';
        } else if (msg.includes('signature') || msg.includes('invalid signature')) {
          errorDetail = '更新包签名校验异常：远端发布包签名与客户端公钥不一致，已拒绝该更新以保障安全。';
        } else if (msg.includes('Could not fetch')) {
          errorDetail = '无法获取更新元数据：服务器未返回有效的 latest.json 清单。';
        } else {
          errorDetail = `更新服务异常：${msg}`;
        }

        throw new Error(errorDetail);
      }
    }

    // 2. 如果在浏览器调试模式下运行，提供健壮的 HTTP 检测或模拟
    try {
      const response = await fetch(OFFICIAL_LATEST_ENDPOINT, {
        headers: { Accept: 'application/json' },
        cache: forceCheck ? 'no-cache' : 'default',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      const remoteMeta = await response.json();
      const latestVersion = remoteMeta.version || APP_CURRENT_VERSION;
      const isAvailable = ChangelogParser.compareSemVer(latestVersion, APP_CURRENT_VERSION) > 0;

      return {
        currentVersion: APP_CURRENT_VERSION,
        latestVersion,
        releaseDate: remoteMeta.pub_date,
        changelog: ChangelogParser.parse(remoteMeta.notes || '', latestVersion, remoteMeta.pub_date),
        isAvailable,
      };
    } catch (err: any) {
      // 避免误报为已是最新，抛出可读错误
      throw new Error(`无法连接至更新端点 (${err.message || '网络断开或无法访问 GitHub'})`);
    }
  }

  /**
   * 执行下载并安装流程，通过回调函数实时报告精准进度
   */
  static async downloadAndInstall(
    onProgress: (progress: DownloadProgress) => void
  ): Promise<void> {
    if (!isTauri() || !this.cachedActiveUpdate) {
      throw new Error('未处于可更新的桌面环境或没有已检出的有效更新包');
    }

    const update = this.cachedActiveUpdate;
    let totalLength = 0;
    let downloaded = 0;
    let lastTime = Date.now();
    let lastDownloaded = 0;

    try {
      onProgress({
        contentLength: 0,
        downloadedBytes: 0,
        percent: null,
        speedBytesPerSec: 0,
        statusText: '正在建立安全更新连接与签名验证通道...',
        errorMessage: null,
      });

      await update.downloadAndInstall((event: any) => {
        const now = Date.now();
        const timeDiff = (now - lastTime) / 1000;

        switch (event.event) {
          case 'Started': {
            totalLength = event.data.contentLength || 0;
            onProgress({
              contentLength: totalLength,
              downloadedBytes: 0,
              percent: totalLength > 0 ? 0 : null,
              speedBytesPerSec: 0,
              statusText: totalLength > 0
                ? `开始下载新版本安装包 (${(totalLength / 1024 / 1024).toFixed(1)} MB)...`
                : '开始下载新版本安装包...',
              errorMessage: null,
            });
            lastTime = now;
            break;
          }

          case 'Progress': {
            const chunk = event.data.chunkLength || 0;
            downloaded += chunk;

            let speed = 0;
            if (timeDiff >= 0.5) {
              speed = Math.round((downloaded - lastDownloaded) / timeDiff);
              lastTime = now;
              lastDownloaded = downloaded;
            }

            const percent = totalLength > 0
              ? Math.min(100, Math.round((downloaded / totalLength) * 100))
              : null;

            onProgress({
              contentLength: totalLength,
              downloadedBytes: downloaded,
              percent,
              speedBytesPerSec: speed,
              statusText: percent !== null
                ? `正在下载更新包：${(downloaded / 1024 / 1024).toFixed(2)} MB / ${(totalLength / 1024 / 1024).toFixed(2)} MB (${percent}%)`
                : `正在下载更新包：${(downloaded / 1024 / 1024).toFixed(2)} MB (总大小计算中...)`,
              errorMessage: null,
            });
            break;
          }

          case 'Finished': {
            onProgress({
              contentLength: totalLength,
              downloadedBytes: downloaded,
              percent: 100,
              speedBytesPerSec: 0,
              statusText: '下载完成，正在进行 Tauri 原生更新包签名与完整性校验...',
              errorMessage: null,
            });
            break;
          }
        }
      });

      // Windows 机制处理：在 Windows 平台上，Tauri Updater 会解压并唤起安装包。
      // 安装阶段报告
      onProgress({
        contentLength: totalLength,
        downloadedBytes: totalLength || downloaded,
        percent: 100,
        speedBytesPerSec: 0,
        statusText: '更新包已就绪，正在启动 Windows 安装程序并平滑重启应用...',
        errorMessage: null,
      });

    } catch (err: any) {
      console.error('更新下载或安装失败:', err);
      const errorMsg = String(err.message || err);
      let friendlyError = '更新安装失败：';
      if (errorMsg.includes('signature') || errorMsg.includes('minisign')) {
        friendlyError += '安装包签名校验失败，文件可能已损坏或遭到未授权篡改！已自动中止安装。';
      } else if (errorMsg.includes('permission') || errorMsg.includes('Access is denied')) {
        friendlyError += '缺少安装执行权限，请以管理员身份重新运行软件或手动下载。';
      } else if (errorMsg.includes('disk') || errorMsg.includes('space')) {
        friendlyError += '磁盘存储空间不足，无法保存更新包。';
      } else {
        friendlyError += errorMsg;
      }

      onProgress({
        contentLength: totalLength,
        downloadedBytes: downloaded,
        percent: totalLength > 0 ? Math.round((downloaded / totalLength) * 100) : null,
        speedBytesPerSec: 0,
        statusText: '更新流程异常中断',
        errorMessage: friendlyError,
      });
      throw new Error(friendlyError);
    }
  }

  /**
   * 安装完成后的安全重启
   */
  static async relaunchApp(): Promise<void> {
    if (isTauri()) {
      try {
        const { relaunch } = await import('@tauri-apps/plugin-process');
        await relaunch();
      } catch (err) {
        console.warn('调用 plugin-process relaunch 失败，尝试标准退出:', err);
        window.close();
      }
    } else {
      window.location.reload();
    }
  }

  /**
   * 获取结构化历史版本更新日志列表
   * 优先从 GitHub Releases API 获取，若无网络则加载内置基线历史
   */
  static async fetchHistoricalChangelogs(): Promise<StructuredChangelog[]> {
    // 内置基线更新历史（确保离线或 GitHub API 受限时依然有完整历史可看）
    const fallbackHistory: StructuredChangelog[] = [
      {
        version: 'v2.2.0',
        date: '2026-10-13',
        summary: '重大版本：正式引入应用内自动更新与版本发布系统 (Updater Center) 及完整 CI/CD 流水线。',
        features: [
          '新增原生自动更新引擎：集成 @tauri-apps/plugin-updater，支持版本检测与后台静默轮询',
          '全新更新中心 UI：提供版本状态看板、下载进度显示与更新偏好配置',
          '严格更新包签名机制：采用 Minisign 原生非对称公私钥加密校验，杜绝不可信更新',
          '升级前全方位数据安全守卫 (DataSafetyGuard)：自动检测未保存草稿、安全挂起多 Agent 连载任务，并执行 SQLite 在线热备份',
          'GitHub Actions 自动化流水线：新增 release.yml 实现 Windows x64 NSIS 自动编译、签名与 draft release 上传',
        ],
        improvements: [
          '优化设置中心结构，无缝整合模型网关与软件更新标签页',
          '升级 SemVer 语义化版本校验与跨版本对比引擎',
          '增强网络容错，准确识别网络超时、403、404 与签名校验失败',
        ],
        bugfixes: [
          '修复断网时偶发误报为“已是最新版本”的问题',
          '修复大型多 Agent 连载任务在软件退出时中断的断点记录逻辑',
        ],
        breakingChanges: [],
        knownIssues: [],
        rawBody: '',
      },
      {
        version: 'v2.1.0',
        date: '2026-10-13',
        summary: '全局自由拖拽与可缩放工作台 (Docking Workspace) 全面达成！',
        features: [
          '专业级树形可停靠工作台 (SplitNode + TabGroupNode) 及 5 分区吸附十字指示器',
          '全系统 20 大功能模块 100% 接入面板注册中心',
          '五套内置工作区预设与全自定义持久化',
          '应用内全功能悬浮窗模式 (Floating Panel Mode) 与一键停靠恢复',
        ],
        improvements: [
          '双向无损分割线缩放，拖拽期间挂载全局全屏指针遮罩',
          '布局与正文数据彻底解耦，调整排布不影响正文编辑与后台 Agent',
        ],
        bugfixes: [
          '修复 React Flow 画布与 ProseMirror 编辑器在多栏拖拽时的事件冲突',
        ],
        breakingChanges: [],
        knownIssues: [],
        rawBody: '',
      },
      {
        version: 'v2.0.0',
        date: '2026-10-13',
        summary: '小说多层级结构系统与独立剧情关系系统架构升级！',
        features: [
          '建立 系列 → 作品 → 部 → 卷 → 章 → 场景 → 节拍 8 层内容层级架构',
          '独立剧情因果矩阵：主线、支线、故事弧、人物成长弧、伏笔与并行线 M:N 关联网状结构',
          '章节拆分、合并、层级重编号与安全节点移动',
          '全局全站 UI 与文字大小等比缩放系统及日夜水墨模式',
        ],
        improvements: [
          '多 Agent 创作上下文递归向上追溯装配，注入关联因果与人物阶段',
          '大纲树模式与平铺章节表双模切换',
        ],
        bugfixes: [
          '修复正文字号调节在特定 CSS 优先级下的样式覆盖失效问题',
        ],
        breakingChanges: [],
        knownIssues: [],
        rawBody: '',
      },
      {
        version: 'v1.0.0',
        date: '2026-10-12',
        summary: 'NovelForge AI 商业正式版首发！本地优先的多 Agent 长篇小说创作系统。',
        features: [
          'Tiptap 沉浸式中文正文编辑器与不可逆版本抽屉快照',
          'OpenAI-compatible 模型网关与 SSE 逐字流式传输',
          '世界观设定管理 (Story Bible) 与 React Flow 人物动态关系拓扑图',
          '五层长期记忆引擎 (Memory Engine L0~L4) 与 SQLite FTS5 全文事实库',
          '多 Agent 协同流水线（编剧、作家、审稿、润色、记忆管理员）',
          '多 Agent 自动连载引擎 (Serialization Engine) 与安全定稿模式',
          'HTML5 独立电子书、网文 TXT、分级 Markdown 与全书工程 JSON 归档发布',
          'SQLite 在线热备份与数据库健康度维护诊断',
        ],
        improvements: [
          '全站宣纸/米纸/羊皮纸温润书卷美学体系',
          '真实人类打字动力学流式写作引擎 (Human Kinetics Model) 与客制化键盘麻将音',
        ],
        bugfixes: [],
        breakingChanges: [],
        knownIssues: [],
        rawBody: '',
      },
    ];

    try {
      // 尝试从 GitHub Releases 获取最新的公开发布记录
      const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases?per_page=10`, {
        headers: { Accept: 'application/vnd.github.v3+json' },
      });
      if (res.ok) {
        const releases = await res.json();
        if (Array.isArray(releases) && releases.length > 0) {
          const parsedReleases = releases.map((r: any) => {
            const v = r.tag_name || r.name || 'v0.0.0';
            const changelog = ChangelogParser.parse(r.body || '', v, r.published_at?.split('T')[0]);
            changelog.releaseUrl = r.html_url;
            return changelog;
          });
          // 按 SemVer 降序排序
          return parsedReleases.sort((a, b) => ChangelogParser.compareSemVer(b.version, a.version));
        }
      }
    } catch {
      // 网络无法访问时回退到本地基线
    }

    return fallbackHistory;
  }
}
