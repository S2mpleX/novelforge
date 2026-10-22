import { api } from '../utils/tauriBridge';
import type {
  Novel,
  Character,
  WorldRule,
  StoryArc,
  StoryPhase,
  PlotThread,
  Volume,
  Chapter,
} from '../types';

export interface StoryBibleExportData {
  novel: Novel;
  characters: Character[];
  worldRules: WorldRule[];
  storyArcs: StoryArc[];
  storyPhases: StoryPhase[];
  plotThreads: PlotThread[];
  volumes: Volume[];
  chapters: Chapter[];
}

export class StoryBibleExportService {
  /**
   * 收集小说全部设定要素并生成自包含的 HTML5 典藏故事圣经画册
   */
  static async exportStoryBibleHtml(novelId: string): Promise<string> {
    const novel = await api.getNovel(novelId);
    if (!novel) throw new Error('未找到当前作品');

    // 并行拉取全书设定要素
    const [
      characters,
      worldRules,
      storyArcs,
      storyPhases,
      plotThreads,
      volumes,
      chapters,
    ] = await Promise.all([
      api.listCharacters(novelId).catch(() => []),
      api.listWorldRules(novelId).catch(() => []),
      api.listStoryArcs(novelId).catch(() => []),
      api.listStoryPhases(novelId).catch(() => []),
      api.listPlotThreads(novelId).catch(() => []),
      api.listVolumes(novelId).catch(() => []),
      api.listChapters(novelId).catch(() => []),
    ]);

    const data: StoryBibleExportData = {
      novel,
      characters,
      worldRules,
      storyArcs,
      storyPhases,
      plotThreads,
      volumes,
      chapters,
    };

    return this.renderStoryBibleHtml(data);
  }

