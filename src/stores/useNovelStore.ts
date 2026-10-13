import { create } from 'zustand';
import { api } from '@/utils/tauriBridge';
import type {
  Novel,
  Chapter,
  ChapterVersion,
  AiProvider,
} from '@/types';

export type ActiveTab = 'EDITOR' | 'DASHBOARD' | 'CHARACTERS' | 'WORLD' | 'PLOTS' | 'MEMORY' | 'SETTINGS';
export type SaveStatus = 'SAVED' | 'SAVING' | 'DIRTY' | 'ERROR';

interface NovelState {
  novels: Novel[];
  activeNovel: Novel | null;
  chapters: Chapter[];
  activeChapter: Chapter | null;
  editorContent: string;
  saveStatus: SaveStatus;
  isGenerating: boolean;
  streamText: string;
  activeTab: ActiveTab;
  providers: AiProvider[];
  activeProvider: AiProvider | null;
  versions: ChapterVersion[];
  sidebarCollapsed: boolean;
  rightPanelOpen: boolean;

  // Actions
  setActiveTab: (tab: ActiveTab) => void;
  toggleSidebar: () => void;
  toggleRightPanel: () => void;
  loadNovels: () => Promise<void>;
  selectNovel: (novel: Novel) => Promise<void>;
  createNovel: (input: {
    title: string;
    description?: string;
    genre_profile?: string;
    chapter_target_length?: number;
  }) => Promise<Novel>;
  deleteNovel: (id: string) => Promise<void>;

  loadChapters: (novelId: string) => Promise<void>;
  selectChapter: (chapter: Chapter) => Promise<void>;
  createChapter: (input: { title: string; initial_content?: string }) => Promise<Chapter>;
  updateEditorContent: (content: string) => void;
  saveCurrentChapter: (createNewVersion?: boolean, sourceType?: string) => Promise<void>;
  loadVersions: (chapterId: string) => Promise<void>;
  restoreVersion: (version: ChapterVersion) => Promise<void>;
  deleteChapter: (chapterId: string) => Promise<void>;

  loadProviders: () => Promise<void>;
  setIsGenerating: (isGenerating: boolean) => void;
  setStreamText: (text: string) => void;
  appendStreamText: (chunk: string) => void;
}

export const useNovelStore = create<NovelState>((set, get) => ({
  novels: [],
  activeNovel: null,
  chapters: [],
  activeChapter: null,
  editorContent: '',
  saveStatus: 'SAVED',
  isGenerating: false,
  streamText: '',
  activeTab: 'EDITOR',
  providers: [],
  activeProvider: null,
  versions: [],
  sidebarCollapsed: false,
  rightPanelOpen: true,

  setActiveTab: (tab) => set({ activeTab: tab }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  toggleRightPanel: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),

  loadNovels: async () => {
    try {
      const novels = await api.listNovels();
      set({ novels });
      if (novels.length > 0 && !get().activeNovel) {
        await get().selectNovel(novels[0]);
      }
    } catch (e) {
      console.error('加载小说列表失败:', e);
    }
  },

  selectNovel: async (novel) => {
    set({ activeNovel: novel, activeChapter: null, editorContent: '', chapters: [] });
    await get().loadChapters(novel.id);
  },

  createNovel: async (input) => {
    const newNovel = await api.createNovel(input);
    const novels = await api.listNovels();
    set({ novels, activeNovel: newNovel });
    await get().loadChapters(newNovel.id);
    return newNovel;
  },

  deleteNovel: async (id) => {
    await api.deleteNovel(id);
    const novels = await api.listNovels();
    set({
      novels,
      activeNovel: novels.length > 0 ? novels[0] : null,
      activeChapter: null,
      editorContent: '',
      chapters: [],
    });
    if (novels.length > 0) {
      await get().loadChapters(novels[0].id);
    }
  },

  loadChapters: async (novelId) => {
    try {
      const chapters = await api.listChapters(novelId);
      set({ chapters });
      if (chapters.length > 0 && !get().activeChapter) {
        await get().selectChapter(chapters[0]);
      }
    } catch (e) {
      console.error('加载章节列表失败:', e);
    }
  },

  selectChapter: async (chapter) => {
    // If dirty, save first
    if (get().saveStatus === 'DIRTY' && get().activeChapter) {
      await get().saveCurrentChapter(false);
    }

    try {
      const freshChapter = await api.getChapter(chapter.id);
      set({
        activeChapter: freshChapter,
        editorContent: freshChapter.content || '',
        saveStatus: 'SAVED',
      });
      await get().loadVersions(chapter.id);
    } catch (e) {
      console.error('读取章节详情失败:', e);
    }
  },

  createChapter: async (input) => {
    const activeNovel = get().activeNovel;
    if (!activeNovel) throw new Error('未选择小说');

    const created = await api.createChapter({
      novel_id: activeNovel.id,
      title: input.title,
      initial_content: input.initial_content || '',
    });

    await get().loadChapters(activeNovel.id);
    await get().selectChapter(created);
    return created;
  },

  updateEditorContent: (content) => {
    set({ editorContent: content, saveStatus: 'DIRTY' });
  },

  saveCurrentChapter: async (createNewVersion = false, sourceType = 'USER_EDIT') => {
    const { activeChapter, editorContent, saveStatus } = get();
    if (!activeChapter) return;
    if (saveStatus === 'SAVING') return;

    set({ saveStatus: 'SAVING' });
    try {
      const updated = await api.saveChapterContent(
        activeChapter.id,
        editorContent,
        createNewVersion,
        sourceType
      );
      set({
        activeChapter: updated,
        saveStatus: 'SAVED',
      });
      // Refresh chapter list word count
      const activeNovel = get().activeNovel;
      if (activeNovel) {
        const chapters = await api.listChapters(activeNovel.id);
        set({ chapters });
      }
      await get().loadVersions(activeChapter.id);
    } catch (e) {
      console.error('保存正文失败:', e);
      set({ saveStatus: 'ERROR' });
    }
  },

  loadVersions: async (chapterId) => {
    try {
      const versions = await api.listChapterVersions(chapterId);
      set({ versions });
    } catch (e) {
      console.error('加载历史版本失败:', e);
    }
  },

  restoreVersion: async (version) => {
    const { activeChapter } = get();
    if (!activeChapter) return;
    set({ editorContent: version.content });
    await get().saveCurrentChapter(true, 'RESTORE_VERSION');
  },

  deleteChapter: async (chapterId) => {
    await api.deleteChapter(chapterId);
    const activeNovel = get().activeNovel;
    if (activeNovel) {
      const chapters = await api.listChapters(activeNovel.id);
      set({
        chapters,
        activeChapter: chapters.length > 0 ? chapters[0] : null,
        editorContent: chapters.length > 0 ? chapters[0].content || '' : '',
      });
    }
  },

  loadProviders: async () => {
    try {
      const providers = await api.listProviders();
      const active = providers.find((p) => p.is_active) || (providers.length > 0 ? providers[0] : null);
      set({ providers, activeProvider: active });
    } catch (e) {
      console.error('加载模型服务商失败:', e);
    }
  },

  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setStreamText: (streamText) => set({ streamText }),
  appendStreamText: (chunk) => set((s) => ({ streamText: s.streamText + chunk })),
}));
