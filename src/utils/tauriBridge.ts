import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type {
  Novel,
  Volume,
  Chapter,
  ChapterVersion,
  Character,
  CharacterRelationship,
  StoryPhase,
  StoryArc,
  Scene,
  StoryEvent,
  WorldRule,
  PlotThread,
  AiProvider,
  AiModel,
  ConnectionTestResult,
  StreamChunkPayload,
  ReviewReport,
  StylePolishResponse,
  CollaborativeWorkflowResult,
  CanonFact,
  CharacterStateEvent,
  MemoryContextPack,
  ExtractChapterMemoryResult,
  SerializationJob,
  StartSerializationJobInput,
} from '@/types';

export const api = {
  // Novels
  listNovels: () => invoke<Novel[]>('list_novels'),
  getNovel: (id: string) => invoke<Novel>('get_novel', { id }),
  createNovel: (input: {
    title: string;
    description?: string;
    genre_profile?: string;
    language?: string;
    writing_style?: string;
    chapter_target_length?: number;
  }) => invoke<Novel>('create_novel', { input }),
  deleteNovel: (id: string) => invoke<void>('delete_novel', { id }),

  // Volumes & Chapters
  listVolumes: (novelId: string) => invoke<Volume[]>('list_volumes', { novelId }),
  listChapters: (novelId: string) => invoke<Chapter[]>('list_chapters', { novelId }),
  getChapter: (id: string) => invoke<Chapter>('get_chapter', { id }),
  createChapter: (input: {
    novel_id: string;
    volume_id?: string;
    chapter_number?: number;
    title: string;
    initial_content?: string;
  }) => invoke<Chapter>('create_chapter', { input }),
  saveChapterContent: (
    chapterId: string,
    content: string,
    createNewVersion: boolean,
    sourceType?: string
  ) =>
    invoke<Chapter>('save_chapter_content', {
      chapterId,
      content,
      createNewVersion,
      sourceType,
    }),
  listChapterVersions: (chapterId: string) =>
    invoke<ChapterVersion[]>('list_chapter_versions', { chapterId }),
  deleteChapter: (id: string) => invoke<void>('delete_chapter', { id }),

  // Story Bible
  listCharacters: (novelId: string) => invoke<Character[]>('list_characters', { novelId }),
  createCharacter: (input: {
    novel_id: string;
    name: string;
    aliases?: string;
    profile?: string;
    personality?: string;
    background?: string;
    motivation?: string;
  }) => invoke<Character>('create_character', { input }),

  listWorldRules: (novelId: string) => invoke<WorldRule[]>('list_world_rules', { novelId }),
  createWorldRule: (input: {
    novel_id: string;
    title: string;
    rule_content: string;
    authority_level?: string;
  }) => invoke<WorldRule>('create_world_rule', { input }),

  listPlotThreads: (novelId: string) => invoke<PlotThread[]>('list_plot_threads', { novelId }),
  createPlotThread: (input: {
    novel_id: string;
    title: string;
    description?: string;
    introduced_chapter_id?: string;
    expected_resolution?: string;
  }) => invoke<PlotThread>('create_plot_thread', { input }),

  // Phase 2: Relationships, Plot Arcs, Scenes, Events
  listCharacterRelationships: (novelId: string) =>
    invoke<CharacterRelationship[]>('list_character_relationships', { novelId }),
  createCharacterRelationship: (input: {
    novel_id: string;
    source_character_id: string;
    target_character_id: string;
    relation_type: string;
    description?: string;
  }) => invoke<CharacterRelationship>('create_character_relationship', { input }),
  deleteCharacterRelationship: (id: string) =>
    invoke<void>('delete_character_relationship', { id }),

  listStoryPhases: (novelId: string) =>
    invoke<StoryPhase[]>('list_story_phases', { novelId }),
  createStoryPhase: (input: {
    novel_id: string;
    title: string;
    order_index?: number;
    goal?: string;
  }) => invoke<StoryPhase>('create_story_phase', { input }),
  deleteStoryPhase: (id: string) =>
    invoke<void>('delete_story_phase', { id }),

  listStoryArcs: (novelId: string) =>
    invoke<StoryArc[]>('list_story_arcs', { novelId }),
  createStoryArc: (input: {
    novel_id: string;
    phase_id?: string;
    title: string;
    goal?: string;
    description?: string;
    priority?: string;
  }) => invoke<StoryArc>('create_story_arc', { input }),
  updateStoryArcStatus: (id: string, status: string) =>
    invoke<void>('update_story_arc_status', { id, status }),

  listScenes: (chapterId: string) =>
    invoke<Scene[]>('list_scenes', { chapterId }),
  createScene: (input: {
    chapter_id: string;
    sequence: number;
    objective: string;
    outline: string;
    pov_character_id?: string;
    location_id?: string;
  }) => invoke<Scene>('create_scene', { input }),
  updateSceneStatus: (id: string, status: string) =>
    invoke<void>('update_scene_status', { id, status }),

  listStoryEvents: (novelId: string) =>
    invoke<StoryEvent[]>('list_story_events', { novelId }),
  createStoryEvent: (input: {
    novel_id: string;
    title: string;
    description?: string;
    story_time?: string;
    source_chapter_id?: string;
  }) => invoke<StoryEvent>('create_story_event', { input }),

  // Phase 3: Review Reports & Multi-Agent Orchestration
  listReviewReports: (chapterId: string) =>
    invoke<ReviewReport[]>('list_review_reports', { chapterId }),
  getLatestReviewReport: (chapterId: string) =>
    invoke<ReviewReport | null>('get_latest_review_report', { chapterId }),
  updateFindingStatus: (findingId: string, status: string) =>
    invoke<void>('update_finding_status', { findingId, status }),

  runContinuityAudit: (chapterId: string) =>
    invoke<ReviewReport>('run_continuity_audit', { chapterId }),
  runStylePolish: (novelId: string, selectedText: string) =>
    invoke<StylePolishResponse>('run_style_polish', { novelId, selectedText }),
  runScenePlanning: (chapterId: string, goal: string) =>
    invoke<Scene[]>('run_scene_planning', { chapterId, goal }),
  runCollaborativeWorkflow: (input: {
    novel_id: string;
    chapter_id: string;
    chapter_goal: string;
    target_word_count?: number;
    skip_audit?: boolean;
  }) => invoke<CollaborativeWorkflowResult>('run_collaborative_workflow', { input }),

  // AI Providers & Models
  listProviders: () => invoke<AiProvider[]>('list_providers'),
  listModels: (providerId: string) => invoke<AiModel[]>('list_models', { providerId }),
  saveProvider: (input: {
    id?: string;
    name: string;
    provider_type: string;
    base_url: string;
    api_key: string;
    is_active: boolean;
    models: Array<{
      id?: string;
      model_name: string;
      display_name: string;
      context_window?: number;
      max_output_tokens?: number;
      is_default?: boolean;
    }>;
  }) => invoke<AiProvider>('save_provider', { input }),
  testProviderConnection: (
    baseUrl: string,
    apiKey: string,
    modelName?: string
  ) =>
    invoke<ConnectionTestResult>('test_provider_connection', {
      baseUrl,
      apiKey,
      modelName,
    }),

  // AI Generation with Streaming
  generateStreamChapter: (input: {
    novel_id: string;
    chapter_id: string;
    instruction: string;
    context_mode?: string;
    current_content?: string;
    model_id?: string;
    temperature?: number;
    max_tokens?: number;
  }) => invoke<string>('generate_stream_chapter', { input }),

  onStreamChunk: (callback: (payload: StreamChunkPayload) => void) => {
    return listen<StreamChunkPayload>('novel-stream-chunk', (event) => {
      callback(event.payload);
    });
  },

  // Export
  exportChapterText: (chapterId: string, format: 'txt' | 'markdown') =>
    invoke<string>('export_chapter_text', { chapterId, format }),
  exportNovelText: (novelId: string, format: 'txt' | 'markdown') =>
    invoke<string>('export_novel_text', { novelId, format }),

  getDbStats: () => invoke<{ db_path: string; total_novels: number; total_providers: number }>('get_db_stats'),

  // Phase 4: Layered Memory Engine (L0~L4)
  listCanonFacts: (novelId: string, query?: string) =>
    invoke<CanonFact[]>('list_canon_facts', { novelId, query }),
  createCanonFact: (input: {
    novel_id: string;
    subject_id?: string;
    predicate: string;
    object_value: string;
    truth_scope?: string;
    authority_level?: string;
    source_chapter_id?: string;
  }) => invoke<CanonFact>('create_canon_fact', { input }),
  deleteCanonFact: (id: string) =>
    invoke<void>('delete_canon_fact', { id }),

  listCharacterStateEvents: (characterId: string) =>
    invoke<CharacterStateEvent[]>('list_character_state_events', { characterId }),
  createCharacterStateEvent: (input: {
    character_id: string;
    source_chapter_id?: string;
    effective_time?: string;
    field_name: string;
    previous_value?: string;
    new_value: string;
  }) => invoke<CharacterStateEvent>('create_character_state_event', { input }),

  searchChaptersFts: (novelId: string, query: string) =>
    invoke<Array<[string, string, string]>>('search_chapters_fts', { novelId, query }),

  assembleMemoryContextPack: (
    novelId: string,
    chapterId: string,
    promptIntent: string,
    targetCharacterIds?: string[]
  ) =>
    invoke<MemoryContextPack>('assemble_memory_context_pack', {
      novelId,
      chapterId,
      promptIntent,
      targetCharacterIds,
    }),

  extractChapterMemory: (chapterId: string) =>
    invoke<ExtractChapterMemoryResult>('extract_chapter_memory', { chapterId }),

  // Phase 5: Serialization Engine
  createSerializationJob: (input: StartSerializationJobInput) =>
    invoke<SerializationJob>('create_serialization_job', { input }),
  getSerializationJob: (jobId: string) =>
    invoke<SerializationJob>('get_serialization_job', { jobId }),
  listSerializationJobs: (novelId: string) =>
    invoke<SerializationJob[]>('list_serialization_jobs', { novelId }),
  pauseSerializationJob: (jobId: string) =>
    invoke<void>('pause_serialization_job', { jobId }),
  cancelSerializationJob: (jobId: string) =>
    invoke<void>('cancel_serialization_job', { jobId }),
  advanceSerializationJobStep: (jobId: string) =>
    invoke<SerializationJob>('advance_serialization_job_step', { jobId }),
};
