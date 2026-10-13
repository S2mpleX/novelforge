import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type {
  Novel,
  Volume,
  Chapter,
  ChapterVersion,
  Character,
  WorldRule,
  PlotThread,
  AiProvider,
  AiModel,
  ConnectionTestResult,
  StreamChunkPayload,
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
};
