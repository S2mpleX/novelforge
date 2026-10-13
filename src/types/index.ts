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
