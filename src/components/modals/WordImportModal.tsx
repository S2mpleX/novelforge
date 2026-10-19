import React, { useState, useRef } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { WordImportService } from '@/features/importer/services/WordImportService';
import type {
  DocxParseResult,
  SplitMode,
  ImportDestination,
} from '@/features/importer/types';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  X,
  BookOpen,
  Layers,
  Settings2,
  Sparkles,
  Eye,
  CheckSquare,
  Square,
  RefreshCw,
  FolderPlus,
  BookPlus,
} from 'lucide-react';
import { api } from '@/utils/tauriBridge';
import { alertDialog } from '@/utils/dialog';

interface WordImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: (novelId: string) => void;
}

export const WordImportModal: React.FC<WordImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const { activeNovel, activeChapter, loadNovels, selectNovel, loadChapters } = useNovelStore();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 状态管理
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<DocxParseResult | null>(null);

  // 切分配置
  const [splitMode, setSplitMode] = useState<SplitMode>('AUTO');
  const [customRegex, setCustomRegex] = useState('');

  // 导入目标配置
  const [destination, setDestination] = useState<ImportDestination>('NEW_NOVEL');
  const [newNovelTitle, setNewNovelTitle] = useState('');
  const [genreProfile, setGenreProfile] = useState('玄幻修仙');

  // 执行导入状态
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({
    current: 0,
    total: 0,
    currentTitle: '',
  });
  const [expandedPreviewId, setExpandedPreviewId] = useState<string | null>(null);

  if (!isOpen) return null;

  // 处理文件上传
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.docx')) {
      setParseError('仅支持 Microsoft Word (.docx) 格式文件');
      return;
    }
    await processFile(file);
  };

  const processFile = async (file: File) => {
    setIsParsing(true);
    setParseError(null);
    try {
      const result = await WordImportService.parseDocx(file);
      setParseResult(result);
      setNewNovelTitle(file.name.replace(/\.docx$/i, ''));
      setSplitMode('AUTO');
    } catch (err: any) {
      console.error('解析 Word 文档失败:', err);
      setParseError(`解析 Word 文档失败: ${err.message || '文件损坏或格式不兼容'}`);
    } finally {
      setIsParsing(false);
    }
  };

  // 重新按当前规则切分章节
  const handleReSplit = (mode: SplitMode, customPat?: string) => {
    if (!parseResult) return;
    setSplitMode(mode);
    const newChapters = WordImportService.splitChapters(
      parseResult.rawText,
      mode,
      customPat !== undefined ? customPat : customRegex
    );
    setParseResult({
      ...parseResult,
      chapters: newChapters,
    });
  };

  // 勾选/取消勾选单章
  const toggleChapterSelection = (id: string) => {
    if (!parseResult) return;
    setParseResult({
      ...parseResult,
      chapters: parseResult.chapters.map((c) =>
        c.id === id ? { ...c, selected: !c.selected } : c
      ),
    });
  };

  // 全选/全不选
  const handleSelectAll = (select: boolean) => {
    if (!parseResult) return;
    setParseResult({
      ...parseResult,
      chapters: parseResult.chapters.map((c) => ({ ...c, selected: select })),
    });
  };

  // 编辑章节标题
  const handleTitleChange = (id: string, newTitle: string) => {
    if (!parseResult) return;
    setParseResult({
      ...parseResult,
      chapters: parseResult.chapters.map((c) =>
        c.id === id ? { ...c, title: newTitle } : c
      ),
    });
  };

  // 执行最终导入
  const handleExecuteImport = async () => {
    if (!parseResult) return;
    const selectedCount = parseResult.chapters.filter((c) => c.selected).length;
    if (selectedCount === 0) {
      await alertDialog('请至少勾选一个要导入的章节！');
      return;
    }

    setIsImporting(true);
    try {
      const res = await WordImportService.executeImport(
        parseResult,
        {
          destination,
          novelTitle: newNovelTitle.trim(),
          genreProfile,
          targetNovelId: activeNovel?.id,
          targetChapterId: activeChapter?.id,
        },
        (current, total, currentTitle) => {
          setImportProgress({ current, total, currentTitle });
        }
      );

      // 刷新小说与章节列表
      await loadNovels();
      if (res.novelId) {
        try {
          const freshNovels = await api.listNovels();
          const target = freshNovels.find((n) => n.id === res.novelId);
          if (target) {
            await selectNovel(target);
          }
        } catch (e) {
          console.warn('自动选中导入小说失败:', e);
        }
        await loadChapters(res.novelId);
      }

      if (onImportSuccess) {
        onImportSuccess(res.novelId);
      }

      await alertDialog(`🎉 恭喜！成功导入 ${res.importedCount} 个章节！`);
      onClose();
    } catch (err: any) {
      console.error('导入失败:', err);
      await alertDialog(`导入遇到错误: ${err.message || err}`);
    } finally {
      setIsImporting(false);
    }
  };

  const selectedCount = parseResult ? parseResult.chapters.filter((c) => c.selected).length : 0;
  const totalCount = parseResult ? parseResult.chapters.length : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-4xl max-h-[92vh] bg-[#fcfaf5] border border-line rounded-2xl shadow-2xl flex flex-col overflow-hidden text-ink font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-surface-2/80 select-none shrink-0 gap-3 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-900/20 text-white shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold font-serif text-ink flex items-center gap-2 truncate">
                <span className="truncate">Word 文档 (.docx) 智能解析与分章导入</span>
                <span className="px-2 py-0.5 text-[10px] font-sans font-semibold bg-blue-100 text-blue-800 rounded-full border border-blue-200 shrink-0 whitespace-nowrap">
                  本地纯离线解析
                </span>
              </h2>
              <p className="text-xs text-ink-2 truncate">
                支持长篇存稿极速解析、智能识别“第X章/卷/序章/尾声”、章节预览微调与一键批量建书入库
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isImporting}
            className="p-1.5 rounded-lg text-ink-2 hover:text-ink hover:bg-[#e2d8c7] transition disabled:opacity-40 cursor-pointer shrink-0"
            title="关闭"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. 文件上传区域 */}
          {!parseResult && !isParsing && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#cfc3ad] hover:border-blue-600/70 bg-surface/70 hover:bg-blue-50/30 rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-inner">
                <Upload className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-ink font-serif mb-1">
                点击选择或将 Word 文档拖拽到此处
              </h3>
              <p className="text-xs text-ink-2 max-w-md leading-relaxed">
                支持标准 Microsoft Word (.docx) 文件。系统会在本地内存完成轻量解析，杜绝隐私与稿件泄露。
              </p>
              <div className="mt-4 flex items-center gap-3 text-[11px] text-[#8e8475]">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  智能识别标题
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  保留网文段落排版
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  支持几十万字长篇存稿
                </span>
              </div>
            </div>
          )}

          {/* 解析中状态 */}
          {isParsing && (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <RefreshCw className="w-10 h-10 text-blue-600 animate-spin mb-4" />
              <h3 className="text-sm font-bold text-ink font-serif mb-1">
                正在深度解析 Word 文档与提取章节拓扑...
              </h3>
              <p className="text-xs text-ink-2">正在提取文本流并执行中文段落排版规范化</p>
            </div>
          )}

          {/* 解析错误提示 */}
          {parseError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{parseError}</span>
            </div>
          )}

          {/* 2. 解析完成展示面板 */}
          {parseResult && !isParsing && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* 文件信息卡片 */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-surface-2/70 border border-line">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-ink truncate" title={parseResult.fileName}>
                      {parseResult.fileName}
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-ink-2 mt-0.5 font-mono">
                      <span>{(parseResult.fileSizeBytes / 1024).toFixed(1)} KB</span>
                      <span>•</span>
                      <span>总计 <strong>{parseResult.totalWordCount.toLocaleString()}</strong> 字</span>
                      <span>•</span>
                      <span>{parseResult.totalParagraphs} 个自然段</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setParseResult(null);
                    setParseError(null);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs text-ink-2 hover:text-ink hover:bg-surface-3-hover border border-line transition cursor-pointer"
                >
                  更换其他文件
                </button>
              </div>

              {/* 切分规则与模式控制 */}
              <div className="p-4 rounded-xl bg-white border border-line shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-blue-700" />
                    <span className="text-xs font-bold text-ink font-serif">分章切分规则</span>
                  </div>
                  <span className="text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    {parseResult.detectedPatterns[0] || '智能识别'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleReSplit('AUTO')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                      splitMode === 'AUTO'
                        ? 'bg-blue-600 text-white shadow-xs font-bold'
                        : 'bg-surface-2 text-ink-2 hover:bg-surface-3-hover'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>智能识别（网文标准：第X章/卷/回/序章/尾声）</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleReSplit('SINGLE_CHAPTER')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                      splitMode === 'SINGLE_CHAPTER'
                        ? 'bg-blue-600 text-white shadow-xs font-bold'
                        : 'bg-surface-2 text-ink-2 hover:bg-surface-3-hover'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>整篇作为单章（不切分）</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleReSplit('CUSTOM_REGEX')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                      splitMode === 'CUSTOM_REGEX'
                        ? 'bg-blue-600 text-white shadow-xs font-bold'
                        : 'bg-surface-2 text-ink-2 hover:bg-surface-3-hover'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>自定义正则规则</span>
                  </button>
                </div>

                {splitMode === 'CUSTOM_REGEX' && (
                  <div className="pt-2 flex items-center gap-2">
                    <input
                      type="text"
                      value={customRegex}
                      onChange={(e) => setCustomRegex(e.target.value)}
                      placeholder="输入自定义分章正则表达式，如：(?:^|\n)\s*(第.+?章\s*[^\n]+)"
                      className="flex-1 px-3 py-1.5 text-xs font-mono bg-surface border border-line rounded-lg focus:outline-hidden focus:border-blue-600"
                    />
                    <button
                      type="button"
                      onClick={() => handleReSplit('CUSTOM_REGEX', customRegex)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition cursor-pointer"
                    >
                      重新应用
                    </button>
                  </div>
                )}
              </div>

              {/* 章节列表展示与微调 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-ink-2 px-1">
                  <div className="flex items-center gap-2 font-medium">
                    <span>章节预览列表</span>
                    <span className="font-mono text-ink font-bold">
                      （已选 {selectedCount} / 共 {totalCount} 章）
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectAll(true)}
                      className="text-blue-700 hover:underline cursor-pointer text-xs"
                    >
                      全选
                    </button>
                    <span>|</span>
                    <button
                      type="button"
                      onClick={() => handleSelectAll(false)}
                      className="text-blue-700 hover:underline cursor-pointer text-xs"
                    >
                      全不选
                    </button>
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto border border-line rounded-xl bg-white divide-y divide-[#eee6d8] shadow-inner">
                  {parseResult.chapters.map((ch, idx) => (
                    <div
                      key={ch.id}
                      className={`p-2.5 flex flex-col transition ${
                        ch.selected ? 'bg-white hover:bg-blue-50/20' : 'bg-stone-50/60 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => toggleChapterSelection(ch.id)}
                          className="text-blue-600 hover:text-blue-700 cursor-pointer shrink-0"
                        >
                          {ch.selected ? (
                            <CheckSquare className="w-4 h-4" />
                          ) : (
                            <Square className="w-4 h-4 text-stone-400" />
                          )}
                        </button>

                        <span className="w-8 text-[11px] font-mono text-[#8e8475] shrink-0 text-center">
                          #{idx + 1}
                        </span>

                        <input
                          type="text"
                          value={ch.title}
                          onChange={(e) => handleTitleChange(ch.id, e.target.value)}
                          className="flex-1 text-xs font-semibold text-ink bg-transparent border-b border-transparent hover:border-line focus:border-blue-600 focus:bg-surface px-1 py-0.5 rounded outline-hidden transition"
                          title="点击可直接编辑修改章节标题"
                        />

                        <span className="text-[11px] font-mono text-ink-2 shrink-0 bg-surface-2 px-2 py-0.5 rounded-full">
                          {ch.charCount.toLocaleString()} 字
                        </span>

                        <button
                          type="button"
                          onClick={() => setExpandedPreviewId(expandedPreviewId === ch.id ? null : ch.id)}
                          className="p-1 text-ink-2 hover:text-ink hover:bg-surface-2 rounded transition cursor-pointer"
                          title="查看正文首段摘要"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* 展开摘要预览 */}
                      {expandedPreviewId === ch.id && (
                        <div className="mt-2 ml-11 p-2.5 rounded-lg bg-surface border border-line text-xs text-ink-2 font-serif leading-relaxed animate-in fade-in duration-100">
                          <p className="line-clamp-3">{ch.previewText || '（本章暂无正文内容）'}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. 导入目标设置 */}
              <div className="p-4 rounded-xl bg-surface-2/50 border border-line space-y-3">
                <span className="text-xs font-bold text-ink font-serif block">
                  选择导入目标位置
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                      destination === 'NEW_NOVEL'
                        ? 'bg-white border-blue-600 shadow-sm ring-1 ring-blue-600'
                        : 'bg-white/60 border-line hover:bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="destination"
                      checked={destination === 'NEW_NOVEL'}
                      onChange={() => setDestination('NEW_NOVEL')}
                      className="mt-1 text-blue-600"
                    />
                    <div>
                      <div className="text-xs font-bold text-ink flex items-center gap-1.5">
                        <BookPlus className="w-4 h-4 text-blue-600" />
                        <span>新建一部小说并完整导入</span>
                      </div>
                      <p className="text-[11px] text-ink-2 mt-1">
                        自动创建新书架构，所有章节直接归纳在新书目录树中。
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border transition ${
                      !activeNovel
                        ? 'opacity-40 cursor-not-allowed bg-stone-100'
                        : destination === 'APPEND_EXISTING_NOVEL'
                        ? 'bg-white border-blue-600 shadow-sm ring-1 ring-blue-600 cursor-pointer'
                        : 'bg-white/60 border-line hover:bg-white cursor-pointer'
                    }`}
                  >
                    <input
                      type="radio"
                      name="destination"
                      disabled={!activeNovel}
                      checked={destination === 'APPEND_EXISTING_NOVEL'}
                      onChange={() => setDestination('APPEND_EXISTING_NOVEL')}
                      className="mt-1 text-blue-600"
                    />
                    <div>
                      <div className="text-xs font-bold text-ink flex items-center gap-1.5">
                        <FolderPlus className="w-4 h-4 text-emerald-600" />
                        <span>追加到当前作品《{activeNovel?.title || '未选择'}》</span>
                      </div>
                      <p className="text-[11px] text-ink-2 mt-1">
                        将勾选的章节批量追加到当前作品目录树的最后。
                      </p>
                    </div>
                  </label>
                </div>

                {/* 如果是新建小说，输入书名与流派 */}
                {destination === 'NEW_NOVEL' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="text-[11px] font-semibold text-ink-2 block mb-1">
                        新作品书名
                      </label>
                      <input
                        type="text"
                        value={newNovelTitle}
                        onChange={(e) => setNewNovelTitle(e.target.value)}
                        placeholder="请输入作品名称"
                        className="w-full px-3 py-1.5 text-xs bg-white border border-line rounded-lg focus:outline-hidden focus:border-blue-600"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-ink-2 block mb-1">
                        作品流派类型
                      </label>
                      <select
                        value={genreProfile}
                        onChange={(e) => setGenreProfile(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-line rounded-lg focus:outline-hidden focus:border-blue-600"
                      >
                        <option value="玄幻修仙">玄幻修仙 (东方仙侠/升级流)</option>
                        <option value="都市现实">都市现实 (职场商战/日常异能)</option>
                        <option value="悬疑惊悚">悬疑惊悚 (无限流/侦探破案)</option>
                        <option value="硬核科幻">硬核科幻 (太空歌剧/赛博朋克)</option>
                        <option value="历史架空">历史架空 (穿越权谋/争霸史诗)</option>
                        <option value="传统严肃文学">传统严肃文学 (群像纪实)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 导入进度展示 */}
          {isImporting && (
            <div className="p-8 rounded-xl bg-blue-50 border border-blue-200 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
              <h4 className="text-sm font-bold text-blue-900 font-serif">
                正在执行批量入库 ({importProgress.current} / {importProgress.total})
              </h4>
              <p className="text-xs text-blue-700 truncate max-w-md mx-auto">
                写入中：{importProgress.currentTitle}
              </p>
              <div className="w-full max-w-md mx-auto bg-blue-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-150"
                  style={{
                    width: `${(importProgress.current / (importProgress.total || 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-line bg-surface-2/50 flex items-center justify-between shrink-0">
          <div className="text-xs text-ink-2">
            {parseResult ? (
              <span>已准备就绪，点击右侧按钮立即写入 SQLite 数据库</span>
            ) : (
              <span>请选择本地 .docx 文件开始解析</span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isImporting}
              className="px-4 py-2 rounded-xl text-xs font-medium text-ink-2 hover:bg-surface-3-hover transition cursor-pointer disabled:opacity-40"
            >
              取消
            </button>

            {parseResult && (
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={isImporting || selectedCount === 0}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 transition shadow-md shadow-blue-900/15 flex items-center gap-1.5 cursor-pointer disabled:opacity-40 active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>立即批量导入（共 {selectedCount} 章）</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