  /**
   * 渲染典藏级宋韵温润宣纸画报 HTML
   */
  static renderStoryBibleHtml(data: StoryBibleExportData): string {
    const {
      novel,
      characters,
      worldRules,
      storyArcs,
      storyPhases,
      plotThreads,
      volumes,
      chapters,
    } = data;

    const totalWords = chapters.reduce((acc, c) => acc + (c.word_count || 0), 0);
    const exportTime = new Date().toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // 权威法则分级 (authority_level: CANON / EXTENDED / HYPOTHESIS)
    const canonRules = worldRules.filter((r) => r.authority_level === 'CANON');
    const extendedRules = worldRules.filter((r) => r.authority_level === 'EXTENDED');
    const hypothesisRules = worldRules.filter(
      (r) => r.authority_level === 'HYPOTHESIS' || !r.authority_level
    );

    const safeTitle = (novel.title || '无题作品').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const safeDesc = (novel.description || '暂无作品梗概').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>《${safeTitle}》— 故事圣经 · 全景设定典藏集</title>
  <style>
    /* ================= 典藏宣纸水墨宋韵美学样式 ================= */
    :root {
      --bg-parchment: #f9f6f0;
      --bg-card: #ffffff;
      --bg-card-subtle: #f5f0e6;
      --border-ink: #e3dac9;
      --border-accent: #c4a47c;
      --text-main: #27221d;
      --text-muted: #796e62;
      --accent-cinnabar: #b9382b; /* 朱砂红 */
      --accent-gold: #9e6b28;     /* 沉香茶金 */
      --accent-jade: #2e6b52;     /* 苍璧竹青 */
      --accent-navy: #244158;     /* 黛青墨蓝 */
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background-color: var(--bg-parchment);
      color: var(--text-main);
      font-family: "Noto Serif SC", "Source Han Serif SC", "SimSun", "STSong", serif;
      line-height: 1.8;
      padding: 40px 20px;
    }

    .container {
      max-width: 1040px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid var(--border-ink);
      box-shadow: 0 10px 40px rgba(78, 62, 45, 0.08);
      border-radius: 4px;
      overflow: hidden;
    }

    /* 封面与顶栏扉页 */
    .hero-banner {
      background: linear-gradient(135deg, #f7f2e7 0%, #ede3d1 100%);
      border-bottom: 2px solid var(--border-accent);
      padding: 60px 48px;
      display: flex;
      gap: 36px;
      align-items: center;
      position: relative;
    }

    .hero-banner::after {
      content: "【故事圣经·典藏】";
      position: absolute;
      right: 32px;
      bottom: 24px;
      font-size: 13px;
      color: var(--accent-cinnabar);
      border: 1px solid var(--accent-cinnabar);
      padding: 2px 8px;
      border-radius: 2px;
      letter-spacing: 2px;
      opacity: 0.85;
    }

    .cover-box {
      width: 170px;
      height: 240px;
      border-radius: 4px;
      box-shadow: 8px 12px 28px rgba(39, 34, 29, 0.22);
      border: 1px solid rgba(0,0,0,0.1);
      overflow: hidden;
      flex-shrink: 0;
      background: #2a2521;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .cover-box img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .cover-fallback {
      color: #dfd8cc;
      text-align: center;
      padding: 20px;
      font-size: 18px;
      font-weight: bold;
      writing-mode: vertical-rl;
      letter-spacing: 4px;
    }

    .hero-meta h1 {
      font-size: 32px;
      color: var(--text-main);
      margin-bottom: 12px;
      font-weight: 800;
      letter-spacing: 1px;
    }

    .hero-meta .genre-badge {
      display: inline-block;
      padding: 2px 10px;
      background: var(--accent-gold);
      color: #ffffff;
      border-radius: 2px;
      font-size: 12px;
      letter-spacing: 1px;
      margin-bottom: 14px;
    }

    .hero-meta .synopsis {
      font-size: 14px;
      color: var(--text-muted);
      line-height: 1.8;
      max-width: 680px;
    }

    /* 数据总览看板 */
    .stats-bar {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 16px;
      padding: 24px 48px;
      background: #fbf9f5;
      border-bottom: 1px solid var(--border-ink);
    }

    .stat-item {
      text-align: center;
    }

    .stat-num {
      font-size: 24px;
      font-weight: bold;
      color: var(--accent-cinnabar);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }

    .stat-label {
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 2px;
    }

    /* 章节容器 */
    .section-wrap {
      padding: 44px 48px;
      border-bottom: 1px solid var(--border-ink);
    }

    .section-wrap:last-child {
      border-bottom: none;
    }

    .section-title {
      font-size: 20px;
      font-weight: bold;
      color: var(--text-main);
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 24px;
      padding-bottom: 8px;
      border-bottom: 2px solid var(--border-ink);
      position: relative;
    }

    .section-title::after {
      content: "";
      position: absolute;
      bottom: -2px;
      left: 0;
      width: 60px;
      height: 2px;
      background: var(--accent-gold);
    }

    /* 角色全景卡片网格 */
    .char-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(430px, 1fr));
      gap: 20px;
    }

    .char-card {
      background: var(--bg-card);
      border: 1px solid var(--border-ink);
      border-radius: 4px;
      padding: 18px;
      display: flex;
      gap: 18px;
      transition: box-shadow 0.2s;
    }

    .char-avatar-box {
      width: 90px;
      height: 120px;
      border-radius: 4px;
      overflow: hidden;
      flex-shrink: 0;
      background: #ebe4d8;
      border: 1px solid var(--border-ink);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .char-avatar-box img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .char-avatar-fallback {
      font-size: 26px;
      font-weight: bold;
      color: var(--accent-gold);
    }

    .char-info {
      flex: 1;
      min-width: 0;
    }

    .char-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
    }

    .char-name {
      font-size: 16px;
      font-weight: bold;
      color: var(--text-main);
    }

    .char-role-badge {
      font-size: 11px;
      padding: 1px 6px;
      border-radius: 2px;
      background: #f0e6d6;
      color: var(--accent-gold);
      font-weight: bold;
    }

    .char-visual {
      font-size: 12px;
      color: var(--text-muted);
      margin-bottom: 8px;
      line-height: 1.6;
      background: var(--bg-card-subtle);
      padding: 6px 8px;
      border-radius: 2px;
    }

