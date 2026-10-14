import React from 'react';
import { ModelArenaPanel } from '@/components/docking/panels/ModelArenaPanel';

interface ModelArenaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ModelArenaModal: React.FC<ModelArenaModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl h-[92vh] max-h-[920px] rounded-2xl shadow-2xl overflow-hidden border border-[#ded5c4] bg-[#f4efe6] flex flex-col">
        <ModelArenaPanel isModal={true} onClose={onClose} />
      </div>
    </div>
  );
};
