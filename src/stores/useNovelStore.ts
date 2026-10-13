import { create } from 'zustand';
import { api } from '@/utils/tauriBridge';
import type {
  Novel,
  Volume,
  Chapter,
  ChapterVersion,
  AiProvider,
  Part,
  Scene,
  PlotBeat,
  CharacterArc,
  ParallelThread,
  PlotAssociationView,
  HierarchyConfig,
  NovelContentTree,
  HierarchicalCreationContext,
} from '@/types';

export type ActiveTab = 'EDITOR' | 'DASHBOARD' | 'CHARACTERS' | 'WORLD' | 'PLOTS' | 'MEMORY' | 'SETTINGS';
export type SaveStatus = 'SAVED' | 'SAVING' | 'DIRTY' | 'ERROR';
export type ThemeMode = 'light' | 'dark';

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
  zenMode: boolean;
  themeMode: ThemeMode;
  uiScale: number;

  // V2.0 State
  contentTree: NovelContentTree | null;
  hierarchyConfig: HierarchyConfig | null;
  parts: Part[];
  volumes: Volume[];
  scenes: Scene[];
  activeScene: Scene | null;
  plotBeats: PlotBeat[];
  characterArcs: CharacterArc[];
  parallelThreads: ParallelThread[];
  plotMatrix: PlotAssociationView[];
  creationContext: HierarchicalCreationContext | null;

  // Actions
  setActiveTab: (tab: ActiveTab) => void;
  toggleSidebar: () => void;
  toggleRightPanel: () => void;
  toggleZenMode: () => void;
  setZenMode: (zenMode: boolean) => void;
  setThemeMode: (mode: ThemeMode) => void;
  toggleThemeMode: () => void;
  setUiScale: (scale: number) => void;
  increaseUiScale: () => void;
  decreaseUiScale: () => void;
  resetUiScale: () => void;
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

  // V2.0 Actions
  loadHierarchyConfig: (novelId: string) => Promise<void>;
  updateHierarchyConfig: (config: HierarchyConfig) => Promise<void>;
  loadContentTree: (novelId?: string) => Promise<void>;
  loadHierarchyPartsAndVolumes: (novelId: string) => Promise<void>;
  loadScenesForChapter: (chapterId: string) => Promise<void>;
  selectScene: (scene: Scene) => Promise<void>;
  loadPlotBeats: (sceneId: string) => Promise<void>;
  loadCharacterArcs: (novelId?: string) => Promise<void>;
  loadParallelThreads: (novelId?: string) => Promise<void>;
  loadPlotMatrix: (novelId?: string) => Promise<void>;
  loadCreationContext: (chapterId: string, sceneId?: string) => Promise<void>;
  splitChapter: (splitPoint: number, newTitle?: string) => Promise<void>;
  mergeChapters: (sourceId: string, targetId: string) => Promise<void>;
  renumberHierarchy: () => Promise<void>;
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
  zenMode: false,
  themeMode: (typeof localStorage !== 'undefined' && (localStorage.getItem('novelforge_theme_mode') as ThemeMode)) || 'light',
  uiScale: (typeof localStorage !== 'undefined' && parseInt(localStorage.getItem('novelforge_ui_scale') || '100', 10)) || 100,

  // V2.0 Initial State
  contentTree: null,
  hierarchyConfig: null,
  parts: [],
  volumes: [],
  scenes: [],
  activeScene: null,
  plotBeats: [],
  characterArcs: [],
  parallelThreads: [],
  plotMatrix: [],
  creationContext: null,

  setActiveTab: (tab) => set({ activeTab: tab }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  toggleRightPanel: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),
  toggleZenMode: () => set((s) => ({ zenMode: !s.zenMode })),
  setZenMode: (zenMode) => set({ zenMode }),
  setThemeMode: (mode) => {
    set({ themeMode: mode });
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('novelforge_theme_mode', mode);
    }
    if (typeof document !== 'undefined') {
      if (mode === 'dark') {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
      }
    }
  },
  toggleThemeMode: () => {
    const next = get().themeMode === 'dark' ? 'light' : 'dark';
    get().setThemeMode(next);
  },
  setUiScale: (scale) => {
    const clamped = Math.min(140, Math.max(80, scale));
    set({ uiScale: clamped });
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('novelforge_ui_scale', String(clamped));
    }
    if (typeof document !== 'undefined') {
      document.documentElement.style.zoom = `${clamped}%`;
    }
  },
  increaseUiScale: () => {
    get().setUiScale(get().uiScale + 5);
  },
  decreaseUiScale: () => {
    get().setUiScale(get().uiScale - 5);
  },
  resetUiScale: () => {
    get().setUiScale(100);
  },

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
    set({
      activeNovel: novel,
      activeChapter: null,
      editorContent: '',
      chapters: [],
      contentTree: null,
      hierarchyConfig: null,
      parts: [],
      volumes: [],
      scenes: [],
      activeScene: null,
      plotBeats: [],
      characterArcs: [],
      parallelThreads: [],
      plotMatrix: [],
      creationContext: null,
    });
    await get().loadChapters(novel.id);
    await Promise.all([
      get().loadHierarchyConfig(novel.id),
      get().loadContentTree(novel.id),
      get().loadHierarchyPartsAndVolumes(novel.id),
      get().loadCharacterArcs(novel.id),
      get().loadParallelThreads(novel.id),
      get().loadPlotMatrix(novel.id),
    ]);
  },

  createNovel: async (input) => {
    const newNovel = await api.createNovel(input);
    const novels = await api.listNovels();
    set({ novels, activeNovel: newNovel });
    await get().loadChapters(newNovel.id);
    await get().loadContentTree(newNovel.id);
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
      contentTree: null,
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
      await Promise.all([
        get().loadVersions(chapter.id),
        get().loadScenesForChapter(chapter.id),
        get().loadCreationContext(chapter.id),
      ]);
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

  // --- V2.0 Actions Implementation ---
  loadHierarchyConfig: async (novelId) => {
    try {
      const hierarchyConfig = await api.getNovelHierarchyConfig(novelId);
      set({ hierarchyConfig });
    } catch (e) {
      console.error('加载层级配置失败:', e);
    }
  },

  updateHierarchyConfig: async (config) => {
    const novel = get().activeNovel;
    if (!novel) return;
    try {
      const updated = await api.updateNovelHierarchyConfig(novel.id, config);
      set({ hierarchyConfig: updated });
      await get().loadContentTree(novel.id);
    } catch (e) {
      console.error('更新层级配置失败:', e);
    }
  },

  loadContentTree: async (novelId) => {
    const id = novelId || get().activeNovel?.id;
    if (!id) return;
    try {
      const contentTree = await api.getNovelContentTree(id);
      set({ contentTree, hierarchyConfig: contentTree.hierarchy_config });
    } catch (e) {
      console.error('加载大纲内容树失败:', e);
    }
  },

  loadHierarchyPartsAndVolumes: async (novelId) => {
    try {
      const [parts, volumes] = await Promise.all([
        api.listParts(novelId),
        api.listVolumes(novelId),
      ]);
      set({ parts, volumes });
    } catch (e) {
      console.error('加载部与分卷失败:', e);
    }
  },

  loadScenesForChapter: async (chapterId) => {
    try {
      const scenes = await api.listScenes(chapterId);
      set({
        scenes,
        activeScene: scenes.length > 0 ? scenes[0] : null,
      });
      if (scenes.length > 0) {
        await get().loadPlotBeats(scenes[0].id);
      } else {
        set({ plotBeats: [] });
      }
    } catch (e) {
      console.error('加载场景列表失败:', e);
    }
  },

  selectScene: async (scene) => {
    set({ activeScene: scene });
    await Promise.all([
      get().loadPlotBeats(scene.id),
      get().loadCreationContext(scene.chapter_id, scene.id),
    ]);
  },

  loadPlotBeats: async (sceneId) => {
    try {
      const plotBeats = await api.listPlotBeats(sceneId);
      set({ plotBeats });
    } catch (e) {
      console.error('加载情节节拍失败:', e);
    }
  },

  loadCharacterArcs: async (novelId) => {
    const id = novelId || get().activeNovel?.id;
    if (!id) return;
    try {
      const characterArcs = await api.listCharacterArcs(id);
      set({ characterArcs });
    } catch (e) {
      console.error('加载角色成长弧失败:', e);
    }
  },

  loadParallelThreads: async (novelId) => {
    const id = novelId || get().activeNovel?.id;
    if (!id) return;
    try {
      const parallelThreads = await api.listParallelThreads(id);
      set({ parallelThreads });
    } catch (e) {
      console.error('加载并行叙事线失败:', e);
    }
  },

  loadPlotMatrix: async (novelId) => {
    const id = novelId || get().activeNovel?.id;
    if (!id) return;
    try {
      const plotMatrix = await api.listNovelPlotMatrix(id);
      set({ plotMatrix });
    } catch (e) {
      console.error('加载剧情关系矩阵失败:', e);
    }
  },

  loadCreationContext: async (chapterId, sceneId) => {
    const novel = get().activeNovel;
    if (!novel) return;
    try {
      const creationContext = await api.assembleHierarchicalCreationContext(novel.id, chapterId, sceneId);
      set({ creationContext });
    } catch (e) {
      console.error('加载创作上下文失败:', e);
    }
  },

  splitChapter: async (splitPoint, newTitle) => {
    const chapter = get().activeChapter;
    const novel = get().activeNovel;
    if (!chapter || !novel) return;

    try {
      const [originalCh] = await api.splitChapter({
        chapter_id: chapter.id,
        split_type: 'CONTENT_OFFSET',
        split_point: splitPoint,
        new_chapter_title: newTitle,
      });

      await get().loadChapters(novel.id);
      await get().loadContentTree(novel.id);
      await get().selectChapter(originalCh);
    } catch (e) {
      console.error('拆分章节失败:', e);
      throw e;
    }
  },

  mergeChapters: async (sourceId, targetId) => {
    const novel = get().activeNovel;
    if (!novel) return;

    try {
      const mergedCh = await api.mergeChapters({
        source_chapter_id: sourceId,
        target_chapter_id: targetId,
      });

      await get().loadChapters(novel.id);
      await get().loadContentTree(novel.id);
      await get().selectChapter(mergedCh);
    } catch (e) {
      console.error('合并章节失败:', e);
      throw e;
    }
  },

  renumberHierarchy: async () => {
    const novel = get().activeNovel;
    if (!novel) return;

    try {
      await api.renumberHierarchy({
        novel_id: novel.id,
        per_volume_chapter_numbering: false,
      });

      await Promise.all([
        get().loadChapters(novel.id),
        get().loadContentTree(novel.id),
        get().loadHierarchyPartsAndVolumes(novel.id),
      ]);
    } catch (e) {
      console.error('层级重编号失败:', e);
      throw e;
    }
  },
}));
