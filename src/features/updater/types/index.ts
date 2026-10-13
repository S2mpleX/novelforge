export type UpdateStatus =
  | 'IDLE'              // 尚未检查更新
  | 'CHECKING'          // 正在检查更新中
  | 'UP_TO_DATE'        // 当前已是最新版本
  | 'UPDATE_AVAILABLE'  // 发现新版本，等待用户操作
  | 'PRECHECKING'       // 正在进行升级前数据安全与未保存检查
  | 'DOWNLOADING'       // 正在下载更新安装包
  | 'DOWNLOADED'        // 下载完成，等待安装确认
  | 'INSTALLING'        // 正在执行安装流程
  | 'RESTART_REQUIRED'  // 安装完成，需要重新启动
  | 'ERROR_CHECK'       // 检查更新失败（网络故障、服务不可达等）
  | 'ERROR_DOWNLOAD'    // 下载安装包失败（网络中断、校验失败等）
  | 'ERROR_INSTALL';    // 安装启动失败或权限受阻

export interface DownloadProgress {
  contentLength: number;       // 总大小（字节），未知时为 0
  downloadedBytes: number;     // 已下载大小（字节）
  percent: number | null;      // 0~100 精准百分比，仅在已知总大小时计算，未知时为 null
  speedBytesPerSec: number;    // 当前下载速度（字节/秒）
  statusText: string;          // 当前下载阶段描述
  errorMessage: string | null; // 错误信息
}

export interface StructuredChangelog {
  version: string;
  date: string;
  summary: string;
  features: string[];
  improvements: string[];
  bugfixes: string[];
  breakingChanges: string[];
  knownIssues: string[];
  releaseUrl?: string;
  downloadUrl?: string;
  rawBody: string;
}

export interface UpdateInfo {
  currentVersion: string;
  latestVersion: string;
  releaseDate?: string;
  changelog: StructuredChangelog;
  signature?: string;
  isAvailable: boolean;
}

export interface UpdateSettings {
  checkOnStartup: boolean;        // 启动时自动检查更新（默认开启）
  checkIntervalHours: number;     // 自动检查间隔（小时），24 为每 24 小时检查一次，0 为仅手动检查
  notifyNewVersion: boolean;      // 发现新版本时在界面弹出通知（默认开启）
  autoDownload: boolean;          // 是否在发现新版本后后台自动预下载（默认关闭，需用户确认）
  promptBeforeInstall: boolean;   // 是否在安装前提示保存与确认（默认开启）
  skippedVersions: string[];      // 用户选择跳过的版本号（如跳过非关键修复）
  lastCheckedTimestamp: number;   // 上次检查成功的时间戳
}

export interface DataSafetyPrecheckResult {
  canProceed: boolean;            // 是否允许继续更新
  unsavedEditorContent: boolean;  // 编辑器中是否存在未保存修改
  unsavedDetails?: string;        // 未保存章节信息
  activeAgentJobs: boolean;       // 是否有正在运行的多 Agent 任务
  activeJobDetails?: string;      // 运行中任务详情
  backupCreated: boolean;         // 是否已成功创建更新前数据库热备份
  backupPath?: string;            // 备份文件绝对路径
  databaseIntegrityOk: boolean;   // SQLite 数据库完整性检查结果
  integrityReport?: string;       // 完整性诊断信息
  errorMessage?: string;          // 阻断或失败原因
}
