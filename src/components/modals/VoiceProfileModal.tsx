import React from 'react';
import { X, Feather } from 'lucide-react';
import { VoiceProfilePanel } from '@/components/docking/panels/VoiceProfilePanel';

interface VoiceProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceProfileModal: React.FC<VoiceProfileModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl h-[78vh] bg-canvas rounded-xl shadow-2xl border border-line flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-4 py-2.5 border-b border-line bg-surface-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-amber-800/10 border border-amber-800/20 flex items-center justify-center">
              <Feather className="w-3.5 h-3.5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-ink">作者文风档案工作室 (Voice Profiles)</h2>
              <p className="text-[10px] text-ink-2">
                语调控制 · 节奏建模 · 正向/禁忌规则 · 现场效果试读推演
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-ink-2 hover:text-ink hover:bg-[#ded5c4]/50 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Direct embedding of VoiceProfilePanel */}
        <div className="flex-1 overflow-hidden">
          <VoiceProfilePanel />
        </div>
      </div>
    </div>
  );
};
