import React from 'react';
import { useToastStore, ToastItem } from '@/stores/useToastStore';
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react';

const TOAST_ICONS: Record<ToastItem['type'], React.ElementType> = {
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
};

const TOAST_STYLES: Record<
  ToastItem['type'],
  {
    border: string;
    bg: string;
    iconColor: string;
    titleColor: string;
  }
> = {
  success: {
    border: 'border-emerald-300 dark:border-emerald-800/60',
    bg: 'bg-emerald-50/95 dark:bg-[#15231b]/95',
    iconColor: 'text-emerald-700 dark:text-emerald-400',
    titleColor: 'text-emerald-950 dark:text-emerald-100',
  },
  info: {
    border: 'border-amber-300 dark:border-amber-800/60',
    bg: 'bg-amber-50/95 dark:bg-[#231e17]/95',
    iconColor: 'text-primary dark:text-amber-400',
    titleColor: 'text-amber-950 dark:text-amber-100',
  },
  warning: {
    border: 'border-orange-300 dark:border-orange-800/60',
    bg: 'bg-orange-50/95 dark:bg-[#241b14]/95',
    iconColor: 'text-orange-700 dark:text-orange-400',
    titleColor: 'text-orange-950 dark:text-orange-100',
  },
  error: {
    border: 'border-rose-300 dark:border-rose-800/60',
    bg: 'bg-rose-50/95 dark:bg-[#261617]/95',
    iconColor: 'text-rose-700 dark:text-rose-400',
    titleColor: 'text-rose-950 dark:text-rose-100',
  },
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none select-none"
      aria-live="polite"
    >
      {toasts.map((item) => {
        const IconComponent = TOAST_ICONS[item.type];
        const style = TOAST_STYLES[item.type];

        return (
          <div
            key={item.id}
            onClick={() => removeToast(item.id)}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-200 cursor-pointer hover:scale-[1.02] active:scale-95 animate-in slide-in-from-bottom-3 fade-in ${style.bg} ${style.border}`}
          >
            <div className={`mt-0.5 shrink-0 ${style.iconColor}`}>
              <IconComponent className="w-4 h-4" />
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <h5 className={`text-xs font-serif font-bold leading-snug ${style.titleColor}`}>
                {item.title}
              </h5>
              {item.description && (
                <p className="text-[11px] text-stone-600 dark:text-stone-300 mt-0.5 leading-relaxed font-sans">
                  {item.description}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeToast(item.id);
              }}
              className="shrink-0 p-1 rounded-md text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition -mr-1 -mt-1 cursor-pointer"
              title="关闭通知"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
