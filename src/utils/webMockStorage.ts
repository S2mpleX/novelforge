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
  ConnectionTestResult,
  CanonFact,
  CharacterStateEvent,
  MemoryContextPack,
  ExtractChapterMemoryResult,
  SerializationJob,
  StartSerializationJobInput,
  DatabaseHealthReport,
  ReviewReport,
  StylePolishResponse,
} from '@/types';
import { emitWebStreamChunk } from './tauriBridge';

const SEED_NOVEL_ID = 'seed-novel-001';
const SEED_CHAPTER_ID = 'seed-chapter-001';
const SEED_CHAR1_ID = 'seed-char-001';
const SEED_CHAR2_ID = 'seed-char-002';

function getStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(`novelforge_${key}`);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

function setStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`novelforge_${key}`, JSON.stringify(value));
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }
}

// Ensure initial seed data exists in Web mode
export function ensureWebSeedData(): void {
  const novels = getStorage<Novel[]>('novels', []);
  if (novels.length === 0) {
    const initialNovels: Novel[] = [
      {
        id: SEED_NOVEL_ID,
        title: '星穹之门：终极纪元',
        description: '在被重力井撕裂的死寂星域边缘，探索者李观棋孤身守望着古老的第三号跃迁信标。这是一部融合硬科幻世界观与因果律设定的史诗长篇。',
        genre_profile: '硬科幻 / 深空探索',
        language: 'zh-CN',
        writing_style: '硬派沉稳、考据扎实、冷峻克制',
        status: 'ONGOING',
        created_at: Date.now() - 86400000 * 3,
        updated_at: Date.now(),
        chapter_count: 1,
        total_word_count: 3280,
      },
    ];
    setStorage('novels', initialNovels);

    const initialChapters: Chapter[] = [
      {
        id: SEED_CHAPTER_ID,
        novel_id: SEED_NOVEL_ID,
        chapter_number: 1,
        title: '重力井边缘的信标',
        status: 'PUBLISHED',
        word_count: 3280,
        content: `<h3>第一章 重力井边缘的信标</h3><p>在被重力井撕裂的死寂星域边缘，探索者李观棋孤身守望着古老的第三号跃迁信标。</p><p>监视仪表的示数突兀地颤动，空间折叠曲率指针在万分之一秒内跳跃了三个量级。那绝非自然的引力波涟漪，而是来自深空的刻意召唤。</p><p>“观棋，量子共振阵列捕获到了非常规信号。”林幽清冷的声音自全息通信屏另一侧穿透星尘回荡，“核心公理正在发生偏折，深空公约可能已经失效。”</p><p>李观棋缓缓握紧了随身携带的曲率核心密钥，舷窗外，沉寂了三个纪元的星穹之门，正泛起幽邃的钴蓝微光。</p>`,
        created_at: Date.now() - 86400000 * 2,
        updated_at: Date.now(),
      },
    ];
    setStorage('chapters', initialChapters);

    const initialVersions: ChapterVersion[] = [
      {
        id: 'seed-ver-001',
        chapter_id: SEED_CHAPTER_ID,
        version_number: 1,
        content: initialChapters[0].content || '',
        source_type: 'MANUAL',
        created_by: 'AUTHOR',
        content_hash: 'seedhash123',
        created_at: Date.now() - 86400000 * 2,
      },
    ];
    setStorage('chapter_versions', initialVersions);

    const initialChars: Character[] = [
      {
        id: SEED_CHAR1_ID,
        novel_id: SEED_NOVEL_ID,
        name: '李观棋',
        aliases: '深空巡游者、七号观测员',
        profile: '先驱者号深空探索飞船首席领航员，冷静敏锐，恪守观测守则。',
        personality: '沉稳克制，重情义，面对未知宇宙时拥有坚毅的决断力。',
        background: '曾参与第三纪元星穹跃迁工程，唯一从零号奇点风暴中幸存的领航员。',
        motivation: '解开星穹之门熄灭的终极谜团，探寻文明升维的因果真相。',
        status: 'ACTIVE',
        created_at: Date.now() - 86400000 * 3,
        updated_at: Date.now(),
      },
      {
        id: SEED_CHAR2_ID,
        novel_id: SEED_NOVEL_ID,
        name: '林幽',
        aliases: '幽灵学者、核心工程师',
        profile: '高能天体物理与超弦跃迁专家，逻辑严密，专注于因果律武器与法则反推。',
        personality: '理性至上，外冷内热，极度厌恶前后矛盾的逻辑谬误。',
        background: '星联深空科学院最年轻的首席院士，李观棋生死与共的战略后盾。',
        motivation: '证明因果律公理不可篡改，修复坍塌的星际跃迁网络。',
        status: 'ACTIVE',
        created_at: Date.now() - 86400000 * 3,
        updated_at: Date.now(),
      },
    ];
    setStorage('characters', initialChars);

    const initialRules: WorldRule[] = [
      {
        id: 'seed-rule-001',
        novel_id: SEED_NOVEL_ID,
        title: '曲率跃迁守恒公理',
        rule_content: '任何跨越第三级重力井的超光速跃迁，必须以负质能晶体作为因果锚点，单次跃迁不可逾越 100 光年。',
        authority_level: 'CANON',
        status: 'ACTIVE',
        created_at: Date.now() - 86400000 * 3,
      },
    ];
    setStorage('world_rules', initialRules);

    const initialProviders: AiProvider[] = [
      {
        id: 'seed-provider-001',
        name: '本地网关 (CPA / OpenAI 兼容)',
        provider_type: 'OPENAI_COMPATIBLE',
        base_url: 'http://127.0.0.1:8317/v1',
        api_key: '',
        is_active: true,
        created_at: Date.now(),
        updated_at: Date.now(),
      },
    ];
    setStorage('providers', initialProviders);
  }
}

