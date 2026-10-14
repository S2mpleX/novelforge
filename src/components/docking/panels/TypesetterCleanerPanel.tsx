import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  Save,
  AlertTriangle,
  Download,
  BookOpen,
  RefreshCw,
  Sliders,
  ChevronDown,
  ChevronUp,
  FileText,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { useNovelStore } from '@/stores/useNovelStore';
import { api } from '@/utils/tauriBridge';
import {
  TypesetterEngine,
  TypesetPreset,
  TypesetOptions,
  TypesetResult,
  CensorMatch,
} from '@/features/typesetter/typesetterEngine';

export const TypesetterCleanerPanel: React.FC = () => {
  const {
    activeNovel,
    activeChapter,
    editorContent,
    updateEditorContent,
    saveCurrentChapter,
  } = useNovelStore();

  const [preset, setPreset] = useState<TypesetPreset>('QIDIAN');
  const [rawText, setRawText] = useState<string>('');
  const [options, setOptions] = useState<TypesetOptions>(TypesetterEngine.getPresetOptions('QIDIAN'));
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [isExportingEpub, setIsExportingEpub] = useState<boolean>(false);
  const [epubNotice, setEpubNotice] = useState<string | null>(null);

  // 当切换章节时，默认载入当前正文
  useEffect(() => {
    const text = editorContent || activeChapter?.content || '';
    setRawText(text);
  }, [activeChapter?.id]);

  // 当切换预设时，更新配置选项
  const handlePresetChange = (newPreset: TypesetPreset) => {
    setPreset(newPreset);
    setOptions(TypesetterEngine.getPresetOptions(newPreset));
  };

  // 实时执行排版清洗与敏感词扫描
  const result: TypesetResult = useMemo(() => {
    return TypesetterEngine.formatText(rawText, preset, options);
  }, [rawText, preset, options]);

  // 载入当前正文
  const handleReloadCurrentChapter = () => {
    const text = editorContent || activeChapter?.content || '';
    setRawText(text);
  };

  // 一键复制到剪贴板
  const handleCopy = async () => {
    if (!result.cleanedText) return;
    try {
      await navigator.clipboard.writeText(result.cleanedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('复制失败:', e);
    }
  };

  // 采纳并覆盖当前章节 (留存快照)
  const handleApplyToChapter = async () => {
    if (!activeChapter || !result.cleanedText) return;
    setIsSaving(true);
    try {
      updateEditorContent(result.cleanedText);
      await saveCurrentChapter(true, 'TYPESETTER_CLEAN');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (e) {
      console.error('保存失败:', e);
    } finally {
      setIsSaving(false);
    }
  };

  // 一键替换单个敏感词
  const handleReplaceCensorWord = (match: CensorMatch) => {
    if (!match.suggest) return;
    const regex = new RegExp(match.word, 'g');
    setRawText((prev) => prev.replace(regex, match.suggest!));
  };

  // 导出清洗后的 TXT 文件
  const handleExportTxt = () => {
    if (!result.cleanedText) return;
    const blob = new Blob([result.cleanedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeChapter?.title || '排版文本'}_${preset}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 导出标准 EPUB 3 电子书
  const handleExportEpub = async () => {
    if (!activeNovel) return;
    setIsExportingEpub(true);
    setEpubNotice(null);
    try {
      const res = await api.exportNovelEpub(activeNovel.id);
      setEpubNotice(`✅ 成功导出 EPUB: ${res.file_path} (${(res.file_size / 1024).toFixed(1)} KB)`);
      setTimeout(() => setEpubNotice(null), 6000);
    } catch (e: any) {
      setEpubNotice(`❌ 导出失败: ${e?.message || e}`);
    } finally {
      setIsExportingEpub(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#fcfbfa] dark:bg-[#12141a] text-stone-800 dark:text-stone-200 select-none">
      {/* 顶部控制栏 */}
      <div className="p-3 border-b border-stone-200 dark:border-stone-800 bg-white/70 dark:bg-stone-900/60 backdrop-blur-sm flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-500" />
          <span className="font-semibold text-xs tracking-wider text-stone-700 dark:text-stone-300">
            网文排版清洗与合规预检
          </span>
          {activeChapter && (
            <span className="text-[11px] px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-500 truncate max-w-[140px]">
              {activeChapter.title}
            </span>
          )}
        </div>

        {/* 预设切换药丸 */}
        <div className="flex items-center bg-stone-100 dark:bg-stone-800/80 p-0.5 rounded-lg text-xs">
          <button
            onClick={() => handlePresetChange('QIDIAN')}
            className={`px-2.5 py-1 rounded-md transition-all font-medium ${
              preset === 'QIDIAN'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            起点中文网
          </button>
          <button
            onClick={() => handlePresetChange('FANQIE')}
            className={`px-2.5 py-1 rounded-md transition-all font-medium ${
              preset === 'FANQIE'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            番茄小说
          </button>
          <button
            onClick={() => handlePresetChange('JINJIANG')}
            className={`px-2.5 py-1 rounded-md transition-all font-medium ${
              preset === 'JINJIANG'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            晋江文学
          </button>
          <button
            onClick={() => handlePresetChange('GENERAL')}
            className={`px-2.5 py-1 rounded-md transition-all font-medium ${
              preset === 'GENERAL'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            通用全角
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleReloadCurrentChapter}
            title="重新载入当前章节正文"
            className="p-1.5 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 hover:text-stone-800 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`p-1.5 rounded-md transition flex items-center gap-1 text-xs ${
              showAdvanced
                ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>规则微调</span>
            {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* 高级规则配置折叠面板 */}
      {showAdvanced && (
        <div className="p-3 border-b border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-900/40 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={options.indentTwoEm}
              onChange={(e) => setOptions({ ...options, indentTwoEm: e.target.checked })}
              className="rounded text-amber-600 focus:ring-amber-500"
            />
            <span>段首全角缩进 (\u3000\u3000)</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={options.convertPunctuation}
              onChange={(e) => setOptions({ ...options, convertPunctuation: e.target.checked })}
              className="rounded text-amber-600 focus:ring-amber-500"
            />
            <span>半角标点转全角</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={options.convertDashesAndEllipsis}
              onChange={(e) => setOptions({ ...options, convertDashesAndEllipsis: e.target.checked })}
              className="rounded text-amber-600 focus:ring-amber-500"
            />
            <span>破折号(——)与省略号(……)</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={options.fixQuotes}
              onChange={(e) => setOptions({ ...options, fixQuotes: e.target.checked })}
              className="rounded text-amber-600 focus:ring-amber-500"
            />
            <span>成对中文引号 (“”)</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={options.blankLineBetweenParagraphs}
              onChange={(e) => setOptions({ ...options, blankLineBetweenParagraphs: e.target.checked })}
              className="rounded text-amber-600 focus:ring-amber-500"
            />
            <span>段与段之间留单空行</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={options.removeRedundantBlankLines}
              onChange={(e) => setOptions({ ...options, removeRedundantBlankLines: e.target.checked })}
              className="rounded text-amber-600 focus:ring-amber-500"
            />
            <span>清除多余连续空行</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={options.removeTrailingSpaces}
              onChange={(e) => setOptions({ ...options, removeTrailingSpaces: e.target.checked })}
              className="rounded text-amber-600 focus:ring-amber-500"
            />
            <span>清除段尾空格制表符</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={options.censorScan}
              onChange={(e) => setOptions({ ...options, censorScan: e.target.checked })}
              className="rounded text-amber-600 focus:ring-amber-500"
            />
            <span>敏感词与违规预警</span>
          </label>
        </div>
      )}

      {/* 状态统计条 */}
      <div className="px-3 py-1.5 bg-stone-100/60 dark:bg-stone-900/30 border-b border-stone-200/80 dark:border-stone-800 text-[11px] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-stone-600 dark:text-stone-400">
          <span>原文字数: <strong className="text-stone-800 dark:text-stone-200">{result.originalCharCount}</strong></span>
          <ArrowRight className="w-3 h-3 text-stone-400" />
          <span>清洗后字数: <strong className="text-amber-700 dark:text-amber-400">{result.cleanedCharCount}</strong></span>
          <span>段落数: <strong className="text-stone-800 dark:text-stone-200">{result.paragraphCount}</strong></span>
        </div>

        {/* 敏感词统计 */}
        <div className="flex items-center gap-1.5">
          {result.censorMatches.length > 0 ? (
            <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-medium px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60">
              <AlertTriangle className="w-3 h-3" />
              发现 {result.censorMatches.length} 处违规风险
            </span>
          ) : (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40">
              <Check className="w-3 h-3" />
              未命中敏感违规词
            </span>
          )}
        </div>
      </div>

      {/* 敏感词审查告警抽屉 (若有命中) */}
      {result.censorMatches.length > 0 && (
        <div className="p-2.5 bg-red-50/60 dark:bg-red-950/20 border-b border-red-200/60 dark:border-red-900/40 max-h-32 overflow-y-auto text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-semibold text-red-700 dark:text-red-400 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              平台合规预警（建议发布前修改避免被锁章/限流）
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {result.censorMatches.map((m, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 px-2 py-1 rounded bg-white dark:bg-stone-900 border border-red-200 dark:border-red-800/60 shadow-2xs"
              >
                <span className="font-mono text-red-600 dark:text-red-400 font-bold">
                  {m.word}
                </span>
                <span className="text-[10px] text-stone-500">(第{m.line}行)</span>
                {m.suggest && (
                  <button
                    onClick={() => handleReplaceCensorWord(m)}
                    className="text-[10px] px-1 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition cursor-pointer"
                    title={`点击一键替换为: ${m.suggest}`}
                  >
                    换为: {m.suggest}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 双栏对比视窗 */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-stone-200 dark:divide-stone-800">
        {/* 左栏：原文输入编辑 */}
        <div className="flex flex-col h-full p-3 min-h-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-stone-600 dark:text-stone-400 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              待清洗原文 (支持直接粘贴或编辑)
            </span>
            <span className="text-[11px] text-stone-400">
              {rawText.length} 字符
            </span>
          </div>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="请在此输入或粘贴需要排版清洗的章节正文..."
            className="flex-1 w-full p-2.5 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/60 text-xs sm:text-sm font-serif leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        {/* 右栏：排版后预览 */}
        <div className="flex flex-col h-full p-3 min-h-0 bg-stone-50/40 dark:bg-stone-900/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-amber-800 dark:text-amber-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              标准网文格式预览 ({preset === 'QIDIAN' ? '起点紧凑版' : preset === 'FANQIE' ? '番茄呼吸版' : preset === 'JINJIANG' ? '晋江规范版' : '通用纯净版'})
            </span>
            <span className="text-[11px] text-stone-400">
              {result.cleanedText.length} 字符
            </span>
          </div>
          <div className="flex-1 w-full p-2.5 rounded-lg border border-amber-200/60 dark:border-amber-900/40 bg-white dark:bg-stone-900 text-xs sm:text-sm font-serif leading-relaxed overflow-y-auto whitespace-pre-wrap select-text">
            {result.cleanedText ? (
              result.cleanedText
            ) : (
              <span className="text-stone-400 italic">清洗结果将在此实时呈现...</span>
            )}
          </div>
        </div>
      </div>

      {/* EPUB 提示条 */}
      {epubNotice && (
        <div className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/50 border-t border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between">
          <span>{epubNotice}</span>
          <button onClick={() => setEpubNotice(null)} className="text-stone-400 hover:text-stone-600">×</button>
        </div>
      )}

      {/* 底部功能动作栏 */}
      <div className="p-3 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportTxt}
            disabled={!result.cleanedText}
            className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-medium flex items-center gap-1.5 text-stone-700 dark:text-stone-300 transition cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>导出 TXT</span>
          </button>

          <button
            onClick={handleExportEpub}
            disabled={isExportingEpub || !activeNovel}
            className="px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800/80 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-xs font-medium flex items-center gap-1.5 text-amber-700 dark:text-amber-300 transition cursor-pointer disabled:opacity-50"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{isExportingEpub ? '正在打包 EPUB...' : '导出 EPUB 3 电子书'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeChapter && (
            <button
              onClick={handleApplyToChapter}
              disabled={isSaving || !result.cleanedText}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                saveSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-stone-800 hover:bg-stone-900 dark:bg-stone-700 dark:hover:bg-stone-600 text-white'
              }`}
            >
              {saveSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              <span>{saveSuccess ? '已更新当前章节' : isSaving ? '保存中...' : '采纳并覆盖当前章节'}</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            disabled={!result.cleanedText}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-amber-600 hover:bg-amber-700 text-white'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? '已复制至剪贴板' : '一键复制 (直贴后台)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