    .char-props {
      font-size: 12px;
      line-height: 1.7;
    }

    .char-props strong {
      color: var(--accent-gold);
    }

    /* 世界观法则列表 */
    .rule-category-title {
      font-size: 14px;
      font-weight: bold;
      color: var(--accent-navy);
      margin: 18px 0 10px 0;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .rule-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      margin-bottom: 20px;
    }

    .rule-table th, .rule-table td {
      border: 1px solid var(--border-ink);
      padding: 10px 14px;
      text-align: left;
    }

    .rule-table th {
      background: #f7f2e7;
      font-weight: bold;
      color: var(--text-main);
    }

    .rule-table tr:nth-child(even) {
      background: #fcfbfa;
    }

    .badge-canon {
      display: inline-block;
      padding: 1px 6px;
      font-size: 10px;
      background: #fbeae8;
      color: var(--accent-cinnabar);
      border: 1px solid #f3c2bc;
      border-radius: 2px;
      font-weight: bold;
    }

    /* 剧情弧与伏笔 */
    .arcs-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }

    .arc-card {
      border: 1px solid var(--border-ink);
      border-radius: 4px;
      padding: 14px;
      background: var(--bg-card);
    }

    .arc-title {
      font-size: 14px;
      font-weight: bold;
      color: var(--accent-navy);
      margin-bottom: 6px;
    }

    .arc-desc {
      font-size: 12px;
      color: var(--text-muted);
      line-height: 1.6;
    }

    /* 卷章总览 */
    .volume-block {
      margin-bottom: 20px;
      border: 1px solid var(--border-ink);
      border-radius: 4px;
      overflow: hidden;
    }

    .volume-header {
      background: #f7f2e7;
      padding: 10px 16px;
      font-weight: bold;
      font-size: 14px;
      border-bottom: 1px solid var(--border-ink);
      display: flex;
      justify-content: space-between;
    }

    .chapters-list {
      padding: 12px 16px;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 10px;
      font-size: 12px;
    }

    .chapter-pill {
      display: flex;
      justify-content: space-between;
      padding: 4px 8px;
      background: #faf7f2;
      border-radius: 2px;
      border: 1px solid #ebe5da;
    }

    /* 页尾 */
    .footer {
      text-align: center;
      padding: 30px;
      font-size: 12px;
      color: var(--text-muted);
      background: #f7f2e7;
      border-top: 1px solid var(--border-ink);
    }

    /* 打印优化 (Ctrl+P 转 PDF 画册) */
    @media print {
      body { background: #ffffff; padding: 0; }
      .container { box-shadow: none; border: none; }
      .section-wrap { page-break-inside: avoid; }
      .hero-banner { page-break-after: always; }
      .char-card { page-break-inside: avoid; }
      .print-hide { display: none; }
    }
  </style>
</head>
<body>

<div class="container">
  <!-- 扉页封面 -->
  <div class="hero-banner">
    <div class="cover-box">
      ${
        novel.cover_url
          ? `<img src="${novel.cover_url}" alt="作品封面" />`
          : `<div class="cover-fallback">${safeTitle}</div>`
      }
    </div>
    <div class="hero-meta">
      <h1>《${safeTitle}》</h1>
      <span class="genre-badge">${novel.genre_profile || '文学创作'}</span>
      <p class="synopsis">${safeDesc}</p>
    </div>
  </div>

  <!-- 全书宏观统计 -->
  <div class="stats-bar">
    <div class="stat-item">
      <div class="stat-num">${totalWords.toLocaleString()}</div>
      <div class="stat-label">全书字数</div>
    </div>
    <div class="stat-item">
      <div class="stat-num">${chapters.length}</div>
      <div class="stat-label">章节总数</div>
    </div>
    <div class="stat-item">
      <div class="stat-num">${volumes.length}</div>
      <div class="stat-label">分卷规划</div>
    </div>
    <div class="stat-item">
      <div class="stat-num">${characters.length}</div>
      <div class="stat-label">登场人物</div>
    </div>
    <div class="stat-item">
      <div class="stat-num">${worldRules.length}</div>
      <div class="stat-label">世界观法则</div>
    </div>
    <div class="stat-item">
      <div class="stat-num">${plotThreads.length}</div>
      <div class="stat-label">伏笔暗线</div>
    </div>
  </div>

  <!-- 1. 角色全景谱系与立绘画册 -->
  <div class="section-wrap">
    <h2 class="section-title">👤 角色全景谱系与人物档案</h2>
    ${
      characters.length === 0
        ? '<p style="color: var(--text-muted); font-size: 13px;">暂未录入角色档案。</p>'
        : `<div class="char-grid">
            ${characters
              .map((c) => {
                const avatarImg = c.avatar_url
                  ? `<img src="${c.avatar_url}" alt="${c.name}" />`
                  : `<div class="char-avatar-fallback">${c.name.slice(0, 1)}</div>`;

                return `
                <div class="char-card">
                  <div class="char-avatar-box">
                    ${avatarImg}
                  </div>
                  <div class="char-info">
                    <div class="char-header">
                      <div>
                        <span class="char-name">${c.name}</span>
                        ${c.aliases ? `<span style="font-size: 12px; color: var(--text-muted); margin-left: 6px;">（${c.aliases}）</span>` : ''}
                      </div>
                      <span class="char-role-badge">${c.status || '活跃'}</span>
                    </div>
                    ${
                      c.visual_summary
                        ? `<div class="char-visual">👁️ <strong>外貌描写：</strong>${c.visual_summary}</div>`
                        : ''
                    }
                    <div class="char-props">
                      ${c.personality ? `<div><strong>性格特质：</strong>${c.personality}</div>` : ''}
                      ${c.motivation ? `<div><strong>核心动机：</strong>${c.motivation}</div>` : ''}
                      ${c.background ? `<div><strong>生平经历：</strong>${c.background}</div>` : ''}
                    </div>
                  </div>
                </div>
              `;
              })
              .join('')}
          </div>`
    }
  </div>

  <!-- 2. 世界观法则与因果真理 -->
  <div class="section-wrap">
    <h2 class="section-title">🌌 世界观真理与超凡公理体系</h2>
    ${
      worldRules.length === 0
        ? '<p style="color: var(--text-muted); font-size: 13px;">暂未录入世界观法则。</p>'
        : `
          ${
            canonRules.length > 0
              ? `
              <div class="rule-category-title">👑 权威正典公理 (CANON - 不可动摇的基础真理)</div>
              <table class="rule-table">
                <thead><tr><th style="width: 25%;">法则名称</th><th>法则内容与运行逻辑</th><th style="width: 20%;">权威级别</th></tr></thead>
                <tbody>
                  ${canonRules
                    .map(
                      (r) =>
                        `<tr><td><strong>${r.title}</strong></td><td>${r.rule_content}</td><td>${r.authority_level}</td></tr>`
                    )
                    .join('')}
                </tbody>
              </table>
              `
              : ''
          }

          ${
            extendedRules.length > 0
              ? `
              <div class="rule-category-title">📜 拓展设定公理 (EXTENDED - 势力、地理与次级法则)</div>
              <table class="rule-table">
                <thead><tr><th style="width: 25%;">法则名称</th><th>法则内容</th><th style="width: 20%;">权威级别</th></tr></thead>
                <tbody>
                  ${extendedRules
                    .map(
                      (r) =>
                        `<tr><td><strong>${r.title}</strong></td><td>${r.rule_content}</td><td>${r.authority_level}</td></tr>`
                    )
                    .join('')}
                </tbody>
              </table>
              `
              : ''
          }

          ${
            hypothesisRules.length > 0
              ? `
              <div class="rule-category-title">💡 假说推演 (HYPOTHESIS - 未定论传闻与谜题)</div>
              <table class="rule-table">
                <thead><tr><th style="width: 25%;">法则名称</th><th>法则内容</th><th style="width: 20%;">权威级别</th></tr></thead>
                <tbody>
                  ${hypothesisRules
                    .map(
                      (r) =>
                        `<tr><td><strong>${r.title}</strong></td><td>${r.rule_content}</td><td>${r.authority_level || 'HYPOTHESIS'}</td></tr>`
                    )
                    .join('')}
                </tbody>
              </table>
              `
              : ''
          }
        `
    }
  </div>

  <!-- 3. 大纲阶段与剧情弧 -->
  <div class="section-wrap">
    <h2 class="section-title">📜 宏观故事大纲与剧情弧线规划</h2>
    ${
      storyPhases.length > 0
        ? `
        <div style="margin-bottom: 20px;">
          <div class="rule-category-title">🏛️ 宏观创作阶段划分</div>
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            ${storyPhases
              .map(
                (p, idx) =>
                  `<span style="padding: 4px 12px; background: #f7f2e7; border: 1px solid var(--border-ink); border-radius: 4px; font-size: 13px;">第 ${idx + 1} 阶段：<strong>${p.title}</strong></span>`
              )
              .join('')}
          </div>
        </div>
        `
        : ''
    }
    ${
      storyArcs.length === 0
        ? '<p style="color: var(--text-muted); font-size: 13px;">暂未规划剧情弧线。</p>'
        : `<div class="arcs-grid">
            ${storyArcs
              .map(
                (arc) => `
              <div class="arc-card">
                <div class="arc-title">⚡ ${arc.title}</div>
                <div class="arc-desc">${arc.description || arc.goal || '推进阶段核心主线矛盾'}</div>
              </div>
            `
              )
              .join('')}
          </div>`
    }
  </div>

  <!-- 4. 伏笔暗线追踪账本 -->
  <div class="section-wrap">
    <h2 class="section-title">🗝️ 伏笔线索与悬念暗线追踪</h2>
    ${
      plotThreads.length === 0
        ? '<p style="color: var(--text-muted); font-size: 13px;">暂无伏笔暗线记录。</p>'
        : `
          <table class="rule-table">
            <thead><tr><th style="width: 30%;">伏笔线索</th><th>埋设意图与线索细节</th><th style="width: 15%;">状态</th></tr></thead>
            <tbody>
              ${plotThreads
                .map(
                  (pt) => `
                <tr>
                  <td><strong>${pt.title}</strong></td>
                  <td>${pt.description || '暗埋因果钩子'}</td>
                  <td><span class="badge-canon">${pt.status}</span></td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        `
    }
  </div>

  <!-- 5. 分卷与目录大纲 -->
  <div class="section-wrap">
    <h2 class="section-title">📑 分卷规划与章节目录总目</h2>
    ${
      volumes.length === 0
        ? '<p style="color: var(--text-muted); font-size: 13px;">全书尚未划分卷。</p>'
        : volumes
            .map((vol, idx) => {
              const volChapters = chapters.filter((c) => c.volume_id === vol.id);
              const volWordCount = volChapters.reduce((acc, c) => acc + (c.word_count || 0), 0);
              const volNum = vol.sequence || idx + 1;

              return `
              <div class="volume-block">
                <div class="volume-header">
                  <span>第 ${volNum} 卷：${vol.title}</span>
                  <span style="font-weight: normal; color: var(--text-muted); font-size: 12px;">共 ${volChapters.length} 章 · ${volWordCount.toLocaleString()} 字</span>
                </div>
                <div class="chapters-list">
                  ${volChapters
                    .map(
                      (ch) => `
                    <div class="chapter-pill">
                      <span>第 ${ch.chapter_number} 章 ${ch.title}</span>
                      <span style="color: var(--text-muted); font-size: 11px;">${ch.word_count || 0}字</span>
                    </div>
                  `
                    )
                    .join('')}
                </div>
              </div>
            `;
            })
            .join('')
    }
  </div>

  <!-- 页尾 -->
  <div class="footer">
    <p>NovelForge AI 专为长篇小说创作打造 · 长期记忆与世界观权威引擎驱动</p>
    <p style="margin-top: 4px; opacity: 0.8;">导出时间：${exportTime} · 典藏故事圣经设定集画册</p>
  </div>
</div>

</body>
</html>`;
  }
}
