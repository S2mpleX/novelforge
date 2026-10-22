import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { handleWebMockCall } from './webMockStorage';
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
  CreateSceneInput,
  UpdateSceneInput,
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
  DatabaseHealthReport,
  Series,
  Part,
  HierarchyConfig,
  PlotBeat,
  CreatePlotBeatInput,
  CharacterArc,
  CreateCharacterArcInput,
  ParallelThread,
  CreateParallelThreadInput,
  PlotAssociation,
  CreatePlotAssociationInput,
  PlotAssociationView,
  MoveNodeInput,
  SplitChapterInput,
  MergeChaptersInput,
  SplitSceneInput,
  MergeScenesInput,
  RenumberHierarchyInput,
  NovelContentTree,
  HierarchicalCreationContext,
  WorkflowTemplate,
  SaveWorkflowTemplateInput,
  WorkflowRun,
  CreateWorkflowRunInput,
  AdvanceWorkflowStepInput,
  UpdateWorkflowStepOutputInput,
  WorkflowRunDetails,
  ExecuteToolboxActionInput,
  ExecuteToolboxActionResult,
  VoiceProfile,
  SaveVoiceProfileInput,
  GenerateFindingRepairInput,
  FindingRepairResult,
  ModelArenaRun,
  SaveModelArenaRunInput,
  ArenaStreamChunkPayload,
  ExecuteArenaDuelInput,
  ArenaDuelResult,
  MergeArenaOutputsInput,
  EpubExportResult,
  OptimizeWritingPromptInput,
  OptimizeWritingPromptResult,
  ChapterProposal,
  RollbackResult,
  EvaluationReport,
  CharacterSandboxSession,
  CreateSandboxSessionInput,
  UpdateSandboxSessionInput,
  ExecuteSandboxStepInput,
  ExecuteSandboxStepResult,
  SynthesizeSandboxProseInput,
  SynthesizeSandboxProseResult,
  ProbeCharacterActionsInput,
  ProbeCharacterActionsResult,
  DistillSandboxInspirationsInput,
  DistillSandboxInspirationsResult,
  AnalyzeCharacterAppearanceInput,
  AnalyzeCharacterAppearanceResult,
  GenerateImageInput,
  GenerateImageResult,
} from '@/types';

/**
 * 探测当前是否运行于 Tauri 原生桌面 WebView 环境
 */
export const isTauri = (): boolean => {
  return typeof window !== 'undefined' && Boolean((window as any).__TAURI_INTERNALS__);
};

/**
 * 安全 IPC 调度封装器：
 * - 桌面环境：无缝调用 Rust 原生后端与 SQLite；
 * - 浏览器环境 (localhost:1420)：自动降级到 Web Mock 存储与浏览器网络探测，杜绝 `reading 'invoke'` 崩溃。
 */
async function safeInvoke<T>(cmd: string, args?: any): Promise<T> {
  if (isTauri()) {
    return invoke<T>(cmd, args);
  }
  return handleWebMockCall(cmd, args) as Promise<T>;
}

const webStreamListeners: Array<(payload: StreamChunkPayload) => void> = [];
const arenaStreamListeners: Array<(payload: ArenaStreamChunkPayload) => void> = [];

export function emitWebStreamChunk(payload: StreamChunkPayload) {
  webStreamListeners.forEach((fn) => {
    try {
      fn(payload);
    } catch (e) {
      console.error('WebStream listener error:', e);
    }
  });
}

export function emitArenaStreamChunk(payload: ArenaStreamChunkPayload) {
  arenaStreamListeners.forEach((fn) => {
    try {
      fn(payload);
    } catch (e) {
      console.error('ArenaStream listener error:', e);
    }
  });
}