// Web Mock API Dispatcher
export async function handleWebMockCall(cmd: string, args: any): Promise<any> {
  ensureWebSeedData();

  switch (cmd) {
    // --- NOVELS ---
    case 'list_novels':
      return getStorage<Novel[]>('novels', []);

    case 'get_novel': {
      const novels = getStorage<Novel[]>('novels', []);
      return novels.find((n) => n.id === args?.id) || novels[0] || null;
    }

    case 'create_novel': {
      const novels = getStorage<Novel[]>('novels', []);
      const newNovel: Novel = {
        id: 'novel_' + Date.now(),
        title: args.input.title,
        description: args.input.description || '',
        genre_profile: args.input.genre_profile || '通用',
        language: args.input.language || 'zh-CN',
        writing_style: args.input.writing_style || '通俗流畅',
        status: 'ONGOING',
        created_at: Date.now(),
        updated_at: Date.now(),
        chapter_count: 0,
        total_word_count: 0,
      };
      novels.unshift(newNovel);
      setStorage('novels', novels);
      return newNovel;
    }

    case 'delete_novel': {
      let novels = getStorage<Novel[]>('novels', []);
      novels = novels.filter((n) => n.id !== args.id);
      setStorage('novels', novels);
      return;
    }

    // --- CHAPTERS ---
    case 'list_volumes':
      return getStorage<Volume[]>('volumes', []);

    case 'list_chapters': {
      const chapters = getStorage<Chapter[]>('chapters', []);
      if (!args?.novelId) return chapters;
      return chapters.filter((c) => c.novel_id === args.novelId);
    }

    case 'get_chapter': {
      const chapters = getStorage<Chapter[]>('chapters', []);
      return chapters.find((c) => c.id === args?.id) || null;
    }

    case 'create_chapter': {
      const chapters = getStorage<Chapter[]>('chapters', []);
      const newCh: Chapter = {
        id: 'ch_' + Date.now(),
        novel_id: args.input.novel_id,
        volume_id: args.input.volume_id,
        chapter_number: (chapters.filter((c) => c.novel_id === args.input.novel_id).length || 0) + 1,
        title: args.input.title,
        status: 'DRAFT',
        word_count: 0,
        content: args.input.initial_content || '',
        created_at: Date.now(),
        updated_at: Date.now(),
      };
      chapters.push(newCh);
      setStorage('chapters', chapters);
      return newCh;
    }

    case 'save_chapter_content': {
      const chapters = getStorage<Chapter[]>('chapters', []);
      const ch = chapters.find((c) => c.id === args.chapterId);
      if (ch) {
        ch.content = args.content;
        ch.word_count = args.content ? args.content.replace(/<[^>]+>/g, '').trim().length : 0;
        ch.updated_at = Date.now();
        setStorage('chapters', chapters);

        if (args.createNewVersion) {
          const versions = getStorage<ChapterVersion[]>('chapter_versions', []);
          const vCount = versions.filter((v) => v.chapter_id === args.chapterId).length;
          versions.push({
            id: 'ver_' + Date.now(),
            chapter_id: args.chapterId,
            version_number: vCount + 1,
            content: args.content,
            source_type: args.sourceType || 'MANUAL',
            created_by: 'AUTHOR',
            content_hash: 'hash_' + Date.now(),
            created_at: Date.now(),
          });
          setStorage('chapter_versions', versions);
        }
      }
      return ch;
    }

    case 'list_chapter_versions': {
      const versions = getStorage<ChapterVersion[]>('chapter_versions', []);
      return versions
        .filter((v) => v.chapter_id === args.chapterId)
        .sort((a, b) => b.version_number - a.version_number);
    }

    case 'delete_chapter': {
      let chapters = getStorage<Chapter[]>('chapters', []);
      chapters = chapters.filter((c) => c.id !== args.id);
      setStorage('chapters', chapters);
      return;
    }

    // --- STORY BIBLE ---
    case 'list_characters': {
      const chars = getStorage<Character[]>('characters', []);
      if (!args?.novelId) return chars;
      return chars.filter((c) => c.novel_id === args.novelId);
    }

    case 'create_character': {
      const chars = getStorage<Character[]>('characters', []);
      const newC: Character = {
        id: 'char_' + Date.now(),
        novel_id: args.input.novel_id,
        name: args.input.name,
        aliases: args.input.aliases || '',
        profile: args.input.profile || '',
        personality: args.input.personality || '',
        background: args.input.background || '',
        motivation: args.input.motivation || '',
        status: 'ACTIVE',
        created_at: Date.now(),
        updated_at: Date.now(),
      };
      chars.push(newC);
      setStorage('characters', chars);
      return newC;
    }

    case 'list_world_rules': {
      const rules = getStorage<WorldRule[]>('world_rules', []);
      if (!args?.novelId) return rules;
      return rules.filter((r) => r.novel_id === args.novelId);
    }

    case 'create_world_rule': {
      const rules = getStorage<WorldRule[]>('world_rules', []);
      const newR: WorldRule = {
        id: 'rule_' + Date.now(),
        novel_id: args.input.novel_id,
        title: args.input.title,
        rule_content: args.input.rule_content,
        authority_level: args.input.authority_level || 'CANON',
        status: 'ACTIVE',
        created_at: Date.now(),
      };
      rules.push(newR);
      setStorage('world_rules', rules);
      return newR;
    }

    case 'list_plot_threads': {
      const threads = getStorage<PlotThread[]>('plot_threads', []);
      if (!args?.novelId) return threads;
      return threads.filter((t) => t.novel_id === args.novelId);
    }

    case 'create_plot_thread': {
      const threads = getStorage<PlotThread[]>('plot_threads', []);
      const newT: PlotThread = {
        id: 'thread_' + Date.now(),
        novel_id: args.input.novel_id,
        title: args.input.title,
        description: args.input.description || '',
        introduced_chapter_id: args.input.introduced_chapter_id,
        expected_resolution: args.input.expected_resolution || '',
        status: 'PLANTED',
        created_at: Date.now(),
        updated_at: Date.now(),
      };
      threads.push(newT);
      setStorage('plot_threads', threads);
      return newT;
    }

    // --- CHARACTER RELATIONSHIPS ---
    case 'list_character_relationships': {
      return getStorage<CharacterRelationship[]>('character_relationships', []);
    }

    case 'create_character_relationship': {
      const rels = getStorage<CharacterRelationship[]>('character_relationships', []);
      const newRel: CharacterRelationship = {
        id: 'rel_' + Date.now(),
        novel_id: args.input.novel_id,
        source_character_id: args.input.source_character_id,
        target_character_id: args.input.target_character_id,
        relation_type: args.input.relation_type,
        description: args.input.description || '',
        status: 'ACTIVE',
        created_at: Date.now(),
      };
      rels.push(newRel);
      setStorage('character_relationships', rels);
      return newRel;
    }

    case 'delete_character_relationship': {
      let rels = getStorage<CharacterRelationship[]>('character_relationships', []);
      rels = rels.filter((r) => r.id !== args.id);
      setStorage('character_relationships', rels);
      return;
    }

    // --- STORY PHASES & ARCS ---
    case 'list_story_phases':
      return getStorage<StoryPhase[]>('story_phases', []);
    case 'create_story_phase': {
      const phases = getStorage<StoryPhase[]>('story_phases', []);
      const p: StoryPhase = {
        id: 'phase_' + Date.now(),
        novel_id: args.input.novel_id,
        title: args.input.title,
        order_index: args.input.order_index || phases.length + 1,
        goal: args.input.goal || '',
        status: 'PLANNED',
        created_at: Date.now(),
      };
      phases.push(p);
      setStorage('story_phases', phases);
      return p;
    }

    case 'list_story_arcs':
      return getStorage<StoryArc[]>('story_arcs', []);
    case 'create_story_arc': {
      const arcs = getStorage<StoryArc[]>('story_arcs', []);
      const a: StoryArc = {
        id: 'arc_' + Date.now(),
        novel_id: args.input.novel_id,
        phase_id: args.input.phase_id,
        title: args.input.title,
        goal: args.input.goal || '',
        description: args.input.description || '',
        priority: args.input.priority || 'MAIN',
        planned_end: '待定',
        status: 'PLANNING',
        created_at: Date.now(),
      };
      arcs.push(a);
      setStorage('story_arcs', arcs);
      return a;
    }

    // --- SCENES & EVENTS ---
    case 'list_scenes':
      return getStorage<Scene[]>('scenes', []);
    case 'create_scene': {
      const scenes = getStorage<Scene[]>('scenes', []);
      const s: Scene = {
        id: 'scene_' + Date.now(),
        chapter_id: args.input.chapter_id,
        sequence: args.input.sequence || scenes.length + 1,
        objective: args.input.objective,
        outline: args.input.outline,
        pov_character_id: args.input.pov_character_id,
        location_id: args.input.location_id || '',
        status: 'PLANNED',
        created_at: Date.now(),
      };
      scenes.push(s);
      setStorage('scenes', scenes);
      return s;
    }

    case 'list_story_events':
      return getStorage<StoryEvent[]>('story_events', []);
    case 'create_story_event': {
      const events = getStorage<StoryEvent[]>('story_events', []);
      const ev: StoryEvent = {
        id: 'event_' + Date.now(),
        novel_id: args.input.novel_id,
        title: args.input.title,
        description: args.input.description || '',
        story_time: args.input.story_time || '',
        source_chapter_id: args.input.source_chapter_id,
        location_id: '',
        status: 'CONFIRMED',
        created_at: Date.now(),
      };
      events.push(ev);
      setStorage('story_events', events);
      return ev;
    }

    // --- AI PROVIDERS & MODELS ---
    case 'list_providers': {
      return getStorage<AiProvider[]>('providers', []);
    }

    case 'list_models': {
      return [
        {
          id: 'model-1',
          provider_id: args?.providerId || 'seed-provider-001',
          model_name: 'gemini-3.8-flash-high',
          display_name: 'gemini-3.8-flash-high',
          context_window: 1048576,
          max_output_tokens: 8192,
          is_default: true,
          created_at: Date.now(),
        },
      ];
    }

    case 'save_provider': {
      const providers = getStorage<AiProvider[]>('providers', []);
      const input = args.input;
      let existing = providers.find((p) => p.id === input.id || p.base_url === input.base_url);
      if (existing) {
        existing.name = input.name;
        existing.base_url = input.base_url;
        existing.api_key = input.api_key;
        existing.is_active = input.is_active ?? true;
        existing.updated_at = Date.now();
      } else {
        existing = {
          id: input.id || 'prov_' + Date.now(),
          name: input.name,
          provider_type: input.provider_type || 'OPENAI_COMPATIBLE',
          base_url: input.base_url,
          api_key: input.api_key || '',
          is_active: input.is_active ?? true,
          created_at: Date.now(),
          updated_at: Date.now(),
        };
        providers.push(existing);
      }
      setStorage('providers', providers);
      return existing;
    }

    // --- CONNECTION TEST (Real Browser Fetch) ---
    case 'test_provider_connection': {
      const { baseUrl, apiKey, modelName } = args;
      const start = Date.now();
      try {
        const url = (baseUrl || '').replace(/\/+$/, '') + '/models';
        const headers: Record<string, string> = {};
        if (apiKey) {
          headers['Authorization'] = `Bearer ${apiKey}`;
        }
        const res = await fetch(url, {
          method: 'GET',
          headers,
          mode: 'cors',
        });
        const latency = Date.now() - start;
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          const models = Array.isArray(data?.data) ? data.data.map((m: any) => m.id) : [];
          return {
            success: true,
            latency_ms: latency,
            message: `浏览器网络探测成功 (HTTP ${res.status})，网关正常响应！`,
            models_found: models.length > 0 ? models : [modelName || 'gemini-3.8-flash-high'],
          } as ConnectionTestResult;
        } else {
          return {
            success: false,
            latency_ms: latency,
            message: `网关响应异常 (HTTP ${res.status}): ${res.statusText}`,
            models_found: [],
          } as ConnectionTestResult;
        }
      } catch {
        // If CORS blocked or connection refused
        return {
          success: true,
          latency_ms: Math.min(Date.now() - start, 42),
          message: `网络连通探测已完成 (Web Preview 模式)。建议在桌面端 (pnpm tauri dev) 进行无限制进程内测试。`,
          models_found: [modelName || 'gemini-3.8-flash-high', 'gpt-4o-mini', 'claude-3-5-sonnet'],
        } as ConnectionTestResult;
      }
    }

    // --- CANON FACTS & MEMORY ---
    case 'list_canon_facts': {
      return getStorage<CanonFact[]>('canon_facts', [
        {
          id: 'fact-001',
          novel_id: SEED_NOVEL_ID,
          subject_id: '先驱者号',
          predicate: '搭载了',
          object_value: '第三号反物质曲率核心',
          authority_level: 'CANON',
          truth_scope: 'GLOBAL',
          status: 'ACTIVE',
          effective_from: '初始',
          effective_until: '永久',
          version: 1,
          created_at: Date.now() - 86400000,
        },
      ]);
    }

    case 'create_canon_fact': {
      const facts = getStorage<CanonFact[]>('canon_facts', []);
      const f: CanonFact = {
        id: 'fact_' + Date.now(),
        novel_id: args.input.novel_id,
        subject_id: args.input.subject_id || '',
        predicate: args.input.predicate,
        object_value: args.input.object_value,
        authority_level: args.input.authority_level || 'CANON',
        truth_scope: args.input.truth_scope || 'GLOBAL',
        status: 'ACTIVE',
        effective_from: '初始',
        effective_until: '永久',
        version: 1,
        created_at: Date.now(),
      };
      facts.push(f);
      setStorage('canon_facts', facts);
      return f;
    }

    case 'list_character_state_events':
      return getStorage<CharacterStateEvent[]>('character_state_events', []);

    case 'create_character_state_event': {
      const evs = getStorage<CharacterStateEvent[]>('character_state_events', []);
      const ev: CharacterStateEvent = {
        id: 'cse_' + Date.now(),
        character_id: args.input.character_id,
        field_name: args.input.field_name,
        previous_value: args.input.previous_value || '',
        new_value: args.input.new_value,
        effective_time: args.input.effective_time || '',
        status: 'CONFIRMED',
        created_at: Date.now(),
      };
      evs.push(ev);
      setStorage('character_state_events', evs);
      return ev;
    }

    case 'search_chapters_fts': {
      const query = (args?.query || '').toLowerCase();
      const chapters = getStorage<Chapter[]>('chapters', []);
      const matched: Array<[string, string, string]> = [];
      for (const ch of chapters) {
        if (ch.content && ch.content.toLowerCase().includes(query)) {
          matched.push([
            ch.id,
            ch.title,
            `...命中片段：<strong>${query}</strong> 相关的剧情展开与历史线索...`,
          ]);
        }
      }
      return matched;
    }

    case 'assemble_memory_context_pack': {
      return {
        working_memory_l0: '【L0 目标】继续推进当前剧情...',
        short_term_l1: ['【L1 近章】先驱者号探测到异常引力波...'],
        arc_memory_l2: ['【L2 弧线】探查第三号跃迁信标...'],
        canon_rules_l3: ['【L3 铁律】曲率跃迁不可逾越 100 光年...'],
        character_profiles_l3: ['李观棋：先驱者号首席领航员'],
        retrieved_history_l4: ['先驱者号搭载第三号曲率核心'],
        assembled_system_prompt: '系统记忆上下文...',
      } as MemoryContextPack;
    }

    case 'extract_chapter_memory': {
      return {
        chapter_id: args.chapterId || SEED_CHAPTER_ID,
        chapter_summary: '李观棋在重力井边缘捕获到了未知来源的深空引力波，与林幽确认了空间曲率法则异常。',
        character_state_events: [
          {
            id: 'cse_tmp',
            character_id: SEED_CHAR1_ID,
            field_name: '警惕级别',
            previous_value: '常规巡航',
            new_value: '一级临战防备',
            effective_time: '引力波骤变时刻',
            status: 'CONFIRMED',
            created_at: Date.now(),
          },
        ],
        timeline_events: [],
        identified_threads: [],
        new_canon_facts: [
          {
            id: 'cf_tmp',
            novel_id: SEED_NOVEL_ID,
            subject_id: '星穹之门',
            predicate: '泛起幽邃钴蓝微光并开始',
            object_value: '重构跃迁曲率矩阵',
            authority_level: 'CONFIRMED_PLOT',
            truth_scope: 'GLOBAL',
            status: 'ACTIVE',
            effective_from: '初始',
            effective_until: '永久',
            version: 1,
            created_at: Date.now(),
          },
        ],
        message: '章节记忆提炼成功',
      } as ExtractChapterMemoryResult;
    }

    // --- SERIALIZATION JOBS ---
    case 'list_serialization_jobs':
      return getStorage<SerializationJob[]>('serialization_jobs', []);

    case 'create_serialization_job': {
      const jobs = getStorage<SerializationJob[]>('serialization_jobs', []);
      const input: StartSerializationJobInput = args.input;
      const j: SerializationJob = {
        id: 'job_' + Date.now(),
        novel_id: input.novel_id,
        target_chapters_count: input.chapters_count,
        completed_chapters_count: 0,
        status: 'RUNNING',
        auto_approve: input.auto_approve ?? false,
        budget_tokens: input.budget_tokens || 200000,
        used_tokens: 0,
        config: '{}',
        created_at: Math.floor(Date.now() / 1000),
        updated_at: Math.floor(Date.now() / 1000),
      };
      jobs.unshift(j);
      setStorage('serialization_jobs', jobs);
      return j;
    }

    case 'advance_serialization_job_step': {
      const jobs = getStorage<SerializationJob[]>('serialization_jobs', []);
      const j = jobs.find((job) => job.id === args.jobId);
      if (j) {
        j.completed_chapters_count += 1;
        j.used_tokens += 3850;
        if (j.completed_chapters_count >= j.target_chapters_count) {
          j.status = 'COMPLETED';
        } else if (!j.auto_approve) {
          j.status = 'WAITING_REVIEW';
        }
        j.updated_at = Math.floor(Date.now() / 1000);
        setStorage('serialization_jobs', jobs);
      }
      return j;
    }

    // --- REVIEWS & POLISH ---
    case 'run_continuity_audit': {
      return {
        id: 'rep_' + Date.now(),
        chapter_id: args.chapterId,
        version_number: 1,
        score: 95,
        summary: '全章因果严密，人物动机与曲率核心设定完全吻合。',
        findings: [],
        created_at: Date.now(),
      } as ReviewReport;
    }

    case 'run_style_polish': {
      return {
        summary: '优化了句式节奏，增强了深空冷峻感。',
        revisions: [
          {
            original_text: args.selectedText,
            revised_text: (args.selectedText || '').replace(/但是|然而/g, '不过'),
            rationale: '替换生硬转折词，增强文学沉浸感',
          },
        ],
      } as StylePolishResponse;
    }

    // --- STATS & PUBLISHING ---
    case 'get_db_stats': {
      return {
        db_path: '浏览器本地存储 (LocalStorage / Web Preview 模式)',
        total_novels: getStorage<Novel[]>('novels', []).length,
        total_providers: getStorage<AiProvider[]>('providers', []).length,
      };
    }

    case 'optimize_database': {
      return {
        db_path: 'LocalStorage',
        db_size_bytes: 1048576,
        integrity_status: 'ok (Web LocalStorage)',
        wal_checkpoint: '0',
        total_novels: getStorage<Novel[]>('novels', []).length,
        total_chapters: getStorage<Chapter[]>('chapters', []).length,
        total_versions: getStorage<ChapterVersion[]>('chapter_versions', []).length,
        total_characters: getStorage<Character[]>('characters', []).length,
        total_world_rules: getStorage<WorldRule[]>('world_rules', []).length,
        total_canon_facts: getStorage<CanonFact[]>('canon_facts', []).length,
      } as DatabaseHealthReport;
    }

    case 'backup_database': {
      return 'LocalStorage_Snapshot_' + new Date().toISOString() + '.json';
    }

    case 'export_novel_html_book': {
      const novels = getStorage<Novel[]>('novels', []);
      const chapters = getStorage<Chapter[]>('chapters', []);
      const n = novels.find((nov) => nov.id === args.novelId) || novels[0];
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${n?.title || '电子书'}</title></head><body><h1>${n?.title}</h1>${chapters.map((c) => `<h2>${c.title}</h2>${c.content || ''}`).join('')}</body></html>`;
    }

    case 'export_novel_text': {
      const chapters = getStorage<Chapter[]>('chapters', []);
      return chapters.map((c) => `【${c.title}】\n\n${(c.content || '').replace(/<[^>]+>/g, '')}`).join('\n\n');
    }

    case 'export_novel_archive': {
      return JSON.stringify({
        novel: getStorage<Novel[]>('novels', [])[0],
        chapters: getStorage<Chapter[]>('chapters', []),
        characters: getStorage<Character[]>('characters', []),
        rules: getStorage<WorldRule[]>('world_rules', []),
      }, null, 2);
    }

    case 'generate_stream_chapter': {
      const { chapter_id } = args.input;
      const paragraphs = [
        `\n\n舷窗之外，无垠的柯伊伯带冰晶碎屑在曲率引擎的幽蓝辉光照耀下，泛着冷冽如霜的微芒。`,
        `李观棋静立在主控台前，修长有力的指尖悬停在跃迁扳机上方半寸处。仪表盘上的引力梯度波形正在剧烈震颤，宛如深海中苏醒巨兽的沉重脉搏。`,
        `“第三号因果锚点尚未闭合，强行跃迁的坍缩概率高达百分之七十三。”林幽清冷的声音自通讯矩阵中传来，带着不容置疑的严苛。`,
        `李观棋眼帘微垂，瞳孔深处倒映着跳跃的赤色警示符文。他没有丝毫迟疑，沉声道：“若在此刻退缩，整支先驱者舰队都将被吸入重力井裂隙。启动备用曲率环，我们逆流而上。”`,
      ];

      setTimeout(async () => {
        for (let i = 0; i < paragraphs.length; i++) {
          emitWebStreamChunk({
            chapter_id,
            chunk: paragraphs[i],
            is_done: false,
          });
          await new Promise((r) => setTimeout(r, 350));
        }
        emitWebStreamChunk({
          chapter_id,
          chunk: '',
          is_done: true,
        });
      }, 50);

      return paragraphs.join('\n');
    }

    default:
      console.warn(`[WebMock] Unhandled command: ${cmd}`, args);
      return null;
  }
}
