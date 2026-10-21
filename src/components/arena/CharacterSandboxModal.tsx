import React from 'react';
import { CharacterSandboxPanel } from '@/components/docking/panels/CharacterSandboxPanel';

interface CharacterSandboxModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CharacterSandboxModal: React.FC<CharacterSandboxModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl h-[92vh] max-h-[920px] rounded-2xl shadow-2xl overflow-hidden border border-[#ded5c2] dark:border-[#38322c] bg-[#fdfbf7] dark:bg-[#181614] flex flex-col">
        <CharacterSandboxPanel isModal={true} onClose={onClose} />
      </div>
    </div>
  );
};
