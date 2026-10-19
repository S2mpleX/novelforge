import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BUILTIN_SKILLS } from './skillsRegistry';
import { SkillsEngine } from './SkillsEngine';
import type { SkillDefinition, SkillAuditReport, SkillCategory } from './types';

const DEFAULT_ACTIVE_SKILL_IDS = [
  'humanizer',
  'lieflat-less-ai-tone',
  'story-architect',
  'scene-dramaturge',
  'ending-forge',
  'cold-reader',
];

interface SkillsState {
  skills: SkillDefinition[];
  activeSkillIds: string[];
  
  // Actions
  toggleSkill: (skillId: string) => void;
  setSkillEnabled: (skillId: string, enabled: boolean) => void;
  resetToDefaults: () => void;
  getEnabledSkills: () => SkillDefinition[];
  getSkillsByCategory: (category: SkillCategory | 'all') => SkillDefinition[];
  
  // Audit & Prompt
  auditText: (text: string) => SkillAuditReport;
  buildPolishingPrompt: (text: string, genre?: string, instruction?: string) => string;
  buildStoryArchitectPrompt: (inputs: {
    genre?: string;
    concept: string;
    targetEmotion?: string;
    existingBible?: string;
  }) => string;
  buildSceneDramaturgePrompt: (inputs: {
    genre?: string;
    prevContext: string;
    sceneGoal: string;
    activeCharacters?: string;
    targetEmotion?: string;
  }) => string;
  buildEndingForgePrompt: (inputs: {
    genre?: string;
    storyPremise: string;
    establishedClues?: string;
    protagonistChoice?: string;
  }) => string;
  buildColdReaderPrompt: (
    text: string,
    genre?: string,
    targetAudience?: string
  ) => string;
}

export const useSkillsStore = create<SkillsState>()(
  persist(
    (set, get) => ({
      skills: BUILTIN_SKILLS,
      activeSkillIds: DEFAULT_ACTIVE_SKILL_IDS,

      toggleSkill: (skillId: string) => {
        set((state) => {
          const isActive = state.activeSkillIds.includes(skillId);
          const nextActive = isActive
            ? state.activeSkillIds.filter((id) => id !== skillId)
            : [...state.activeSkillIds, skillId];

          const updatedSkills = state.skills.map((s) =>
            s.id === skillId ? { ...s, enabled: !isActive } : s
          );

          return {
            activeSkillIds: nextActive,
            skills: updatedSkills,
          };
        });
      },

      setSkillEnabled: (skillId: string, enabled: boolean) => {
        set((state) => {
          const nextActive = enabled
            ? Array.from(new Set([...state.activeSkillIds, skillId]))
            : state.activeSkillIds.filter((id) => id !== skillId);

          const updatedSkills = state.skills.map((s) =>
            s.id === skillId ? { ...s, enabled } : s
          );

          return {
            activeSkillIds: nextActive,
            skills: updatedSkills,
          };
        });
      },

      resetToDefaults: () => {
        set({
          skills: BUILTIN_SKILLS,
          activeSkillIds: DEFAULT_ACTIVE_SKILL_IDS,
        });
      },

      getEnabledSkills: () => {
        const { skills, activeSkillIds } = get();
        return skills.filter((s) => activeSkillIds.includes(s.id));
      },

      getSkillsByCategory: (category: SkillCategory | 'all') => {
        const { skills } = get();
        if (category === 'all') return skills;
        return skills.filter((s) => s.category === category);
      },

      auditText: (text: string) => {
        const { activeSkillIds } = get();
        return SkillsEngine.auditText(text, activeSkillIds);
      },

      buildPolishingPrompt: (
        text: string,
        genre: string = '中文长篇小说',
        instruction: string = '彻底消灭 AI 腔调，强化中式小说身体微动作白描与现场呼吸感'
      ) => {
        const { activeSkillIds } = get();
        return SkillsEngine.buildCombinedPolishingPrompt(text, genre, instruction, activeSkillIds);
      },

      buildStoryArchitectPrompt: (inputs) => {
        return SkillsEngine.buildStoryArchitectPrompt(inputs);
      },

      buildSceneDramaturgePrompt: (inputs) => {
        return SkillsEngine.buildSceneDramaturgePrompt(inputs);
      },

      buildEndingForgePrompt: (inputs) => {
        return SkillsEngine.buildEndingForgePrompt(inputs);
      },

      buildColdReaderPrompt: (text, genre, targetAudience) => {
        return SkillsEngine.buildColdReaderPrompt(text, genre, targetAudience);
      },
    }),
    {
      name: 'novelforge_skills_registry',
      version: 2,
      migrate: (persistedState: any, version: number) => {
        if (!persistedState || version < 2) {
          // 增量合并新注册的 builtin skills
          const savedActiveIds: string[] = persistedState?.activeSkillIds || [];
          const mergedActiveIds = Array.from(
            new Set([...savedActiveIds, ...DEFAULT_ACTIVE_SKILL_IDS])
          );
          return {
            ...persistedState,
            skills: BUILTIN_SKILLS,
            activeSkillIds: mergedActiveIds,
          };
        }
        return persistedState as SkillsState;
      },
    }
  )
);

