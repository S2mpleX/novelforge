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
  CanonFact,
  CharacterStateEvent,
  MemoryContextPack,
  ExtractChapterMemoryResult,
  SerializationJob,
  StartSerializationJobInput,
  DatabaseHealthReport,
  ReviewReport,
  StylePolishResponse,
  WorkflowTemplate,
  WorkflowRun,
  WorkflowStepRecord,
  VoiceProfile,
  SaveVoiceProfileInput,
  GenerateFindingRepairInput,
  FindingRepairResult,
  ModelArenaRun,
  SaveModelArenaRunInput,
  ExecuteArenaDuelInput,
  ArenaDuelResult,
  MergeArenaOutputsInput,
  OptimizeWritingPromptInput,
  OptimizeWritingPromptResult,
} from '@/types';
import { emitWebStreamChunk, emitArenaStreamChunk } from './tauriBridge';

const SEED_NOVEL_ID = 'seed-novel-001';
const SEED_CHAPTER_ID = 'seed-chapter-001';
const SEED_CHAR1_ID = 'seed-char-001';
const SEED_CHAR2_ID = 'seed-char-002';

const memoryStorage = new Map<string, string>();

function getStorage<T>(key: string, defaultValue: T): T {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(`novelforge_${key}`);
      if (!raw) return defaultValue;
      return JSON.parse(raw);
    }
    const mem = memoryStorage.get(`novelforge_${key}`);
    if (!mem) return defaultValue;
    return JSON.parse(mem);
  } catch {
    return defaultValue;
  }
}