export const api = {
  // Novels
  listNovels: () => safeInvoke<Novel[]>('list_novels'),
  getNovel: (id: string) => safeInvoke<Novel>('get_novel', { id }),
  createNovel: (input: {
    title: string;
    description?: string;
    genre_profile?: string;
    language?: string;
    writing_style?: string;
    chapter_target_length?: number;
    cover_url?: string;
  }) => safeInvoke<Novel>('create_novel', { input }),
  deleteNovel: (id: string) => safeInvoke<void>('delete_novel', { id }),
  updateNovel: (input: {
    id: string;
    title: string;
    description?: string;
    genre_profile?: string;
    writing_style?: string;
    cover_url?: string;
  }) => safeInvoke<Novel>('update_novel', { input }),

  // Volumes & Chapters
  listVolumes: (novelId: string) => safeInvoke<Volume[]>('list_volumes', { novelId }),
  createVolume: (input: {
    novel_id: string;
    title: string;
    part_id?: string;
    order_index?: number;
    summary?: string;
  }) => safeInvoke<Volume>('create_volume', { input }),
  updateVolume: (input: {
    id: string;
    title: string;
    summary?: string;
  }) => safeInvoke<Volume>('update_volume', { input }),
  deleteVolume: (id: string) => safeInvoke<void>('delete_volume', { id }),
  listChapters: (novelId: string) => safeInvoke<Chapter[]>('list_chapters', { novelId }),
  getChapter: (id: string) => safeInvoke<Chapter>('get_chapter', { id }),
  createChapter: (input: {
    novel_id: string;
    volume_id?: string;
    chapter_number?: number;
    title: string;
    initial_content?: string;
  }) => safeInvoke<Chapter>('create_chapter', { input }),
  updateChapterTitle: (chapterId: string, title: string) =>
    safeInvoke<Chapter>('update_chapter_title', { chapterId, title }),
  saveChapterContent: (
    chapterId: string,
    content: string,
    createNewVersion: boolean,
    sourceType?: string
  ) =>
    safeInvoke<Chapter>('save_chapter_content', {
      chapterId,
      content,
      createNewVersion,
      sourceType,
    }),
  listChapterVersions: (chapterId: string) =>
    safeInvoke<ChapterVersion[]>('list_chapter_versions', { chapterId }),
  createChapterProposal: (input: {
    novel_id: string;
    chapter_id: string;
    content: string;
    proposal_summary?: string;
    reasoning_trace?: string;
  }) => safeInvoke<ChapterProposal>('create_chapter_proposal', { input }),
  listChapterProposals: (chapterId: string) =>
    safeInvoke<ChapterProposal[]>('list_chapter_proposals', { chapterId }),
  acceptChapterProposal: (input: {
    novel_id: string;
    chapter_id: string;
    version_id: string;
  }) => safeInvoke<Chapter>('accept_chapter_proposal', { input }),
  rollbackChapterVersion: (input: {
    novel_id: string;
    chapter_id: string;
    target_version_id: string;
    cascade_memory?: boolean;
  }) => safeInvoke<RollbackResult>('rollback_chapter_version', { input }),
  evaluateChapter: (input: {
    novel_id: string;
    chapter_id?: string;
    content?: string;
  }) => safeInvoke<EvaluationReport>('evaluate_chapter', { input }),
  deleteChapter: (id: string) => safeInvoke<void>('delete_chapter', { id }),

  // Story Bible
  listCharacters: (novelId: string) => safeInvoke<Character[]>('list_characters', { novelId }),
  createCharacter: (input: {
    novel_id: string;
    name: string;
    aliases?: string;
    profile?: string;
    personality?: string;
    background?: string;
    motivation?: string;
    gender?: string;
    avatar_url?: string;
    visual_summary?: string;
  }) => safeInvoke<Character>('create_character', { input }),
  updateCharacterStatus: (id: string, status: string) =>
    safeInvoke<void>('update_character_status', { id, status }),
  updateCharacter: (input: {
    id: string;
    name: string;
    aliases?: string;
    profile?: string;
    personality?: string;
    background?: string;
    motivation?: string;
    gender?: string;
    avatar_url?: string;
    visual_summary?: string;
    status?: string;
  }) => safeInvoke<Character>('update_character', { input }),
  deleteCharacter: (id: string) => safeInvoke<void>('delete_character', { id }),

  listWorldRules: (novelId: string) => safeInvoke<WorldRule[]>('list_world_rules', { novelId }),
  createWorldRule: (input: {
    novel_id: string;
    title: string;
    rule_content: string;
    authority_level?: string;
  }) => safeInvoke<WorldRule>('create_world_rule', { input }),
  updateWorldRule: (input: {
    id: string;
    title: string;
    rule_content: string;
    authority_level?: string;
    status?: string;
  }) => safeInvoke<WorldRule>('update_world_rule', { input }),
  deleteWorldRule: (id: string) => safeInvoke<void>('delete_world_rule', { id }),

  listPlotThreads: (novelId: string) => safeInvoke<PlotThread[]>('list_plot_threads', { novelId }),
  createPlotThread: (input: {
    novel_id: string;
    title: string;
    description?: string;
    introduced_chapter_id?: string;
    expected_resolution?: string;
  }) => safeInvoke<PlotThread>('create_plot_thread', { input }),
  updatePlotThreadStatus: (id: string, status: string) =>
    safeInvoke<void>('update_plot_thread_status', { id, status }),
  updatePlotThread: (input: {
    id: string;
    title: string;
    description?: string;
    introduced_chapter_id?: string;
    expected_resolution?: string;
    resolved_chapter_id?: string;
    status?: string;
  }) => safeInvoke<PlotThread>('update_plot_thread', { input }),
  deletePlotThread: (id: string) => safeInvoke<void>('delete_plot_thread', { id }),

  // Phase 2: Relationships, Plot Arcs, Scenes, Events
  listCharacterRelationships: (novelId: string) =>
    safeInvoke<CharacterRelationship[]>('list_character_relationships', { novelId }),
  createCharacterRelationship: (input: {
    novel_id: string;
    source_character_id: string;
    target_character_id: string;
    relation_type: string;
    description?: string;
  }) => safeInvoke<CharacterRelationship>('create_character_relationship', { input }),
  deleteCharacterRelationship: (id: string) =>
    safeInvoke<void>('delete_character_relationship', { id }),

  listStoryPhases: (novelId: string) =>
    safeInvoke<StoryPhase[]>('list_story_phases', { novelId }),
  createStoryPhase: (input: {
    novel_id: string;
    title: string;
    order_index?: number;
    goal?: string;
  }) => safeInvoke<StoryPhase>('create_story_phase', { input }),
  updateStoryPhase: (input: {
    id: string;
    title: string;
    order_index?: number;
    goal?: string;
  }) => safeInvoke<StoryPhase>('update_story_phase', { input }),
  deleteStoryPhase: (id: string) =>
    safeInvoke<void>('delete_story_phase', { id }),

  listStoryArcs: (novelId: string) =>
    safeInvoke<StoryArc[]>('list_story_arcs', { novelId }),
  createStoryArc: (input: {
    novel_id: string;
    phase_id?: string;
    title: string;
    goal?: string;
    description?: string;
    priority?: string;
  }) => safeInvoke<StoryArc>('create_story_arc', { input }),
  updateStoryArcStatus: (id: string, status: string) =>
    safeInvoke<void>('update_story_arc_status', { id, status }),
  deleteStoryArc: (id: string) =>
    safeInvoke<void>('delete_story_arc', { id }),

  listScenes: (chapterId: string) =>
    safeInvoke<Scene[]>('list_scenes', { chapterId }),
  getScene: (id: string) =>
    safeInvoke<Scene>('get_scene', { id }),
  createScene: (input: CreateSceneInput) =>
    safeInvoke<Scene>('create_scene', { input }),
  updateScene: (input: UpdateSceneInput) =>
    safeInvoke<Scene>('update_scene', { input }),
  deleteScene: (id: string) =>
    safeInvoke<void>('delete_scene', { id }),
  updateSceneStatus: (id: string, status: string) =>
    safeInvoke<void>('update_scene_status', { id, status }),

  listStoryEvents: (novelId: string) =>
    safeInvoke<StoryEvent[]>('list_story_events', { novelId }),
  createStoryEvent: (input: {
    novel_id: string;
    title: string;
    description?: string;
    story_time?: string;
    source_chapter_id?: string;
  }) => safeInvoke<StoryEvent>('create_story_event', { input }),

  // Phase 3: Review Reports & Multi-Agent Orchestration
  listReviewReports: (chapterId: string) =>
    safeInvoke<ReviewReport[]>('list_review_reports', { chapterId }),
  getLatestReviewReport: (chapterId: string) =>
    safeInvoke<ReviewReport | null>('get_latest_review_report', { chapterId }),
  updateFindingStatus: (findingId: string, status: string) =>
    safeInvoke<void>('update_finding_status', { findingId, status }),

  runContinuityAudit: (chapterId: string) =>
    safeInvoke<ReviewReport>('run_continuity_audit', { chapterId }),
  runStylePolish: (novelId: string, selectedText: string) =>
    safeInvoke<StylePolishResponse>('run_style_polish', { novelId, selectedText }),
  runScenePlanning: (chapterId: string, goal: string) =>
    safeInvoke<Scene[]>('run_scene_planning', { chapterId, goal }),
  runCollaborativeWorkflow: (input: {
    novel_id: string;
    chapter_id: string;
    chapter_goal: string;
    target_word_count?: number;
    skip_audit?: boolean;
  }) => safeInvoke<CollaborativeWorkflowResult>('run_collaborative_workflow', { input }),

  // AI Providers & Models
  listProviders: () => safeInvoke<AiProvider[]>('list_providers'),
  listModels: (providerId: string) => safeInvoke<AiModel[]>('list_models', { providerId }),
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
  }) => safeInvoke<AiProvider>('save_provider', { input }),
  testProviderConnection: (
    baseUrl: string,
    apiKey: string,
    modelName?: string
  ) =>
    safeInvoke<ConnectionTestResult>('test_provider_connection', {
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
  }) => safeInvoke<string>('generate_stream_chapter', { input }),

  onStreamChunk: (callback: (payload: StreamChunkPayload) => void) => {
    if (!isTauri()) {
      webStreamListeners.push(callback);
      return Promise.resolve(() => {
        const idx = webStreamListeners.indexOf(callback);
        if (idx !== -1) webStreamListeners.splice(idx, 1);
      });
    }
    return listen<StreamChunkPayload>('novel-stream-chunk', (event) => {
      callback(event.payload);
    });
  },

  // Export
  exportChapterText: (chapterId: string, format: 'txt' | 'markdown') =>
    safeInvoke<string>('export_chapter_text', { chapterId, format }),
  exportNovelText: (novelId: string, format: 'txt' | 'markdown') =>
    safeInvoke<string>('export_novel_text', { novelId, format }),

  getDbStats: () =>
    safeInvoke<{ db_path: string; total_novels: number; total_providers: number }>('get_db_stats'),

  // Phase 4: Layered Memory Engine (L0~L4)
  listCanonFacts: (novelId: string, query?: string) =>
    safeInvoke<CanonFact[]>('list_canon_facts', { novelId, query }),
  createCanonFact: (input: {
    novel_id: string;
    subject_id?: string;
    predicate: string;
    object_value: string;
    truth_scope?: string;
    authority_level?: string;
    source_chapter_id?: string;
  }) => safeInvoke<CanonFact>('create_canon_fact', { input }),
  deleteCanonFact: (id: string) =>
    safeInvoke<void>('delete_canon_fact', { id }),

  listCharacterStateEvents: (characterId: string) =>
    safeInvoke<CharacterStateEvent[]>('list_character_state_events', { characterId }),
  createCharacterStateEvent: (input: {
    character_id: string;
    source_chapter_id?: string;
    effective_time?: string;
    field_name: string;
    previous_value?: string;
    new_value: string;
  }) => safeInvoke<CharacterStateEvent>('create_character_state_event', { input }),

  searchChaptersFts: (novelId: string, query: string) =>
    safeInvoke<Array<[string, string, string]>>('search_chapters_fts', { novelId, query }),

  assembleMemoryContextPack: (
    novelId: string,
    chapterId: string,
    promptIntent: string,
    targetCharacterIds?: string[]
  ) =>
    safeInvoke<MemoryContextPack>('assemble_memory_context_pack', {
      novelId,
      chapterId,
      promptIntent,
      targetCharacterIds,
    }),

  extractChapterMemory: (chapterId: string) =>
    safeInvoke<ExtractChapterMemoryResult>('extract_chapter_memory', { chapterId }),

  // Phase 5: Serialization Engine
  createSerializationJob: (input: StartSerializationJobInput) =>
    safeInvoke<SerializationJob>('create_serialization_job', { input }),
  startSerializationJob: (input: StartSerializationJobInput) =>
    safeInvoke<SerializationJob>('create_serialization_job', { input }),
  getSerializationJob: (jobId: string) =>
    safeInvoke<SerializationJob>('get_serialization_job', { jobId }),
  listSerializationJobs: (novelId: string) =>
    safeInvoke<SerializationJob[]>('list_serialization_jobs', { novelId }),
  pauseSerializationJob: (jobId: string) =>
    safeInvoke<void>('pause_serialization_job', { jobId }),
  cancelSerializationJob: (jobId: string) =>
    safeInvoke<void>('cancel_serialization_job', { jobId }),
  advanceSerializationJobStep: (jobId: string) =>
    safeInvoke<SerializationJob>('advance_serialization_job_step', { jobId }),

  // Phase 6 & 7: Publishing & System Diagnostics
  exportNovelHtmlBook: (novelId: string) =>
    safeInvoke<string>('export_novel_html_book', { novelId }),
  exportNovelArchive: (novelId: string) =>
    safeInvoke<string>('export_novel_archive', { novelId }),
  importNovelArchive: (archiveJson: string) =>
    safeInvoke<Novel>('import_novel_archive', { archiveJson }),
  backupDatabase: () =>
    safeInvoke<string>('backup_database'),
  optimizeDatabase: () =>
    safeInvoke<DatabaseHealthReport>('optimize_database'),

  // --- V2.0: Series & Parts ---
  createSeries: (input: { title: string; description?: string; genre_profile?: string; world_definition?: string }) =>
    safeInvoke<Series>('create_series', { input }),
  listSeries: () =>
    safeInvoke<Series[]>('list_series'),
  getSeries: (id: string) =>
    safeInvoke<Series>('get_series', { id }),
  deleteSeries: (id: string) =>
    safeInvoke<void>('delete_series', { id }),

  createPart: (input: { novel_id: string; title: string; part_number?: number; summary?: string; order_index?: number }) =>
    safeInvoke<Part>('create_part', { input }),
  listParts: (novelId: string) =>
    safeInvoke<Part[]>('list_parts', { novelId }),
  getPart: (id: string) =>
    safeInvoke<Part>('get_part', { id }),
  deletePart: (id: string) =>
    safeInvoke<void>('delete_part', { id }),

  // --- V2.0: Hierarchy Config ---
  getNovelHierarchyConfig: (novelId: string) =>
    safeInvoke<HierarchyConfig>('get_novel_hierarchy_config', { novelId }),
  updateNovelHierarchyConfig: (novelId: string, config: HierarchyConfig) =>
    safeInvoke<HierarchyConfig>('update_novel_hierarchy_config', { novelId, config }),

  // --- V2.0: Plot Beats ---
  createPlotBeat: (input: CreatePlotBeatInput) =>
    safeInvoke<PlotBeat>('create_plot_beat', { input }),
  listPlotBeats: (sceneId: string) =>
    safeInvoke<PlotBeat[]>('list_plot_beats', { sceneId }),
  updatePlotBeatStatus: (beatId: string, status: string) =>
    safeInvoke<void>('update_plot_beat_status', { beatId, status }),
  deletePlotBeat: (id: string) =>
    safeInvoke<void>('delete_plot_beat', { id }),

  // --- V2.0: Character Arcs ---
  createCharacterArc: (input: CreateCharacterArcInput) =>
    safeInvoke<CharacterArc>('create_character_arc', { input }),
  listCharacterArcs: (novelId: string) =>
    safeInvoke<CharacterArc[]>('list_character_arcs', { novelId }),
  updateCharacterArcStage: (arcId: string, currentStage: string, status?: string) =>
    safeInvoke<void>('update_character_arc_stage', { arcId, currentStage, status }),
  deleteCharacterArc: (id: string) =>
    safeInvoke<void>('delete_character_arc', { id }),

  // --- V2.0: Parallel Threads ---
  createParallelThread: (input: CreateParallelThreadInput) =>
    safeInvoke<ParallelThread>('create_parallel_thread', { input }),
  listParallelThreads: (novelId: string) =>
    safeInvoke<ParallelThread[]>('list_parallel_threads', { novelId }),
  updateParallelThreadStatus: (threadId: string, status: string) =>
    safeInvoke<void>('update_parallel_thread_status', { threadId, status }),
  deleteParallelThread: (id: string) =>
    safeInvoke<void>('delete_parallel_thread', { id }),

  // --- V2.0: Independent Plot Associations (M:N) ---
  createPlotAssociation: (input: CreatePlotAssociationInput) =>
    safeInvoke<PlotAssociation>('create_plot_association', { input }),
  deletePlotAssociation: (id: string) =>
    safeInvoke<void>('delete_plot_association', { id }),
  listPlotAssociationsForTarget: (targetType: string, targetId: string) =>
    safeInvoke<PlotAssociationView[]>('list_plot_associations_for_target', { targetType, targetId }),
  listPlotAssociationsForEntity: (entityType: string, entityId: string) =>
    safeInvoke<PlotAssociationView[]>('list_plot_associations_for_entity', { entityType, entityId }),
  listNovelPlotMatrix: (novelId: string) =>
    safeInvoke<PlotAssociationView[]>('list_novel_plot_matrix', { novelId }),

  // --- V2.0: Hierarchy Lifecycle Operations ---
  moveNode: (input: MoveNodeInput) =>
    safeInvoke<void>('move_node', { input }),
  splitChapter: (input: SplitChapterInput) =>
    safeInvoke<[Chapter, Chapter]>('split_chapter', { input }),
  mergeChapters: (input: MergeChaptersInput) =>
    safeInvoke<Chapter>('merge_chapters', { input }),
  splitScene: (input: SplitSceneInput) =>
    safeInvoke<[Scene, Scene]>('split_scene', { input }),
  mergeScenes: (input: MergeScenesInput) =>
    safeInvoke<Scene>('merge_scenes', { input }),
  renumberHierarchy: (input: RenumberHierarchyInput) =>
    safeInvoke<void>('renumber_hierarchy', { input }),

  // --- V2.0: Content Tree & Hierarchical Creation Context ---
  getNovelContentTree: (novelId: string) =>
    safeInvoke<NovelContentTree>('get_novel_content_tree', { novelId }),
  assembleHierarchicalCreationContext: (novelId: string, chapterId: string, sceneId?: string) =>
    safeInvoke<HierarchicalCreationContext>('assemble_hierarchical_creation_context', { novelId, chapterId, sceneId }),

  // --- V2.3: Workflow Engine & Novelist Toolbox ---
  listWorkflowTemplates: (novelId?: string) =>
    safeInvoke<WorkflowTemplate[]>('list_workflow_templates', { novelId }),
  saveWorkflowTemplate: (input: SaveWorkflowTemplateInput) =>
    safeInvoke<WorkflowTemplate>('save_workflow_template', { input }),
  createWorkflowRun: (input: CreateWorkflowRunInput) =>
    safeInvoke<WorkflowRun>('create_workflow_run', { input }),
  getWorkflowRunDetails: (runId: string) =>
    safeInvoke<WorkflowRunDetails>('get_workflow_run_details', { runId }),
  listWorkflowRuns: (novelId: string) =>
    safeInvoke<WorkflowRun[]>('list_workflow_runs', { novelId }),
  updateWorkflowStepOutput: (input: UpdateWorkflowStepOutputInput) =>
    safeInvoke<void>('update_workflow_step_output', { input }),
  advanceWorkflowStep: (input: AdvanceWorkflowStepInput) =>
    safeInvoke<WorkflowRunDetails>('advance_workflow_step', { input }),
  assembleToolboxPrompt: (input: ExecuteToolboxActionInput) =>
    safeInvoke<ExecuteToolboxActionResult>('assemble_toolbox_prompt', { input }),
  executeLlmChat: (input: {
    system_prompt: string;
    user_prompt: string;
    temperature?: number;
    max_tokens?: number;
  }) => safeInvoke<string>('execute_llm_chat', input),

  // --- V2.3.1: Voice Profiles & Finding Repair ---
  listVoiceProfiles: (novelId?: string) =>
    safeInvoke<VoiceProfile[]>('list_voice_profiles', { novelId }),
  saveVoiceProfile: (input: SaveVoiceProfileInput) =>
    safeInvoke<VoiceProfile>('save_voice_profile', { input }),
  setActiveVoiceProfile: (id: string, novelId?: string) =>
    safeInvoke<void>('set_active_voice_profile', { id, novelId }),
  deleteVoiceProfile: (id: string) =>
    safeInvoke<void>('delete_voice_profile', { id }),
  generateFindingRepair: (input: GenerateFindingRepairInput) =>
    safeInvoke<FindingRepairResult>('generate_finding_repair', { input }),

  // --- V2.4: Multi-Model Arena ---
  onArenaStreamChunk: (callback: (payload: ArenaStreamChunkPayload) => void) => {
    if (isTauri()) {
      return listen<ArenaStreamChunkPayload>('arena-stream-chunk', (event) => {
        callback(event.payload);
      });
    }
    arenaStreamListeners.push(callback);
    return Promise.resolve(() => {
      const idx = arenaStreamListeners.indexOf(callback);
      if (idx !== -1) arenaStreamListeners.splice(idx, 1);
    });
  },
  executeArenaDuel: (input: ExecuteArenaDuelInput) =>
    safeInvoke<ArenaDuelResult>('execute_arena_duel', { input }),
  mergeArenaOutputs: (input: MergeArenaOutputsInput) =>
    safeInvoke<string>('merge_arena_outputs', { input }),
  listModelArenaRuns: (novelId: string) =>
    safeInvoke<ModelArenaRun[]>('list_model_arena_runs', { novelId }),
  saveModelArenaRun: (input: SaveModelArenaRunInput) =>
    safeInvoke<ModelArenaRun>('save_model_arena_run', { input }),
  deleteModelArenaRun: (id: string) =>
    safeInvoke<void>('delete_model_arena_run', { id }),

  // --- V2.5: EPUB 3 Export ---
  exportNovelEpub: (novelId: string, outputPath?: string) =>
    safeInvoke<EpubExportResult>('export_novel_epub', { novelId, outputPath }),

  // --- V2.5.1: AI Prompt Optimizer ---
  optimizeWritingPrompt: (input: OptimizeWritingPromptInput) =>
    safeInvoke<OptimizeWritingPromptResult>('optimize_writing_prompt', { input }),

  // --- V3.4.0: Character Dialogue Sandbox ---
  createSandboxSession: (input: CreateSandboxSessionInput) =>
    safeInvoke<CharacterSandboxSession>('create_character_sandbox_session', { input }),
  getSandboxSession: (id: string) =>
    safeInvoke<CharacterSandboxSession>('get_character_sandbox_session', { id }),
  listSandboxSessions: (novelId: string) =>
    safeInvoke<CharacterSandboxSession[]>('list_character_sandbox_sessions', { novelId }),
  updateSandboxSession: (input: UpdateSandboxSessionInput) =>
    safeInvoke<CharacterSandboxSession>('update_character_sandbox_session', { input }),
  deleteSandboxSession: (id: string) =>
    safeInvoke<void>('delete_character_sandbox_session', { id }),
  executeSandboxStep: (input: ExecuteSandboxStepInput) =>
    safeInvoke<ExecuteSandboxStepResult>('execute_character_sandbox_step', { input }),
  probeCharacterNextActions: (input: ProbeCharacterActionsInput) =>
    safeInvoke<ProbeCharacterActionsResult>('probe_character_next_actions', { input }),
  distillSandboxInspirations: (input: DistillSandboxInspirationsInput) =>
    safeInvoke<DistillSandboxInspirationsResult>('distill_sandbox_inspirations', { input }),
  synthesizeSandboxProse: (input: SynthesizeSandboxProseInput) =>
    safeInvoke<SynthesizeSandboxProseResult>('synthesize_sandbox_dialogue_to_prose', { input }),
  analyzeCharacterAppearance: (input: AnalyzeCharacterAppearanceInput) =>
    safeInvoke<AnalyzeCharacterAppearanceResult>('analyze_character_appearance', { input }),
  generateImage: (input: GenerateImageInput) =>
    safeInvoke<GenerateImageResult>('generate_image', { input }),
};
