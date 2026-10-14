import React from 'react';
import { X, Sparkles } from 'lucide-react';
import { TypesetterCleanerPanel } from '@/components/docking/panels/TypesetterCleanerPanel';

interface TypesetterCleanerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TypesetterCleanerModal: React.FC<TypesetterCleanerModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl h-[90vh] bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 flex flex-col overflow-hidden">
        {/* 弹窗头部 */}
        <div className="px-5 py-3 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/90 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-700 dark:text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-stone-800 dark:text-stone-100">
                网文平台排版清洗机与发布合规预检工坊
              </h2>
              <p className="text-[11px] text-stone-500">
                一键解决全角缩进、多余空行、标点统一与敏感词规避，一键复制直贴起点/番茄/晋江作者后台
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 主体面板 */}
        <div className="flex-1 min-h-0">
          <TypesetterCleanerPanel />
        </div>
      </div>
    </div>
  );
};