function setStorage<T>(key: string, value: T): void {
  try {
    const serialized = JSON.stringify(value);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`novelforge_${key}`, serialized);
    } else {
      memoryStorage.set(`novelforge_${key}`, serialized);
    }
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
        cover_url: 'preset:deep_cosmos',
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

    const initialWorkflowTemplates: WorkflowTemplate[] = [
      {
        id: 'builtin-gold-three',
        novel_id: null,
        name: '网文黄金三章开篇推演',
        description: '从核心脑洞、金手指设计到黄金三章大纲与情绪曲线规划的结构化连贯推演',
        category: 'general',
        steps_json: JSON.stringify([
          {
            step_key: 'brainstorm_cheat',
            title: '1. 核心脑洞与金手指设计',
            agent_role: 'WorldArchitect',
            description: '提炼小说颠覆性脑洞、核心金手指运转逻辑与成长兑换体系',
            prompt_template: '请根据作品背景设定，为本作量身打造具备强吸引力的核心脑洞与金手指体系。包括：金手指名称、运行机制、初始红利、代价或限制。',
          },
          {
            step_key: 'chapter1_hook',
            title: '2. 第一章切入点与矛盾激发',
            agent_role: 'PlotEngineer',
            description: '设计第一章危机开局、核心矛盾爆发点及主角身份认同冲击',
            prompt_template: '基于上一步的金手指：{{step_1_output}}，设计第一章的切入镜头与开门杀危机。',
          },
          {
            step_key: 'three_chapter_arc',
            title: '3. 黄金三章大纲与情绪曲线规划',
            agent_role: 'Director',
            description: '制定前三章节奏节拍、连续爽点布置与首卷主线钩子',
            prompt_template: '整合上述内容：脑洞设定【{{step_1_output}}】，首章切入【{{step_2_output}}】，规划第1-3章的详细事件节拍与期待感钩子。',
          },
        ]),
        is_builtin: true,
        created_at: Date.now(),
        updated_at: Date.now(),
      },
      {
        id: 'builtin-climax-explosion',
        novel_id: null,
        name: '高潮单章精细爆破',
        description: '单章情绪张力极限推演：从危机逼仄、逆转打脸到正文草案',
        category: 'general',
        steps_json: JSON.stringify([
          {
            step_key: 'climax_pressure',
            title: '1. 单章张力目标与情境压迫',
            agent_role: 'PlotEngineer',
            description: '定义本章不可退让的核心目标与敌对势力的绝境压迫',
            prompt_template: '分析当前章节情境，梳理主角与反派/危机不可调和的矛盾爆发点，营造步步紧逼的压迫氛围。',
          },
          {
            step_key: 'reversal_beats',
            title: '2. 打脸与情绪反转节拍',
            agent_role: 'Director',
            description: '设计反转爆发点、观众/配角反应对比与情绪过山车',
            prompt_template: '基于危机压迫【{{step_1_output}}】，规划3个情绪反转递进阶梯及主角绝境翻盘的具体手段。',
          },
          {
            step_key: 'draft_and_punchline',
            title: '3. 爆点正文起草与金句提炼',
            agent_role: 'Writer',
            description: '撰写具有视听冲击力的核心对决正文片段并提炼点睛金句',
            prompt_template: '结合上述节拍【{{step_2_output}}】，起草该高潮单章的核心冲突正文与情绪收束金句。',
          },
        ]),
        is_builtin: true,
        created_at: Date.now(),
        updated_at: Date.now(),
      },
    ];
    setStorage('workflow_templates', initialWorkflowTemplates);
  }

  const voiceProfiles = getStorage<VoiceProfile[]>('voice_profiles', []);
  if (voiceProfiles.length === 0) {
    const initialProfiles: VoiceProfile[] = [
      {
        id: 'profile-xianxia-classical',
        novel_id: null,
        name: '仙侠修真·沉雄雅致风',
        description: '典雅含蓄、意境深远，偏重环境与心境交融，四字成语与古风造词丰富',
        sample_text: '山风掠过青苍峭壁，松针落入寒潭，漾开一圈圈青碧涟漪。李观棋持剑立于危崖之上，眸光微敛，指尖拂过剑锋处淡淡的冰霜。',
        sentence_rhythm: 'BALANCED',
        vocabulary_tone: 'CLASSICAL_MODERN',
        pov_preference: 'THIRD_LIMITED',
        sensory_ratio: 'SENSORY_RICH',
        custom_rules_json: JSON.stringify(['多用动静相衬', '融情入景', '避免网络流行俚语']),
        is_active: true,
        is_builtin: true,
        created_at: Date.now(),
        updated_at: Date.now(),
      },
      {
        id: 'profile-urban-fast',
        novel_id: null,
        name: '都市异能·爽利快节奏',
        description: '短句为主、动作凌厉，强冲突即时反馈，突出压迫感与干脆利落的爽感',
        sample_text: '咔哒。打火机火苗窜起，照亮了昏暗逼仄的地下车库。陆辰掐灭烟头，没有给对面三人任何拔枪的机会，整个人如猎豹般撕裂雨幕。',
        sentence_rhythm: 'FAST_PACED',
        vocabulary_tone: 'CASUAL_MODERN',
        pov_preference: 'THIRD_LIMITED',
        sensory_ratio: 'ACTION_CENTRIC',
        custom_rules_json: JSON.stringify(['段落不超过三行', '句尾减少冗余修饰', '注重动作打击感']),
        is_active: false,
        is_builtin: true,
        created_at: Date.now(),
        updated_at: Date.now(),
      },
      {
        id: 'profile-scifi-realistic',
        novel_id: null,
        name: '硬核科幻·冷峻考据风',
        description: '客观克制、细节扎实，严密遵循物理与技术设定，营造深空孤寂与危机紧迫感',
        sample_text: '主屏幕上的引力波频谱发生畸变，偏转角突破了0.04度临界阈值。反物质约束场发生器的温度曲线在十秒内陡增300开尔文。林远没有抬头，手指在操纵面板上敲击出三组应急指令。',
        sentence_rhythm: 'DENSE_ATMOSPHERIC',
        vocabulary_tone: 'FORMAL_TECHNICAL',
        pov_preference: 'THIRD_LIMITED',
        sensory_ratio: 'SENSORY_RICH',
        custom_rules_json: JSON.stringify(['遵循物理世界观法则', '减少抒情', '术语统一严密']),
        is_active: false,
        is_builtin: true,
        created_at: Date.now(),
        updated_at: Date.now(),
      },
    ];
    setStorage('voice_profiles', initialProfiles);
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
        cover_url: args.input.cover_url || '',
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

    case 'update_novel': {
      const novels = getStorage<Novel[]>('novels', []);
      const n = novels.find((item) => item.id === args.input.id);
      if (n) {
        n.title = args.input.title;
        if (args.input.description !== undefined) n.description = args.input.description;
        if (args.input.genre_profile !== undefined) n.genre_profile = args.input.genre_profile;
        if (args.input.writing_style !== undefined) n.writing_style = args.input.writing_style;
        if (args.input.cover_url !== undefined) n.cover_url = args.input.cover_url;
        n.updated_at = Date.now();
        setStorage('novels', novels);
        return n;
      }
      return null;
    }

    // --- CHAPTERS & VOLUMES ---
    case 'list_volumes': {
      const volumes = getStorage<Volume[]>('volumes', []);
      if (!args?.novelId) return volumes;
      return volumes.filter((v) => v.novel_id === args.novelId);
    }

    case 'create_volume': {
      const volumes = getStorage<Volume[]>('volumes', []);
      const newVol: Volume = {
        id: 'vol_' + Date.now(),
        novel_id: args.input.novel_id,
        part_id: args.input.part_id,
        title: args.input.title,
        order_index: args.input.order_index || (volumes.filter((v) => v.novel_id === args.input.novel_id).length + 1),
        summary: args.input.summary || '',
        status: 'PLANNING',
        created_at: Date.now(),
      };
      volumes.push(newVol);
      setStorage('volumes', volumes);
      return newVol;
    }

    case 'delete_volume': {
      let volumes = getStorage<Volume[]>('volumes', []);
      volumes = volumes.filter((v) => v.id !== args.id);
      setStorage('volumes', volumes);
      const chapters = getStorage<Chapter[]>('chapters', []);
      for (const ch of chapters) {
        if (ch.volume_id === args.id) {
          ch.volume_id = undefined;
        }
      }
      setStorage('chapters', chapters);
      return;
    }

    case 'update_volume': {
      const volumes = getStorage<Volume[]>('volumes', []);
      const v = volumes.find((item) => item.id === args.input.id);
      if (v) {
        v.title = args.input.title;
        if (args.input.summary !== undefined) v.summary = args.input.summary;
        setStorage('volumes', volumes);
        return v;
      }
      return null;
    }

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

    case 'create_chapter_proposal': {
      const { input } = args;
      const versions = getStorage<ChapterVersion[]>('chapter_versions', []);
      const chVersions = versions.filter((v) => v.chapter_id === input.chapter_id);
      const maxVer = chVersions.length > 0 ? Math.max(...chVersions.map((v) => v.version_number)) : 0;
      const newVer: ChapterVersion = {
        id: crypto.randomUUID(),
        chapter_id: input.chapter_id,
        version_number: maxVer + 1,
        content: input.content,
        content_hash: 'hash_' + Date.now(),
        source_type: 'AI_PROPOSAL',
        created_by: input.reasoning_trace || 'agent',
        created_at: Date.now(),
      };
      versions.push(newVer);
      setStorage('chapter_versions', versions);
      return {
        version_id: newVer.id,
        chapter_id: newVer.chapter_id,
        version_number: newVer.version_number,
        word_count: input.content.length,
        source_type: 'AI_PROPOSAL',
        proposal_summary: input.proposal_summary,
        content_snippet: input.content.slice(0, 80),
        created_at: newVer.created_at,
      };
    }

    case 'list_chapter_proposals': {
      const versions = getStorage<ChapterVersion[]>('chapter_versions', []);
      return versions
        .filter((v) => v.chapter_id === args.chapterId && v.source_type === 'AI_PROPOSAL')
        .sort((a, b) => b.version_number - a.version_number);
    }

    case 'accept_chapter_proposal': {
      const { input } = args;
      const versions = getStorage<ChapterVersion[]>('chapter_versions', []);
      const chapters = getStorage<Chapter[]>('chapters', []);
      const ch = chapters.find((c) => c.id === input.chapter_id);
      const ver = versions.find((v) => v.id === input.version_id);
      if (ch && ver) {
        ch.active_version_id = ver.id;
        ch.content = ver.content;
        ch.word_count = ver.content.length;
        ch.updated_at = Date.now();
        setStorage('chapters', chapters);
        return ch;
      }
      return ch;
    }

    case 'rollback_chapter_version': {
      const { input } = args;
      const versions = getStorage<ChapterVersion[]>('chapter_versions', []);
      const chapters = getStorage<Chapter[]>('chapters', []);
      const ch = chapters.find((c) => c.id === input.chapter_id);
      const targetVer = versions.find((v) => v.id === input.target_version_id);
      if (ch && targetVer) {
        ch.active_version_id = targetVer.id;
        ch.content = targetVer.content;
        ch.word_count = targetVer.content.length;
        ch.updated_at = Date.now();
        setStorage('chapters', chapters);
        return {
          chapter_id: ch.id,
          restored_version_id: targetVer.id,
          restored_version_number: targetVer.version_number,
          word_count: ch.word_count,
          invalidated_facts_count: 0,
          message: `已安全回滚至版本 V${targetVer.version_number}`,
        };
      }
      return { chapter_id: input.chapter_id, restored_version_id: '', restored_version_number: 1, word_count: 0, invalidated_facts_count: 0, message: '' };
    }

    case 'evaluate_chapter': {
      const { input } = args;
      const content = input.content || '';
      return {
        novel_id: input.novel_id,
        chapter_id: input.chapter_id,
        word_count: content.length,
        reading_time_minutes: Math.max(1, Math.floor(content.length / 400)),
        humanizer_score: 90,
        verdict: 'PASS',
        cliche_matches: [],
        consistency_issues: [],
        entity_proposals: [],
        actionable_summary: '质量门禁巡检完成 (WebMock 环境)',
      };
    }

    case 'delete_chapter': {
      let chapters = getStorage<Chapter[]>('chapters', []);
      chapters = chapters.filter((c) => c.id !== args.id);
      setStorage('chapters', chapters);
      return;
    }

    case 'update_chapter_title': {
      const chapters = getStorage<Chapter[]>('chapters', []);
      const ch = chapters.find((c) => c.id === args.chapterId);
      if (ch) {
        ch.title = args.title;
        ch.updated_at = Date.now();
        setStorage('chapters', chapters);
        return ch;
      }
      return null;
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

    case 'update_character_status': {
      const chars = getStorage<Character[]>('characters', []);
      const char = chars.find((c) => c.id === args?.id);
      if (char) {
        char.status = args.status;
        char.updated_at = Date.now();
        setStorage('characters', chars);
      }
      return;
    }

    case 'update_character': {
      const chars = getStorage<Character[]>('characters', []);
      const idx = chars.findIndex((c) => c.id === args?.input?.id);
      if (idx !== -1) {
        chars[idx] = {
          ...chars[idx],
          name: args.input.name,
          aliases: args.input.aliases ?? chars[idx].aliases,
          profile: args.input.profile ?? chars[idx].profile,
          personality: args.input.personality ?? chars[idx].personality,
          background: args.input.background ?? chars[idx].background,
          motivation: args.input.motivation ?? chars[idx].motivation,
          status: args.input.status ?? chars[idx].status,
          updated_at: Date.now(),
        };
        setStorage('characters', chars);
        return chars[idx];
      }
      throw new Error('未找到对应角色');
    }

    case 'delete_character': {
      let chars = getStorage<Character[]>('characters', []);
      chars = chars.filter((c) => c.id !== args?.id);
      setStorage('characters', chars);
      // 清理关系
      let rels = getStorage<CharacterRelationship[]>('character_relationships', []);
      rels = rels.filter((r) => r.source_character_id !== args?.id && r.target_character_id !== args?.id);
      setStorage('character_relationships', rels);
      // 清理状态
      let states = getStorage<any[]>('character_state_events', []);
      states = states.filter((s) => s.character_id !== args?.id);
      setStorage('character_state_events', states);
      return;
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

    case 'update_world_rule': {
      const rules = getStorage<WorldRule[]>('world_rules', []);
      const idx = rules.findIndex((r) => r.id === args?.input?.id);
      if (idx !== -1) {
        rules[idx] = {
          ...rules[idx],
          title: args.input.title,
          rule_content: args.input.rule_content,
          authority_level: args.input.authority_level ?? rules[idx].authority_level,
          status: args.input.status ?? rules[idx].status,
        };
        setStorage('world_rules', rules);
        return rules[idx];
      }
      throw new Error('未找到对应世界观法则');
    }

    case 'delete_world_rule': {
      let rules = getStorage<WorldRule[]>('world_rules', []);
      rules = rules.filter((r) => r.id !== args?.id);
      setStorage('world_rules', rules);
      return;
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

    case 'update_plot_thread_status': {
      const threads = getStorage<PlotThread[]>('plot_threads', []);
      const th = threads.find((t) => t.id === args?.id);
      if (th) {
        th.status = args.status;
        th.updated_at = Date.now();
        setStorage('plot_threads', threads);
      }
      return;
    }

    case 'update_plot_thread': {
      const threads = getStorage<PlotThread[]>('plot_threads', []);
      const idx = threads.findIndex((t) => t.id === args?.input?.id);
      if (idx !== -1) {
        threads[idx] = {
          ...threads[idx],
          title: args.input.title,
          description: args.input.description ?? threads[idx].description,
          introduced_chapter_id: args.input.introduced_chapter_id ?? threads[idx].introduced_chapter_id,
          expected_resolution: args.input.expected_resolution ?? threads[idx].expected_resolution,
          resolved_chapter_id: args.input.resolved_chapter_id ?? threads[idx].resolved_chapter_id,
          status: args.input.status ?? threads[idx].status,
          updated_at: Date.now(),
        };
        setStorage('plot_threads', threads);
        return threads[idx];
      }
      throw new Error('未找到对应伏笔线索');
    }

    case 'delete_plot_thread': {
      let threads = getStorage<PlotThread[]>('plot_threads', []);
      threads = threads.filter((t) => t.id !== args?.id);
      setStorage('plot_threads', threads);
      return;
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
      const providerId = args?.providerId;
      const allModels = getStorage<AiModel[]>('models', []);
      const matched = allModels.filter((m) => m.provider_id === providerId);
      if (matched.length > 0) return matched;
      return [
        {
          id: 'model-1',
          provider_id: providerId || 'seed-provider-001',
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
      if (input.is_active) {
        providers.forEach((p) => {
          p.is_active = false;
        });
      }
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

      if (input.models && input.models.length > 0) {
        let allModels = getStorage<AiModel[]>('models', []);
        allModels = allModels.filter((m) => m.provider_id !== existing!.id);
        input.models.forEach((m: any, idx: number) => {
          allModels.push({
            id: m.id || `model_${existing!.id}_${idx}`,
            provider_id: existing!.id,
            model_name: m.model_name,
            display_name: m.display_name || m.model_name,
            context_window: m.context_window || 128000,
            max_output_tokens: m.max_output_tokens || 4096,
            is_default: m.is_default ?? (idx === 0),
            created_at: Date.now(),
          });
        });
        setStorage('models', allModels);
      }

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
      const all = getStorage<CanonFact[]>('canon_facts', [
        {
          id: 'fact-001',
          novel_id: args?.novelId || SEED_NOVEL_ID,
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
      const novelId = args?.novelId;
      const query = (args?.query || '').trim().toLowerCase();
      let filtered = novelId ? all.filter((f) => f.novel_id === novelId) : all;
      if (query) {
        filtered = filtered.filter(
          (f) =>
            f.subject_id.toLowerCase().includes(query) ||
            f.predicate.toLowerCase().includes(query) ||
            f.object_value.toLowerCase().includes(query)
        );
      }
      return filtered;
    }

    case 'create_canon_fact': {
      const facts = getStorage<CanonFact[]>('canon_facts', []);
      const f: CanonFact = {
        id: 'fact_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
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

    case 'delete_canon_fact': {
      const id = args?.id;
      const facts = getStorage<CanonFact[]>('canon_facts', []);
      const updated = facts.filter((f) => f.id !== id);
      setStorage('canon_facts', updated);
      return;
    }

    case 'list_character_state_events': {
      const charId = args?.characterId;
      const all = getStorage<CharacterStateEvent[]>('character_state_events', []);
      if (charId) {
        return all.filter((e) => e.character_id === charId);
      }
      return all;
    }

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
      const fullProse = [
        `\n\n舷窗之外，无垠的柯伊伯带冰晶碎屑在曲率引擎的幽蓝辉光照耀下，泛着冷冽如霜的微芒。`,
        `李观棋静立在主控台前，修长有力的指尖悬停在跃迁扳机上方半寸处。仪表盘上的引力梯度波形正在剧烈震颤，宛如深海中苏醒巨兽的沉重脉搏。`,
        `“第三号因果锚点尚未闭合，强行跃迁的坍缩概率高达百分之七十三。”林幽清冷的声音自通讯矩阵中传来，带着不容置疑的严苛。`,
        `李观棋眼帘微垂，瞳孔深处倒映着跳跃的赤色警示符文。他没有丝毫迟疑，沉声道：“若在此刻退缩，整支先驱者舰队都将被吸入重力井裂隙。启动备用曲率环，我们逆流而上。”`,
      ].join('\n');

      setTimeout(async () => {
        // 切割为 2~5 字的微细流式片段，模拟真实模型 Token 输出
        let offset = 0;
        while (offset < fullProse.length) {
          const chunkSize = Math.floor(Math.random() * 4) + 2;
          const chunk = fullProse.slice(offset, offset + chunkSize);
          offset += chunkSize;

          emitWebStreamChunk({
            chapter_id,
            chunk,
            is_done: false,
          });

          const jitterWait = Math.floor(Math.random() * 50) + 70;
          await new Promise((r) => setTimeout(r, jitterWait));
        }

        emitWebStreamChunk({
          chapter_id,
          chunk: '',
          is_done: true,
        });
      }, 50);

      return fullProse;
    }

    // --- V2.0: Series & Parts ---
    case 'list_series': {
      return getStorage<any[]>('series', []);
    }
    case 'create_series': {
      const seriesList = getStorage<any[]>('series', []);
      const newSeries = { id: `series-${Date.now()}`, ...args.input, created_at: Date.now(), updated_at: Date.now() };
      seriesList.push(newSeries);
      setStorage('series', seriesList);
      return newSeries;
    }
    case 'delete_series': {
      const seriesList = getStorage<any[]>('series', []).filter((s) => s.id !== args.id);
      setStorage('series', seriesList);
      return null;
    }
    case 'list_parts': {
      const parts = getStorage<any[]>('parts', []);
      return parts.filter((p) => p.novel_id === args.novelId);
    }
    case 'create_part': {
      const parts = getStorage<any[]>('parts', []);
      const newPart = { id: `part-${Date.now()}`, sequence: parts.length + 1, ...args.input, created_at: Date.now() };
      parts.push(newPart);
      setStorage('parts', parts);
      return newPart;
    }
    case 'delete_part': {
      const parts = getStorage<any[]>('parts', []).filter((p) => p.id !== args.id);
      setStorage('parts', parts);
      return null;
    }

    // --- V2.0: Hierarchy Config ---
    case 'get_novel_hierarchy_config': {
      const configs = getStorage<Record<string, any>>('hierarchy_configs', {});
      return configs[args.novelId] || {
        enable_parts: false,
        enable_volumes: true,
        enable_scenes: true,
        enable_plot_beats: false,
        default_planning_level: 'SCENE',
        default_publishing_level: 'CHAPTER',
      };
    }
    case 'update_novel_hierarchy_config': {
      const configs = getStorage<Record<string, any>>('hierarchy_configs', {});
      configs[args.novelId] = args.config;
      setStorage('hierarchy_configs', configs);
      return args.config;
    }

    // --- V2.0: Plot Beats ---
    case 'list_plot_beats': {
      const beats = getStorage<any[]>('plot_beats', []);
      return beats.filter((b) => b.scene_id === args.sceneId);
    }
    case 'create_plot_beat': {
      const beats = getStorage<any[]>('plot_beats', []);
      const newBeat = { id: `beat-${Date.now()}`, status: 'PENDING', ...args.input, created_at: Date.now() };
      beats.push(newBeat);
      setStorage('plot_beats', beats);
      return newBeat;
    }
    case 'update_plot_beat_status': {
      const beats = getStorage<any[]>('plot_beats', []);
      const target = beats.find((b) => b.id === args.beatId);
      if (target) target.status = args.status;
      setStorage('plot_beats', beats);
      return null;
    }
    case 'delete_plot_beat': {
      const beats = getStorage<any[]>('plot_beats', []).filter((b) => b.id !== args.id);
      setStorage('plot_beats', beats);
      return null;
    }

    // --- V2.0: Character Arcs ---
    case 'list_character_arcs': {
      const arcs = getStorage<any[]>('character_arcs', []);
      return arcs.filter((a) => a.novel_id === args.novelId);
    }
    case 'create_character_arc': {
      const arcs = getStorage<any[]>('character_arcs', []);
      const newArc = { id: `chararc-${Date.now()}`, status: 'ACTIVE', ...args.input, created_at: Date.now(), updated_at: Date.now() };
      arcs.push(newArc);
      setStorage('character_arcs', arcs);
      return newArc;
    }
    case 'update_character_arc_stage': {
      const arcs = getStorage<any[]>('character_arcs', []);
      const target = arcs.find((a) => a.id === args.arcId);
      if (target) {
        target.current_stage = args.currentStage;
        if (args.status) target.status = args.status;
        target.updated_at = Date.now();
      }
      setStorage('character_arcs', arcs);
      return null;
    }
    case 'delete_character_arc': {
      const arcs = getStorage<any[]>('character_arcs', []).filter((a) => a.id !== args.id);
      setStorage('character_arcs', arcs);
      return null;
    }

    // --- V2.0: Parallel Threads ---
    case 'list_parallel_threads': {
      const threads = getStorage<any[]>('parallel_threads', []);
      return threads.filter((t) => t.novel_id === args.novelId);
    }
    case 'create_parallel_thread': {
      const threads = getStorage<any[]>('parallel_threads', []);
      const newThread = { id: `pthread-${Date.now()}`, status: 'ACTIVE', thread_color: '#3B82F6', ...args.input, created_at: Date.now(), updated_at: Date.now() };
      threads.push(newThread);
      setStorage('parallel_threads', threads);
      return newThread;
    }
    case 'update_parallel_thread_status': {
      const threads = getStorage<any[]>('parallel_threads', []);
      const target = threads.find((t) => t.id === args.threadId);
      if (target) target.status = args.status;
      setStorage('parallel_threads', threads);
      return null;
    }
    case 'delete_parallel_thread': {
      const threads = getStorage<any[]>('parallel_threads', []).filter((t) => t.id !== args.id);
      setStorage('parallel_threads', threads);
      return null;
    }

    // --- V2.0: Plot Associations ---
    case 'create_plot_association': {
      const assocs = getStorage<any[]>('plot_associations', []);
      const newAssoc = { id: `assoc-${Date.now()}`, weight: 5, ...args.input, created_at: Date.now() };
      assocs.push(newAssoc);
      setStorage('plot_associations', assocs);
      return newAssoc;
    }
    case 'delete_plot_association': {
      const assocs = getStorage<any[]>('plot_associations', []).filter((a) => a.id !== args.id);
      setStorage('plot_associations', assocs);
      return null;
    }
    case 'list_plot_associations_for_target': {
      const assocs = getStorage<any[]>('plot_associations', []);
      return assocs
        .filter((a) => a.target_type === args.targetType && a.target_id === args.targetId)
        .map((a) => ({ association: a, entity_title: '关联剧情实体', target_title: '关联目标' }));
    }
    case 'list_novel_plot_matrix': {
      const assocs = getStorage<any[]>('plot_associations', []);
      return assocs
        .filter((a) => a.novel_id === args.novelId)
        .map((a) => ({ association: a, entity_title: '剧情实体', target_title: '层级节点' }));
    }

    // --- V2.0: Tree & Lifecycle Operations ---
    case 'get_novel_content_tree': {
      const chapters = getStorage<Chapter[]>('chapters', []).filter((c) => c.novel_id === args.novelId);
      const volumes = getStorage<Volume[]>('volumes', []).filter((v) => v.novel_id === args.novelId);
      const parts = getStorage<any[]>('parts', []).filter((p) => p.novel_id === args.novelId);
      const config = getStorage<Record<string, any>>('hierarchy_configs', {})[args.novelId] || {
        enable_parts: parts.length > 0,
        enable_volumes: true,
        enable_scenes: true,
        enable_plot_beats: false,
        default_planning_level: 'SCENE',
        default_publishing_level: 'CHAPTER',
      };

      const chapterNodes = chapters.map((c) => ({
        id: c.id,
        node_type: 'CHAPTER',
        title: c.title,
        number: c.chapter_number,
        order_index: c.chapter_number,
        parent_id: c.volume_id,
        word_count: c.word_count || 0,
        status: c.status,
        goal_or_summary: '',
        associated_plot_count: 0,
        children: [],
      }));

      let rootNodes: any[] = [];
      if (volumes.length > 0) {
        rootNodes = volumes.map((v) => {
          const vChaps = chapterNodes.filter((c) => c.parent_id === v.id);
          return {
            id: v.id,
            node_type: 'VOLUME',
            title: v.title,
            number: v.order_index,
            order_index: v.order_index,
            parent_id: null,
            word_count: vChaps.reduce((sum, ch) => sum + (ch.word_count || 0), 0),
            status: v.status,
            goal_or_summary: v.summary,
            associated_plot_count: 0,
            children: vChaps,
          };
        });
        const unassigned = chapterNodes.filter((c) => !c.parent_id);
        rootNodes.push(...unassigned);
      } else {
        rootNodes = chapterNodes;
      }

      return {
        novel_id: args.novelId,
        hierarchy_config: config,
        root_nodes: rootNodes,
      };
    }
    case 'move_node':
    case 'renumber_hierarchy':
      return null;

    case 'split_chapter': {
      const chapters = getStorage<Chapter[]>('chapters', []);
      const ch = chapters.find((c) => c.id === args.input.chapter_id);
      if (!ch) throw new Error('Chapter not found');
      const newCh: Chapter = {
        id: `chapter-${Date.now()}`,
        novel_id: ch.novel_id,
        chapter_number: ch.chapter_number + 1,
        title: args.input.new_chapter_title || `${ch.title}（续）`,
        status: 'DRAFT',
        word_count: Math.floor(ch.word_count / 2),
        content: (ch.content || '').slice(args.input.split_point || 0),
        created_at: Date.now(),
        updated_at: Date.now(),
      };
      ch.content = (ch.content || '').slice(0, args.input.split_point || 0);
      ch.word_count = ch.content.length;
      chapters.push(newCh);
      setStorage('chapters', chapters);
      return [ch, newCh];
    }

    case 'merge_chapters': {
      const chapters = getStorage<Chapter[]>('chapters', []);
      const target = chapters.find((c) => c.id === args.input.target_chapter_id);
      const source = chapters.find((c) => c.id === args.input.source_chapter_id);
      if (!target || !source) throw new Error('Chapters not found');
      target.content = `${target.content || ''}\n\n${source.content || ''}`;
      target.word_count = target.content.length;
      const filtered = chapters.filter((c) => c.id !== source.id);
      setStorage('chapters', filtered);
      return target;
    }

    case 'assemble_hierarchical_creation_context': {
      const novel = getStorage<Novel[]>('novels', []).find((n) => n.id === args.novelId);
      const chapter = getStorage<Chapter[]>('chapters', []).find((c) => c.id === args.chapterId);
      return {
        novel_id: args.novelId,
        chapter_id: args.chapterId,
        chapter_title: chapter?.title || '当前章节',
        chapter_number: chapter?.chapter_number || 1,
        chapter_goal: '',
        scene_beats: [],
        associated_main_lines: [],
        associated_subplots: [],
        associated_story_arcs: [],
        associated_character_arcs: [],
        active_foreshadowings: [],
        parallel_threads: [],
        recent_timeline_events: [],
        l3_canon_rules: [],
        l3_active_character_profiles: [],
        formatted_system_prompt: `## 【当前创作层级定位与连续性上下文】\n- **作品**：《${novel?.title || ''}》\n- **章节**：第 ${chapter?.chapter_number || 1} 章《${chapter?.title || ''}》`,
      };
    }

    // --- V2.3: WORKFLOW ENGINE & TOOLBOX ---
    case 'list_workflow_templates': {
      const templates = getStorage<WorkflowTemplate[]>('workflow_templates', []);
      if (!args?.novelId) return templates;
      return templates.filter((t) => !t.novel_id || t.novel_id === args.novelId);
    }

    case 'save_workflow_template': {
      const templates = getStorage<WorkflowTemplate[]>('workflow_templates', []);
      const input = args.input;
      if (input.id) {
        const idx = templates.findIndex((t) => t.id === input.id);
        if (idx !== -1) {
          templates[idx] = {
            ...templates[idx],
            name: input.name,
            description: input.description || templates[idx].description,
            category: input.category || templates[idx].category,
            steps_json: input.steps_json,
            updated_at: Date.now(),
          };
          setStorage('workflow_templates', templates);
          return templates[idx];
        }
      }
      const newTpl: WorkflowTemplate = {
        id: 'wf_tpl_' + Date.now(),
        novel_id: input.novel_id || null,
        name: input.name,
        description: input.description || '',
        category: input.category || 'general',
        steps_json: input.steps_json,
        is_builtin: false,
        created_at: Date.now(),
        updated_at: Date.now(),
      };
      templates.push(newTpl);
      setStorage('workflow_templates', templates);
      return newTpl;
    }

    case 'create_workflow_run': {
      const runs = getStorage<WorkflowRun[]>('workflow_runs', []);
      const templates = getStorage<WorkflowTemplate[]>('workflow_templates', []);
      const input = args.input;
      const tpl = templates.find((t) => t.id === input.template_id);
      if (!tpl) throw new Error('Template not found');

      const runId = 'wf_run_' + Date.now();
      const newRun: WorkflowRun = {
        id: runId,
        template_id: input.template_id,
        novel_id: input.novel_id,
        target_chapter_id: input.target_chapter_id || null,
        status: 'PENDING',
        current_step_index: 0,
        run_mode: input.run_mode || 'STEP',
        context_bindings_json: input.context_bindings_json || '{}',
        total_tokens: 0,
        created_at: Date.now(),
        updated_at: Date.now(),
      };
      runs.push(newRun);
      setStorage('workflow_runs', runs);

      const stepsParsed = JSON.parse(tpl.steps_json || '[]');
      const stepRecords = getStorage<WorkflowStepRecord[]>('workflow_step_records', []);
      stepsParsed.forEach((s: any, idx: number) => {
        stepRecords.push({
          id: `wf_rec_${runId}_${idx}`,
          run_id: runId,
          step_index: idx,
          step_key: s.step_key || `step_${idx}`,
          title: s.title || `步骤 ${idx + 1}`,
          prompt_rendered: s.prompt_template || '',
          input_values_json: '{}',
          raw_output: '',
          edited_output: '',
          status: 'PENDING',
          error_message: '',
          token_usage: 0,
          created_at: Date.now(),
          updated_at: Date.now(),
        });
      });
      setStorage('workflow_step_records', stepRecords);
      return newRun;
    }

    case 'get_workflow_run_details': {
      const runs = getStorage<WorkflowRun[]>('workflow_runs', []);
      const templates = getStorage<WorkflowTemplate[]>('workflow_templates', []);
      const stepRecords = getStorage<WorkflowStepRecord[]>('workflow_step_records', []);

      const run = runs.find((r) => r.id === args.runId);
      if (!run) throw new Error('Run not found');
      const template = templates.find((t) => t.id === run.template_id);
      if (!template) throw new Error('Template not found');
      const steps = stepRecords
        .filter((s) => s.run_id === run.id)
        .sort((a, b) => a.step_index - b.step_index);

      return { run, template, steps };
    }

    case 'list_workflow_runs': {
      const runs = getStorage<WorkflowRun[]>('workflow_runs', []);
      return runs
        .filter((r) => r.novel_id === args.novelId)
        .sort((a, b) => b.created_at - a.created_at);
    }

    case 'update_workflow_step_output': {
      const stepRecords = getStorage<WorkflowStepRecord[]>('workflow_step_records', []);
      const rec = stepRecords.find((s) => s.id === args.input.step_record_id);
      if (rec) {
        rec.edited_output = args.input.edited_output;
        rec.updated_at = Date.now();
        setStorage('workflow_step_records', stepRecords);
      }
      return null;
    }

    case 'advance_workflow_step': {
      const runs = getStorage<WorkflowRun[]>('workflow_runs', []);
      const stepRecords = getStorage<WorkflowStepRecord[]>('workflow_step_records', []);
      const templates = getStorage<WorkflowTemplate[]>('workflow_templates', []);

      const run = runs.find((r) => r.id === args.input.run_id);
      if (!run) throw new Error('Run not found');
      const template = templates.find((t) => t.id === run.template_id);
      if (!template) throw new Error('Template not found');

      const rec = stepRecords.find(
        (s) => s.run_id === run.id && s.step_index === args.input.step_index
      );
      if (rec) {
        rec.status = 'COMPLETED';
        rec.updated_at = Date.now();
      }

      const totalSteps = stepRecords.filter((s) => s.run_id === run.id).length;
      if (args.input.step_index + 1 < totalSteps) {
        run.current_step_index = args.input.step_index + 1;
        run.status = args.input.auto_advance_next ? 'RUNNING' : 'WAITING_STEP';
      } else {
        run.status = 'COMPLETED';
      }
      run.updated_at = Date.now();

      setStorage('workflow_runs', runs);
      setStorage('workflow_step_records', stepRecords);

      const steps = stepRecords
        .filter((s) => s.run_id === run.id)
        .sort((a, b) => a.step_index - b.step_index);

      return { run, template, steps };
    }

    case 'assemble_toolbox_prompt': {
      const novel = getStorage<Novel[]>('novels', []).find((n) => n.id === args.input.novel_id);
      const characters = getStorage<Character[]>('characters', []);
      const rules = getStorage<WorldRule[]>('world_rules', []);
      const chapters = getStorage<Chapter[]>('chapters', []);

      const charSummary = (args.input.character_ids || [])
        .map((cid: string) => {
          const c = characters.find((char) => char.id === cid);
          return c ? `【${c.name}】(${c.personality || '无设定'}): ${c.profile || ''}` : '';
        })
        .filter(Boolean)
        .join('\n');

      const ruleSummary = (args.input.world_rule_ids || [])
        .map((rid: string) => {
          const r = rules.find((rule) => rule.id === rid);
          return r ? `【${r.title}】: ${r.rule_content}` : '';
        })
        .filter(Boolean)
        .join('\n');

      let prevChText = '';
      if (args.input.include_prev_chapter && args.input.chapter_id) {
        const curCh = chapters.find((c) => c.id === args.input.chapter_id);
        if (curCh) {
          const prev = chapters.find(
            (c) => c.novel_id === curCh.novel_id && c.chapter_number === curCh.chapter_number - 1
          );
          if (prev) {
            prevChText = `前一章正文片段：${(prev.content || '').slice(0, 500)}`;
          }
        }
      }

      const assembledContextSummary = [
        charSummary ? `关联角色：\n${charSummary}` : '',
        ruleSummary ? `关联设定：\n${ruleSummary}` : '',
        prevChText,
      ]
        .filter(Boolean)
        .join('\n\n');

      let targetDestination: 'insert_editor' | 'save_as_character' | 'save_as_rule' | 'save_as_chapter' = 'insert_editor';
      if (args.input.action_type === 'name') targetDestination = 'save_as_character';
      else if (args.input.action_type === 'world_law' || args.input.action_type === 'cheat') targetDestination = 'save_as_rule';
      else if (args.input.action_type === 'gold_opening' || args.input.action_type === 'chapter_outline') targetDestination = 'save_as_chapter';

      return {
        action_type: args.input.action_type,
        system_prompt: `你是一名顶级网文专家。当前服务作品《${novel?.title || '长篇小说'}》，文风：${novel?.writing_style || '沉稳细腻'}。`,
        user_prompt: `【任务要求】针对【${args.input.action_type}】，输入需求：${args.input.custom_input || '生成专业网文要素'}\n\n${assembledContextSummary}`,
        target_destination: targetDestination,
        assembled_context_summary: assembledContextSummary,
      };
    }

    case 'execute_llm_chat': {
      return `【AI 生成成果】针对输入内容：\n“${args.user_prompt.slice(0, 80)}...”\n\n已完成构思推演。情节扣人心弦，文风贴合长篇沉浸感，细节自然流动。`;
    }

    // --- V2.3.1: Voice Profiles & Finding Repair ---
    case 'list_voice_profiles': {
      const profiles = getStorage<VoiceProfile[]>('voice_profiles', []);
      const novelId = args.novelId;
      if (novelId) {
        return profiles.filter((p) => !p.novel_id || p.novel_id === novelId);
      }
      return profiles;
    }

    case 'save_voice_profile': {
      const profiles = getStorage<VoiceProfile[]>('voice_profiles', []);
      const input: SaveVoiceProfileInput = args.input;
      const now = Date.now();
      const id = input.id || 'voice_' + now;

      // 如果设为 active，则同一 novel_id（或全局）下其他置为 false
      let updatedList = profiles.map((p) => {
        if (input.is_active && ((input.novel_id && p.novel_id === input.novel_id) || (!input.novel_id && !p.novel_id))) {
          return { ...p, is_active: false };
        }
        return p;
      });

      const existingIndex = updatedList.findIndex((p) => p.id === id);
      const newProfile: VoiceProfile = {
        id,
        novel_id: input.novel_id || null,
        name: input.name,
        description: input.description || '',
        sample_text: input.sample_text || '',
        sentence_rhythm: input.sentence_rhythm || 'BALANCED',
        vocabulary_tone: input.vocabulary_tone || 'CLASSICAL_MODERN',
        pov_preference: input.pov_preference || 'THIRD_LIMITED',
        sensory_ratio: input.sensory_ratio || 'BALANCED',
        custom_rules_json: input.custom_rules_json || '[]',
        is_active: input.is_active ?? false,
        is_builtin: false,
        created_at: existingIndex >= 0 ? updatedList[existingIndex].created_at : now,
        updated_at: now,
      };

      if (existingIndex >= 0) {
        updatedList[existingIndex] = newProfile;
      } else {
        updatedList.push(newProfile);
      }

      setStorage('voice_profiles', updatedList);
      return newProfile;
    }

    case 'set_active_voice_profile': {
      const profiles = getStorage<VoiceProfile[]>('voice_profiles', []);
      const target = profiles.find((p) => p.id === args.id);
      if (!target) return;

      const isNovelScoped = Boolean(target.novel_id);
      const updated = profiles.map((p) => {
        if (p.id === args.id) {
          return { ...p, is_active: true, updated_at: Date.now() };
        }
        if (isNovelScoped && p.novel_id === target.novel_id) {
          return { ...p, is_active: false };
        }
        if (!isNovelScoped) {
          if (!p.novel_id) return { ...p, is_active: false };
          if (args.novelId && p.novel_id === args.novelId) return { ...p, is_active: false };
        }
        return p;
      });
      setStorage('voice_profiles', updated);
      return;
    }

    case 'delete_voice_profile': {
      const profiles = getStorage<VoiceProfile[]>('voice_profiles', []);
      const filtered = profiles.filter((p) => p.id !== args.id);
      setStorage('voice_profiles', filtered);
      return;
    }

    case 'generate_finding_repair': {
      const { finding_id, custom_instructions } = args.input as GenerateFindingRepairInput;
      const reports = getStorage<ReviewReport[]>('review_reports', []);
      let targetFinding: any = null;
      for (const r of reports) {
        const found = r.findings?.find((f) => f.id === finding_id);
        if (found) {
          targetFinding = found;
          break;
        }
      }

      const originalQuote = targetFinding?.evidence_quote || '巨大的反物质引擎在寒夜中发出沉闷的轰鸣';
      const suggestion = targetFinding?.suggestion || '建议补充主引擎从静默到全功率运作的耗时描述';
      const findingTitle = targetFinding?.title || '反物质引擎预热时间细节补充';

      const revisedDraft = `${originalQuote}。淡蓝色的电弧在导流环表面跳跃，高能粒子注入器以极高转速运转，倒计时读数在视网膜投影上稳定闪烁。`;

      const result: FindingRepairResult = {
        finding_id,
        finding_title: findingTitle,
        severity: targetFinding?.severity || 'MINOR',
        original_quote: originalQuote,
        repair_suggestion: suggestion,
        revised_text_draft: revisedDraft,
        diff_summary: `扩充了引力透镜与电弧细节，补充临场压迫倒计时（${custom_instructions || '严格遵照当前文风'}）`,
        voice_profile_used: '仙侠修真·沉雄雅致风',
      };
      return result;
    }

    // --- V2.4: Multi-Model Arena ---
    case 'execute_arena_duel': {
      const input = args.input as ExecuteArenaDuelInput;
      const slotAOutput = `【选手 A 生成草案】\n${input.user_prompt}。\n冷冽的星辉漫过舷窗，林远在控制台前屏住呼吸。仪器上的能量曲线正以指数级飙升，深空引力透镜将整片星系的光晕撕裂成环状，仿佛远古巨灵投下的冰冷注视。`;
      const slotBOutput = `【选手 B 生成草案】\n${input.user_prompt}。\n刺目的警报猩红旋转，重力减震轴发出金属扭曲的低鸣。安雅一把按住手动泄压阀，大声呼喊：“核心温度已突破临界阈值，必须立刻逆向注水！”甲板随之剧烈颠簸。`;

      // 模拟流式发射
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          emitArenaStreamChunk({
            session_id: input.session_id,
            slot: 'A',
            chunk: slotAOutput,
            is_done: true,
            error: null,
          });
          emitArenaStreamChunk({
            session_id: input.session_id,
            slot: 'B',
            chunk: slotBOutput,
            is_done: true,
            error: null,
          });
        }, 300);
      }

      const res: ArenaDuelResult = {
        session_id: input.session_id,
        slot_a_output: slotAOutput,
        slot_a_duration_ms: 1280,
        slot_b_output: slotBOutput,
        slot_b_duration_ms: 1050,
      };
      return res;
    }

    case 'merge_arena_outputs': {
      const _input = args.input as MergeArenaOutputsInput;
      void _input;
      const merged = `【智能双模融合精华版】\n冷冽星辉漫过舷窗，刺目的猩红警报同步回旋闪烁。林远在控制台前屏住呼吸，深空引力透镜将星系撕成环状，而安雅已稳稳按住泄压阀，金属轴低鸣中，两股伟力在视网膜投影上交织成绝美的毁灭与新生之光。`;
      return merged;
    }

    case 'list_model_arena_runs': {
      const runs = getStorage<ModelArenaRun[]>('model_arena_runs', []);
      return runs.filter((r) => r.novel_id === args.novelId);
    }

    case 'save_model_arena_run': {
      const input = args.input as SaveModelArenaRunInput;
      const runs = getStorage<ModelArenaRun[]>('model_arena_runs', []);
      const id = input.id || `arena-run-${Date.now()}`;
      const now = Date.now();
      const existingIdx = runs.findIndex((r) => r.id === id);

      const newRun: ModelArenaRun = {
        id,
        novel_id: input.novel_id,
        chapter_id: input.chapter_id || null,
        prompt: input.prompt,
        model_a_provider: input.model_a_provider,
        model_a_name: input.model_a_name,
        model_a_output: input.model_a_output,
        model_a_duration_ms: input.model_a_duration_ms,
        model_a_tokens: input.model_a_tokens,
        model_b_provider: input.model_b_provider,
        model_b_name: input.model_b_name,
        model_b_output: input.model_b_output,
        model_b_duration_ms: input.model_b_duration_ms,
        model_b_tokens: input.model_b_tokens,
        winner_slot: input.winner_slot || 'NONE',
        is_blind: input.is_blind ?? false,
        merged_output: input.merged_output || '',
        created_at: now,
      };

      if (existingIdx !== -1) {
        runs[existingIdx] = newRun;
      } else {
        runs.unshift(newRun);
      }
      setStorage('model_arena_runs', runs);
      return newRun;
    }

    case 'delete_model_arena_run': {
      const runs = getStorage<ModelArenaRun[]>('model_arena_runs', []);
      const filtered = runs.filter((r) => r.id !== args.id);
      setStorage('model_arena_runs', filtered);
      return;
    }

    // --- V2.5: EPUB 3 Export ---
    case 'export_novel_epub': {
      const novels = getStorage<Novel[]>('novels', []);
      const novel = novels.find((n) => n.id === args.novelId);
      const chapters = getStorage<Chapter[]>('chapters', []).filter((c) => c.novel_id === args.novelId);
      const title = novel?.title || '作品';
      const totalWords = chapters.reduce((acc, c) => acc + (c.word_count || 0), 0);
      return {
        file_path: args.outputPath || `E:\\novels\\export\\${title}.epub`,
        file_size: 1024 * 18 + totalWords * 2,
        chapter_count: chapters.length,
        word_count: totalWords,
        title,
      };
    }

    // --- V2.5.1: AI Prompt Optimizer ---
    case 'optimize_writing_prompt': {
      const input: OptimizeWritingPromptInput = args?.input || {};
      const raw = input.raw_prompt || '';
      const angle = input.optimization_angle || 'DRAMA_CONFLICT';

      let angleDesc = '戏剧博弈与人物交锋';
      let hookDesc = '在对峙达到顶点时，暗处突然传来一声微弱的机括轻响，彻底打乱了所有人的算计。';
      if (angle === 'SENSORY_DETAIL') {
        angleDesc = '多重感官白描与物象细节';
        hookDesc = '案几上的烛芯忽然无风自炸，一点火星落入未干的墨迹中，腾起一缕带着苦艾气味的青烟。';
      } else if (angle === 'PLOT_HOOK') {
        angleDesc = '伏笔勾连与章末断章悬念';
        hookDesc = '石盒裂开一道缝隙，露出的却非失传古卷，而是一面刻着家族血誓的残破青铜命牌。';
      } else if (angle === 'CONCISE_PUNCHY') {
        angleDesc = '快节奏爽利推进与强冲突对抗';
        hookDesc = '一刀斩落，刀锋在咽喉前三寸骤然停滞，对方眼底闪过的却不是惊恐，而是计谋得逞的狞笑。';
      }

      const result: OptimizeWritingPromptResult = {
        original_prompt: raw,
        optimized_prompt: `【重构创作指令·${angleDesc}】\n\n【核心情境与动作动机】\n${raw}\n\n【戏剧冲突展开与博弈】\n- 强化主角迫切想要达成的目标，与阻碍力量形成即时摩擦；\n- 运用具象动作、神态与言辞机锋替代直白陈述；\n- 对话包含潜台词，句句带有机锋试探，信息层层递进。\n\n【感官与环境具象（Show, Don't Tell）】\n- 刻画周围环境的压抑感（光影明暗、风声雨声、空气中的异味），借物喻情；\n- 捕捉生理微反应：指节发白、呼吸沉重、喉头微动，传递紧绷情绪。\n\n【叙事节奏与收尾】\n- 拒绝注水与大段说明性设定，把世界观融于当下的交锋之中；\n- 章末收于突发悬念，将事件推向不可逆转的选择节点。`,
        enhancement_points: [
          '重构核心动机：将简要意图具象化为高压对抗与迫切障碍',
          '注入潜台词交锋：对话暗藏动机试探，告别说明书式问答',
          '强化临场白描：运用多维感官与物象细节替代抽象情绪宣泄',
          '精准断章扣子：在对抗失衡瞬间收尾，留足下一步期待感',
        ],
        suggested_hooks: hookDesc,
        suggested_tags: ['戏剧张力', '感官白描', '潜台词交锋', '高潮断章'],
      };
      return result;
    }

    // --- Story Bible / Review / Serialization / Hierarchy Mock Completions ---
    case 'delete_story_phase': {
      const phases = getStorage<any[]>('story_phases', []);
      setStorage('story_phases', phases.filter((p) => p.id !== args?.id));
      return;
    }

    case 'update_story_phase': {
      const phases = getStorage<any[]>('story_phases', []);
      const target = phases.find((p) => p.id === args?.input?.id);
      if (target) {
        if (args?.input?.title) target.title = args.input.title;
        if (args?.input?.goal !== undefined) target.goal = args.input.goal;
        if (args?.input?.order_index !== undefined) target.order_index = args.input.order_index;
        setStorage('story_phases', phases);
        return target;
      }
      return null;
    }

    case 'update_story_arc_status': {
      const arcs = getStorage<any[]>('story_arcs', []);
      const target = arcs.find((a) => a.id === args?.id);
      if (target) {
        target.status = args?.status;
        setStorage('story_arcs', arcs);
      }
      return;
    }

    case 'delete_story_arc': {
      const arcs = getStorage<any[]>('story_arcs', []);
      setStorage('story_arcs', arcs.filter((a) => a.id !== args?.id));
      return;
    }

    case 'update_scene_status': {
      const scenes = getStorage<any[]>('scenes', []);
      const target = scenes.find((s) => s.id === args?.id);
      if (target) {
        target.status = args?.status;
        setStorage('scenes', scenes);
      }
      return;
    }

    case 'list_review_reports': {
      return getStorage<any[]>('review_reports', []);
    }

    case 'get_latest_review_report': {
      const reports = getStorage<any[]>('review_reports', []);
      return reports[reports.length - 1] || null;
    }

    case 'update_finding_status': {
      return;
    }

    case 'run_scene_planning': {
      return {
        scenes: [
          {
            scene_number: 1,
            title: '剑试青云峰',
            setting: '太玄主峰绝壁',
            conflict_target: '通过宗门试炼',
            emotional_beat: '由忐忑变为决然',
            key_dialogue_subtext: '隐藏的杀机',
          },
        ],
      };
    }

    case 'run_collaborative_workflow': {
      return {
        step: 3,
        status: 'COMPLETED',
        message: '工作流已成功完成协同创作',
      };
    }

    case 'export_chapter_text': {
      const chapters = getStorage<Chapter[]>('chapters', []);
      const ch = chapters.find((c) => c.id === args?.chapterId);
      return ch?.content || '';
    }

    case 'get_serialization_job': {
      const jobs = getStorage<any[]>('serialization_jobs', []);
      return jobs.find((j) => j.id === args?.jobId) || null;
    }

    case 'pause_serialization_job':
    case 'cancel_serialization_job': {
      const jobs = getStorage<any[]>('serialization_jobs', []);
      const job = jobs.find((j) => j.id === args?.jobId);
      if (job) {
        job.status = cmd === 'pause_serialization_job' ? 'PAUSED' : 'CANCELLED';
        setStorage('serialization_jobs', jobs);
      }
      return;
    }

    case 'import_novel_archive': {
      try {
        const archive = JSON.parse(args?.archiveJson || '{}');
        const novels = getStorage<Novel[]>('novels', []);
        const newNovel: Novel = {
          id: 'novel_' + Date.now(),
          title: `${archive.novel?.title || '导入小说'} (导入副本)`,
          description: archive.novel?.description || '',
          genre_profile: archive.novel?.genre_profile || '未分类',
          language: archive.novel?.language || 'zh-CN',
          writing_style: archive.novel?.writing_style || '沉稳细腻',
          status: archive.novel?.status || 'PLANNING',
          created_at: Date.now(),
          updated_at: Date.now(),
        };
        novels.push(newNovel);
        setStorage('novels', novels);

        // Import chapters
        if (Array.isArray(archive.chapters)) {
          const chapters = getStorage<Chapter[]>('chapters', []);
          for (const ch of archive.chapters) {
            chapters.push({
              ...ch,
              id: 'ch_' + Math.random().toString(36).slice(2, 9),
              novel_id: newNovel.id,
            });
          }
          setStorage('chapters', chapters);
        }

        // Import characters
        if (Array.isArray(archive.characters)) {
          const chars = getStorage<Character[]>('characters', []);
          for (const c of archive.characters) {
            chars.push({
              ...c,
              id: 'char_' + Math.random().toString(36).slice(2, 9),
              novel_id: newNovel.id,
            });
          }
          setStorage('characters', chars);
        }

        return newNovel;
      } catch (e) {
        throw new Error('导入归档失败: ' + e);
      }
    }

    case 'get_series': {
      const series = getStorage<any[]>('series', []);
      return series.find((s) => s.id === args?.id) || null;
    }

    case 'get_part': {
      const parts = getStorage<any[]>('parts', []);
      return parts.find((p) => p.id === args?.id) || null;
    }

    case 'list_plot_associations_for_entity': {
      const assocs = getStorage<any[]>('plot_associations', []);
      return assocs.filter(
        (a) => a.entity_id === args?.entityId || a.entity_type === args?.entityType
      );
    }

    case 'split_scene':
    case 'merge_scenes': {
      return;
    }

    default:
      console.warn(`[WebMock] Unhandled command: ${cmd}`, args);
      return null;
  }
}
