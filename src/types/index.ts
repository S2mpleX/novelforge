export interface Novel {
  id: string;
  title: string;
  description: string;
  genre_profile: string;
  language: string;
  writing_style: string;
  status: string;
  created_at: number;
  updated_at: number;
  chapter_count?: number;
  total_word_count?: number;
}

export interface Volume {
  id: string;
  novel_id: string;
  title: string;
  order_index: number;
  summary: string;
  status: string;
  created_at: number;
}

export interface Chapter {
  id: string;
  novel_id: string;
  volume_id?: string;
  chapter_number: number;
  title: string;
  status: string;
  active_version_id?: string;
  word_count: number;
  content?: string;
  created_at: number;
  updated_at: number;
}

export interface ChapterVersion {
  id: string;
  chapter_id: string;
  version_number: number;
  content: string;
  source_type: string;
  created_by: string;
  content_hash: string;
  created_at: number;
}

export interface Character {
  id: string;
  novel_id: string;
  name: string;
  aliases: string;
  profile: string;
  personality: string;
  background: string;
  motivation: string;
  status: string;
  created_at: number;
  updated_at: number;
}

export interface WorldRule {
  id: string;
  novel_id: string;
  title: string;
  rule_content: string;
  authority_level: 'CANON' | 'EXTENDED' | 'HYPOTHESIS' | 'DEPRECATED';
  status: string;
  created_at: number;
}

export interface PlotThread {
  id: string;
  novel_id: string;
  title: string;
  description: string;
  introduced_chapter_id?: string;
  expected_resolution: string;
  resolved_chapter_id?: string;
  status: 'PLANTED' | 'DEVELOPING' | 'READY_TO_RESOLVE' | 'RESOLVED' | 'ABANDONED';
  created_at: number;
  updated_at: number;
}

export interface AiProvider {
  id: string;
  name: string;
  provider_type: string;
  base_url: string;
  api_key: string;
  is_active: boolean;
  created_at: number;
  updated_at: number;
}

export interface AiModel {
  id: string;
  provider_id: string;
  model_name: string;
  display_name: string;
  context_window: number;
  max_output_tokens: number;
  is_default: boolean;
  created_at: number;
}

export interface ConnectionTestResult {
  success: boolean;
  latency_ms: number;
  message: string;
  models_found: string[];
}

export interface StreamChunkPayload {
  chapter_id: string;
  chunk: string;
  is_done: boolean;
  error?: string;
}

// --- Phase 2: Relationships, Story Arcs, Scenes, Events ---

export interface CharacterRelationship {
  id: string;
  novel_id: string;
  source_character_id: string;
  target_character_id: string;
  relation_type: string;
  description: string;
  status: string;
  created_at: number;
}

export interface StoryPhase {
  id: string;
  novel_id: string;
  title: string;
  order_index: number;
  goal: string;
  status: string;
  created_at: number;
}

export interface StoryArc {
  id: string;
  novel_id: string;
  phase_id?: string;
  title: string;
  goal: string;
  description: string;
  status: 'PLANNING' | 'DEVELOPING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  start_chapter_id?: string;
  planned_end: string;
  priority: 'MAIN' | 'SUB' | 'CHARACTER' | 'WORLD';
  created_at: number;
}

export interface Scene {
  id: string;
  chapter_id: string;
  sequence: number;
  objective: string;
  outline: string;
  pov_character_id?: string;
  location_id: string;
  status: string;
  created_at: number;
}

export interface StoryEvent {
  id: string;
  novel_id: string;
  title: string;
  description: string;
  story_time: string;
  source_chapter_id?: string;
  cause_event_id?: string;
  location_id: string;
  status: string;
  created_at: number;
}

// --- Phase 3: Review Reports & Orchestrator Results ---

export interface ReviewFinding {
  id: string;
  report_id: string;
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR' | 'SUGGESTION';
  category: 'CONTINUITY' | 'CHARACTER' | 'WORLD_RULE' | 'TIMELINE' | 'STYLE';
  title: string;
  description: string;
  evidence_quote: string;
  suggestion: string;
  status: 'OPEN' | 'RESOLVED' | 'DISMISSED';
  created_at: number;
}

export interface ReviewReport {
  id: string;
  chapter_id: string;
  version_number: number;
  score: number;
  summary: string;
  created_at: number;
  findings: ReviewFinding[];
}

export interface StyleRevisionItem {
  original_text: string;
  revised_text: string;
  rationale: string;
}

export interface StylePolishResponse {
  summary: string;
  revisions: StyleRevisionItem[];
}

export interface CollaborativeWorkflowResult {
  chapter_id: string;
  planned_scenes: Scene[];
  generated_draft: string;
  review_report?: ReviewReport;
  message: string;
}

// --- Phase 4: Layered Memory Engine (L0~L4) ---

export interface CanonFact {
  id: string;
  novel_id: string;
  subject_id: string;
  predicate: string;
  object_value: string;
  truth_scope: 'GLOBAL' | 'LOCAL' | 'CONTINGENT';
  authority_level: 'CONFIRMED_PLOT' | 'CANON' | 'HYPOTHESIS';
  status: string;
  effective_from: string;
  effective_until: string;
  source_chapter_id?: string;
  version: number;
  created_at: number;
}

export interface CharacterStateEvent {
  id: string;
  character_id: string;
  source_chapter_id?: string;
  effective_time: string;
  field_name: string;
  previous_value: string;
  new_value: string;
  status: string;
  created_at: number;
}

export interface MemoryContextPack {
  working_memory_l0: string;
  short_term_l1: string[];
  arc_memory_l2: string[];
  canon_rules_l3: string[];
  character_profiles_l3: string[];
  retrieved_history_l4: string[];
  assembled_system_prompt: string;
}

export interface ExtractChapterMemoryResult {
  chapter_id: string;
  chapter_summary: string;
  character_state_events: CharacterStateEvent[];
  timeline_events: StoryEvent[];
  identified_threads: PlotThread[];
  new_canon_facts: CanonFact[];
  message: string;
}

// --- Phase 5: Serialization Engine ---

export interface SerializationJob {
  id: string;
  novel_id: string;
  status: 'PENDING' | 'RUNNING' | 'PAUSED' | 'WAITING_REVIEW' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
  target_chapters_count: number;
  completed_chapters_count: number;
  current_chapter_id?: string;
  auto_approve: boolean;
  budget_tokens: number;
  used_tokens: number;
  config: string;
  error_message?: string;
  created_at: number;
  updated_at: number;
}

export interface StartSerializationJobInput {
  novel_id: string;
  chapters_count: number;
  chapter_target_words?: number;
  auto_approve?: boolean;
  budget_tokens?: number;
}


