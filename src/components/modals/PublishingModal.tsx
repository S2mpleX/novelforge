import React, { useState, useEffect } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { api } from '@/utils/tauriBridge';
import { StoryBibleExportService } from '@/services/StoryBibleExportService';
import type { DatabaseHealthReport } from '@/types';
import {
  X,
  Download,
  Upload,
  BookOpen,
  FileCode,
  FileText,
  Database,
  ShieldCheck,
  HardDrive,
  RefreshCw,
  CheckCircle2,
  Archive,
  Sparkles,
  Printer,
} from 'lucide-react';

interface PublishingModalProps {
  onClose: () => void;
}

export const PublishingModal: React.FC<PublishingModalProps> = ({ onClose }) => {
  const { activeNovel, chapters, loadNovels, selectNovel } = useNovelStore();

  const [activeTab, setActiveTab] = useState<'EXPORT' | 'IMPORT' | 'DIAGNOSTICS'>('EXPORT');
  const [healthReport, setHealthReport] = useState<DatabaseHealthReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Import State
  const [importJsonText, setImportJsonText] = useState('');

  useEffect(() => {
    loadDiagnostics();
  }, []);

  const loadDiagnostics = async () => {
    try {
      const rep = await api.optimizeDatabase();
      setHealthReport(rep);
    } catch (e) {
      console.error('获取诊断信息失败:', e);
    }
  };

  const showNotification = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 4000);
  };

  const getSafeTitle = (title?: string) => {
    return (title || 'novel').replace(/[\/\\:*?"<>|]/g, '_').trim() || 'novel';
  };

  // 1. Export HTML Book
  const handleExportHtmlBook = async () => {
    if (!activeNovel) return;
    setLoading(true);
    try {
      const html = await api.exportNovelHtmlBook(activeNovel.id);
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeTitle = getSafeTitle(activeNovel.title);
      a.download = `《${safeTitle}》_电子书.html`;
      a.click();
      URL.revokeObjectURL(url);
      showNotification('🎉 独立 HTML5 电子书导出成功！支持任意设备离线畅读。');
    } catch (e: any) {
      showNotification(`导出失败: ${e.message || e}`);
    } finally {
      setLoading(false);
    }
  };

  // 2. Export Standard EPUB 3 Book
  const handleExportEpubBook = async () => {
    if (!activeNovel) return;
    setLoading(true);
    try {
      const res = await api.exportNovelEpub(activeNovel.id);
      showNotification(`🎉 标准 EPUB 3 电子书导出成功！文件位置: ${res.file_path} (${(res.file_size / 1024).toFixed(1)} KB)`);
    } catch (e: any) {
      showNotification(`EPUB 导出失败: ${e.message || e}`);
    } finally {
      setLoading(false);
    }
  };

  // 3. Export Standard Web Novel TXT
  const handleExportTxt = async () => {
    if (!activeNovel) return;
    setLoading(true);
    try {
      const text = await api.exportNovelText(activeNovel.id, 'txt');
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeTitle = getSafeTitle(activeNovel.title);
      a.download = `《${safeTitle}》_全本连载.txt`;
      a.click();
      URL.revokeObjectURL(url);
      showNotification('标准排版 TXT 文本已导出！');
    } catch (e: any) {
      showNotification(`导出失败: ${e.message || e}`);
    } finally {
      setLoading(false);
    }
  };

  // 3. Export Markdown
  const handleExportMarkdown = async () => {
    if (!activeNovel) return;
    setLoading(true);
    try {
      const text = await api.exportNovelText(activeNovel.id, 'markdown');
      const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeTitle = getSafeTitle(activeNovel.title);
      a.download = `《${safeTitle}》_全本.md`;
      a.click();
      URL.revokeObjectURL(url);
      showNotification('全书 Markdown 导出成功！');
    } catch (e: any) {
      showNotification(`导出失败: ${e.message || e}`);
    } finally {
      setLoading(false);
    }
  };

  // 4. Export Full Project Archive JSON
  const handleExportArchiveJson = async () => {
    if (!activeNovel) return;
    setLoading(true);
    try {
      const json = await api.exportNovelArchive(activeNovel.id);
      const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeTitle = getSafeTitle(activeNovel.title);
      a.download = `${safeTitle}_full_archive.novelforge.json`;
      a.click();
      URL.revokeObjectURL(url);
      showNotification('全书完整工程快照已导出（含设定集、人物网与记忆）！');
    } catch (e: any) {
      showNotification(`归档导出失败: ${e.message || e}`);
    } finally {
      setLoading(false);
    }
  };

  // 5. Export Story Bible Visual Booklet (HTML / PDF)
  const handleExportStoryBibleHtml = async () => {
    if (!activeNovel) return;
    setLoading(true);
    try {
      const html = await StoryBibleExportService.exportStoryBibleHtml(activeNovel.id);
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeTitle = getSafeTitle(activeNovel.title);
      a.download = `《${safeTitle}》_故事圣经全景设定集.html`;
      a.click();
      URL.revokeObjectURL(url);
      showNotification('🎉 典藏故事圣经 · 全景设定画册导出成功！支持双击离线查阅或 Ctrl+P 打印为 PDF。');
    } catch (e: any) {
      showNotification(`设定集导出失败: ${e.message || e}`);
    } finally {
      setLoading(false);
    }
  };

  // 6. Direct Print / Save as PDF Story Bible
  const handlePrintPreviewStoryBible = async () => {
    if (!activeNovel) return;
    setLoading(true);
    try {
      const html = await StoryBibleExportService.exportStoryBibleHtml(activeNovel.id);
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 500);
        showNotification('🎉 已唤起故事圣经画报打印与 PDF 保存窗口。在打印预览中选择「另存为 PDF」即可导出高清画册。');
      } else {
        // Fallback for pop-up blocker: download HTML
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const safeTitle = getSafeTitle(activeNovel.title);
        a.download = `《${safeTitle}》_故事圣经全景设定集.html`;
        a.click();
        URL.revokeObjectURL(url);
        showNotification('已下载 HTML 设定集，双击打开后按 Ctrl+P 即可直接打印或存为 PDF。');
      }
    } catch (e: any) {
      showNotification(`打印画报失败: ${e.message || e}`);
    } finally {
      setLoading(false);
    }
  };

  // 5. Import Archive
  const handleImportArchive = async () => {
    if (!importJsonText.trim()) {
      showNotification('请先粘贴工程归档 JSON 内容。');
      return;
    }
    setLoading(true);
    try {
      const imported = await api.importNovelArchive(importJsonText.trim());
      await loadNovels();
      await selectNovel(imported);
      setImportJsonText('');
      showNotification(`🎉 成功复原并导入新小说《${imported.title}》！`);
    } catch (e: any) {
      showNotification(`导入失败: ${e.message || e}`);
    } finally {
      setLoading(false);
    }
  };

  // 6. Online Database Hot Backup
  const handleBackupDatabase = async () => {
    setLoading(true);
    try {
      const path = await api.backupDatabase();
      showNotification(`✅ 数据库在线热备份成功！备份文件位于：${path}`);
      await loadDiagnostics();
    } catch (e: any) {
      showNotification(`备份失败: ${e.message || e}`);
    } finally {
      setLoading(false);
    }
  };

  // 7. Optimize Database
  const handleOptimizeDatabase = async () => {
    setLoading(true);
    try {
      const rep = await api.optimizeDatabase();
      setHealthReport(rep);
      showNotification('✅ 数据库 VACUUM 与完整性优化已完成，索引健康度已刷新！');
    } catch (e: any) {
      showNotification(`优化失败: ${e.message || e}`);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-surface border border-line rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-line bg-surface-2">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#854d0e] flex items-center justify-center text-[#fdfbf7] shadow-xs">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-serif font-bold text-ink">发布交付与系统灾备 · Publishing & Diagnostics</h2>
                <span className="px-2.5 py-0.5 text-[11px] font-serif font-semibold bg-canvas text-primary border border-line rounded-full">
                  出版交付
                </span>
              </div>
              <p className="text-xs text-ink-2 font-serif mt-0.5">
                多格式出版排版导出、全书工程数据快照、SQLite 数据库热备份与健康度诊断
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-2 hover:text-ink hover:bg-surface-3-hover transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 px-6 pt-3.5 border-b border-line bg-surface-2/50">
          <button
            onClick={() => setActiveTab('EXPORT')}
            className={`pb-3 px-3.5 text-xs font-serif font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'EXPORT'
                ? 'border-[#854d0e] text-primary'
                : 'border-transparent text-ink-2 hover:text-ink'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            多格式发布与导出
          </button>
          <button
            onClick={() => setActiveTab('IMPORT')}
            className={`pb-3 px-3.5 text-xs font-serif font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'IMPORT'
                ? 'border-[#854d0e] text-primary'
                : 'border-transparent text-ink-2 hover:text-ink'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            工程快照复原与导入
          </button>
          <button
            onClick={() => setActiveTab('DIAGNOSTICS')}
            className={`pb-3 px-3.5 text-xs font-serif font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'DIAGNOSTICS'
                ? 'border-[#854d0e] text-primary'
                : 'border-transparent text-ink-2 hover:text-ink'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            数据库运维与热备份
          </button>
        </div>

        {/* Notification Toast */}
        {actionMessage && (
          <div className="mx-6 mt-4 p-3 bg-surface-2 border border-line rounded-lg text-xs font-serif text-[#047857] flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-[#047857] shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6 bg-surface">
          {activeTab === 'EXPORT' && (
            <div className="space-y-6">
              {activeNovel ? (
                <div className="bg-surface p-4 rounded-xl border border-line flex items-center justify-between shadow-2xs">
                  <div>
                    <span className="text-xs text-ink-2 font-serif">待发布作品</span>
                    <h3 className="text-sm font-serif font-bold text-ink mt-0.5">{activeNovel.title}</h3>
                    <p className="text-xs text-ink-2 font-serif mt-1">
                      题材：{activeNovel.genre_profile || '通用'} ｜ 包含 {chapters.length} 章节
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-ink-2 font-serif">全书预估总字数</span>
                    <div className="text-base font-serif font-bold text-primary mt-0.5">
                      {chapters.reduce((sum, ch) => sum + ch.word_count, 0)} 字
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-[#fef3c7] border border-[#fde68a] rounded-lg text-primary text-xs font-serif">
                  请先在左侧选择一部小说再执行导出。
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. HTML5 Book */}
                <div className="bg-surface p-5 rounded-xl border border-line hover:border-[#854d0e]/60 transition space-y-3 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-surface-2 text-primary border border-line">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-serif font-bold text-ink">独立 HTML5 电子书单文件</h4>
                      <p className="text-[11px] text-ink-2 font-serif">含侧边栏悬浮目录、羊皮纸/深色三套主题</p>
                    </div>
                  </div>
                  <p className="text-xs text-ink-2 font-serif leading-relaxed">
                    单文件 HTML，内嵌离线样式表与排版脚本。双击即可在任何电脑、平板或手机浏览器直接畅读，阅读体验极佳。
                  </p>
                  <button
                    onClick={handleExportHtmlBook}
                    disabled={loading || !activeNovel}
                    className="w-full py-2 bg-[#854d0e] hover:bg-[#713f12] text-[#fdfbf7] rounded-lg text-xs font-serif font-medium flex items-center justify-center gap-1.5 transition disabled:opacity-50 shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    导出 HTML5 电子书
                  </button>
                </div>

                {/* 2. Standard EPUB 3 */}
                <div className="bg-surface p-5 rounded-xl border border-line hover:border-[#854d0e]/60 transition space-y-3 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-surface-2 text-primary border border-line">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-sm font-serif font-bold text-ink">标准 EPUB 3 电子书 (.epub)</h4>
                      <p className="text-[11px] text-ink-2 font-serif">国际标准格式，兼容微信读书、Kindle、多看与电纸书</p>
                    </div>
                  </div>
                  <p className="text-xs text-ink-2 font-serif leading-relaxed">
                    严格遵循 IDPF 规范，内嵌典雅水墨封面、层级目录导航（NCX/Nav）与宣纸排版 CSS，支持无缝导入微信读书与各品牌墨水屏阅读器。
                  </p>
                  <button
                    onClick={handleExportEpubBook}
                    disabled={loading || !activeNovel}
                    className="w-full py-2 bg-[#854d0e] hover:bg-[#713f12] text-[#fdfbf7] rounded-lg text-xs font-serif font-medium flex items-center justify-center gap-1.5 transition disabled:opacity-50 shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    导出标准 EPUB 3
                  </button>
                </div>

                {/* 3. Web Novel TXT */}
                <div className="bg-surface p-5 rounded-xl border border-line hover:border-[#854d0e]/60 transition space-y-3 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-surface-2 text-primary border border-line">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-serif font-bold text-ink">标准网文连载 TXT 文本</h4>
                      <p className="text-[11px] text-ink-2 font-serif">规范章名居中、段首双全角空格缩进</p>
                    </div>
                  </div>
                  <p className="text-xs text-ink-2 font-serif leading-relaxed">
                    严格遵循国内主流小说连载网站（起点、番茄等）规范排版，自动去除多余空行，开箱即用直接上传。
                  </p>
                  <button
                    onClick={handleExportTxt}
                    disabled={loading || !activeNovel}
                    className="w-full py-2 bg-surface-2 hover:bg-surface-3-hover text-ink rounded-lg text-xs font-serif font-medium flex items-center justify-center gap-1.5 transition disabled:opacity-50 border border-line"
                  >
                    <Download className="w-3.5 h-3.5" />
                    导出连载 TXT 文本
                  </button>
                </div>

                {/* 3. Markdown */}
                <div className="bg-surface p-5 rounded-xl border border-line hover:border-[#854d0e]/60 transition space-y-3 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-surface-2 text-primary border border-line">
                      <FileCode className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-serif font-bold text-ink">标准分级 Markdown 格式</h4>
                      <p className="text-[11px] text-ink-2 font-serif">保留 H1/H2 标题层级与元数据引言</p>
                    </div>
                  </div>
                  <p className="text-xs text-ink-2 font-serif leading-relaxed">
                    方便导入 Obsidian、Notion 或其他知识库与排版工具进行后续二创、精排与静态站发布。
                  </p>
                  <button
                    onClick={handleExportMarkdown}
                    disabled={loading || !activeNovel}
                    className="w-full py-2 bg-surface-2 hover:bg-surface-3-hover text-ink rounded-lg text-xs font-serif font-medium flex items-center justify-center gap-1.5 transition disabled:opacity-50 border border-line"
                  >
                    <Download className="w-3.5 h-3.5" />
                    导出全书 Markdown
                  </button>
                </div>

                {/* 4. Full Project Archive JSON */}
                <div className="bg-surface p-5 rounded-xl border border-line hover:border-[#854d0e]/60 transition space-y-3 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-surface-2 text-primary border border-line">
                      <Archive className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-serif font-bold text-ink">全书工程数据归档快照 (JSON)</h4>
                      <p className="text-[11px] text-ink-2 font-serif">包含设定集、人物网、记忆事实与版本</p>
                    </div>
                  </div>
                  <p className="text-xs text-ink-2 font-serif leading-relaxed">
                    一揽子打包小说元数据、所有章节正文、全部角色图谱、世界观法则与五层记忆库，支持跨设备无损迁移。
                  </p>
                  <button
                    onClick={handleExportArchiveJson}
                    disabled={loading || !activeNovel}
                    className="w-full py-2 bg-[#854d0e] hover:bg-[#713f12] text-[#fdfbf7] rounded-lg text-xs font-serif font-medium flex items-center justify-center gap-1.5 transition disabled:opacity-50 shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    导出工程归档快照
                  </button>
                </div>

                {/* 5. Story Bible Visual Booklet (HTML5 / PDF) */}
                <div className="md:col-span-2 bg-gradient-to-br from-[#faf6ee] to-[#f4ebe0] dark:from-[#25201b] dark:to-[#1d1915] p-5 rounded-xl border-2 border-amber-600/40 hover:border-amber-600 transition space-y-3 shadow-sm relative overflow-hidden">
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-sans font-bold bg-amber-600 text-white tracking-wide">
                    ✨ 典藏全景图文画报
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-amber-600 text-white shadow-xs">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-serif font-bold text-ink flex items-center gap-2">
                        典藏故事圣经 · 全景设定画册 (.html / 打印画报)
                      </h4>
                      <p className="text-[11px] text-ink-2 font-serif">
                        全书人物立绘画册、世界观真理正典、剧情弧大纲、伏笔因果链与卷章总目
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-ink-2 font-serif leading-relaxed max-w-2xl">
                    一键排版导出为唯美宋韵温润宣纸画报。内嵌角色高精立绘与外貌特征、世界观权威法则分级、伏笔线索追踪与分卷字数统计。支持任意手机/电脑免网双击畅览，亦可直接通过浏览器 <strong>Ctrl+P</strong> 完美打印转存为实体 PDF 设定集。
                  </p>
                  <div className="pt-1 flex flex-wrap items-center gap-3">
                    <button
                      onClick={handleExportStoryBibleHtml}
                      disabled={loading || !activeNovel}
                      className="px-4 py-2.5 bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-white rounded-lg text-xs font-serif font-medium flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-sm cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      导出全景设定集 (.html)
                    </button>

                    <button
                      onClick={handlePrintPreviewStoryBible}
                      disabled={loading || !activeNovel}
                      className="px-4 py-2.5 bg-surface-2 hover:bg-surface-3 text-ink border border-line rounded-lg text-xs font-serif font-medium flex items-center justify-center gap-1.5 transition disabled:opacity-50 cursor-pointer shadow-2xs"
                      title="直接弹出画报打印预览窗口，可选择「另存为 PDF」导出典藏画册"
                    >
                      <Printer className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                      打印画报 / 存为 PDF
                    </button>

                    <span className="text-[11px] text-stone-500 font-sans">
                      💡 提示：支持离线双击畅览，或按 Ctrl+P 存为高精 PDF 画册
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'IMPORT' && (
            <div className="bg-surface p-5 rounded-xl border border-line space-y-4 shadow-2xs">
              <div className="flex items-center gap-2 text-xs text-ink font-serif font-bold">
                <Upload className="w-4 h-4 text-primary" />
                <span>从工程归档 JSON 还原小说</span>
              </div>
              <p className="text-xs text-ink-2 font-serif">
                粘贴导出的 `.novelforge.json` 归档内容。系统将在本地 SQLite 中自动建立副本并完整恢复其章节、人物关系、世界观法则与长期记忆。
              </p>
              <textarea
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder='在此粘贴 {"novel": {...}, "chapters": [...], "characters": [...]} JSON 字符串...'
                rows={10}
                className="w-full p-3 bg-surface border border-line rounded-lg text-xs font-mono text-ink focus:outline-hidden focus:border-[#854d0e]"
              />
              <button
                onClick={handleImportArchive}
                disabled={loading || !importJsonText.trim()}
                className="py-2.5 px-6 rounded-lg bg-[#854d0e] hover:bg-[#713f12] text-[#fdfbf7] font-serif font-medium text-xs flex items-center gap-2 transition disabled:opacity-50 shadow-xs"
              >
                <Upload className="w-4 h-4" />
                解析并还原整部作品
              </button>
            </div>
          )}

          {activeTab === 'DIAGNOSTICS' && (
            <div className="space-y-6">
              {/* Storage & Health Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-surface p-4 rounded-xl border border-line shadow-2xs">
                  <span className="text-xs text-ink-2 font-serif">数据库体积</span>
                  <div className="text-base font-serif font-bold text-ink mt-1 flex items-center gap-1.5">
                    <HardDrive className="w-4 h-4 text-primary" />
                    {healthReport ? formatBytes(healthReport.db_size_bytes) : '计算中...'}
                  </div>
                </div>

                <div className="bg-surface p-4 rounded-xl border border-line shadow-2xs">
                  <span className="text-xs text-ink-2 font-serif">完整性检查</span>
                  <div className="text-base font-serif font-bold text-[#047857] mt-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    {healthReport?.integrity_status === 'ok' ? '健康 (OK)' : healthReport?.integrity_status || '检查中'}
                  </div>
                </div>

                <div className="bg-surface p-4 rounded-xl border border-line shadow-2xs">
                  <span className="text-xs text-ink-2 font-serif">已存作品 / 章节</span>
                  <div className="text-base font-serif font-bold text-ink mt-1">
                    {healthReport?.total_novels ?? 0} 部 / {healthReport?.total_chapters ?? 0} 章
                  </div>
                </div>

                <div className="bg-surface p-4 rounded-xl border border-line shadow-2xs">
                  <span className="text-xs text-ink-2 font-serif">权威事实 / 历史版本</span>
                  <div className="text-base font-serif font-bold text-ink mt-1">
                    {healthReport?.total_canon_facts ?? 0} 条 / {healthReport?.total_versions ?? 0} 份
                  </div>
                </div>
              </div>

              {/* Path & Operations */}
              <div className="bg-surface p-5 rounded-xl border border-line space-y-4 shadow-2xs">
                <div className="space-y-1">
                  <span className="text-xs text-ink-2 font-serif font-medium">SQLite 物理存储绝对路径</span>
                  <p className="text-xs font-mono text-ink bg-surface p-2.5 rounded-lg border border-line break-all select-all">
                    {healthReport?.db_path || '正在读取路径...'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={handleBackupDatabase}
                    disabled={loading}
                    className="py-2.5 px-4 rounded-lg bg-[#854d0e] hover:bg-[#713f12] text-[#fdfbf7] font-serif font-medium text-xs flex items-center gap-1.5 transition shadow-xs disabled:opacity-50"
                  >
                    <Database className="w-4 h-4" />
                    立即创建在线热备份 (.db)
                  </button>

                  <button
                    onClick={handleOptimizeDatabase}
                    disabled={loading}
                    className="py-2.5 px-4 rounded-lg bg-surface-2 hover:bg-surface-3-hover text-ink font-serif font-medium text-xs flex items-center gap-1.5 transition border border-line disabled:opacity-50"
                  >
                    <RefreshCw className="w-4 h-4" />
                    执行碎片整理与 VACUUM 优化
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-line bg-surface-2 flex items-center justify-between text-xs text-ink-2 font-serif">
          <span>NovelForge AI 坚守本地优先准则：所有数据完全属于作者，离线可用</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-surface border border-line hover:bg-surface-3-hover text-ink transition shadow-2xs font-serif"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
