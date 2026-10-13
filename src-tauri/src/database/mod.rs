pub mod schema;

use parking_lot::Mutex;
use rusqlite::{params, Connection, Result};
use std::path::PathBuf;
use std::sync::Arc;
use uuid::Uuid;

use crate::models::{
    AiModel, AiProvider, CanonFact, Chapter, ChapterVersion, Character, CharacterRelationship,
    CharacterStateEvent, ContinuityAuditFinding, CreateCanonFactInput, CreateChapterInput,
    CreateCharacterInput, CreateCharacterRelationshipInput, CreateCharacterStateEventInput,
    CreateNovelInput, CreatePlotThreadInput, CreateSceneInput, CreateStoryArcInput,
    CreateStoryEventInput, CreateStoryPhaseInput, CreateWorldRuleInput, MemoryContextPack, Novel,
    PlotThread, ReviewFinding, ReviewReport, SaveProviderInput, Scene, SerializationJob, StoryArc,
    StoryEvent, StoryPhase, Volume, WorldRule, DatabaseHealthReport, NovelArchive,
    Series, CreateSeriesInput, Part, CreatePartInput, CreateVolumeInput, HierarchyConfig,
    PlotBeat, CreatePlotBeatInput, CharacterArc, CreateCharacterArcInput,
    ParallelThread, CreateParallelThreadInput, PlotAssociation, CreatePlotAssociationInput, PlotAssociationView,
    MoveNodeInput, SplitChapterInput, SplitSceneInput, MergeChaptersInput, MergeScenesInput,
    RenumberHierarchyInput, ContentTreeNode, NovelContentTree, HierarchicalCreationContext,
};

#[derive(Clone)]
pub struct DbManager {
    conn: Arc<Mutex<Connection>>,
    db_path: PathBuf,
}

impl DbManager {
    pub fn new() -> Result<Self> {
        let db_dir = dirs::data_dir()
            .map(|p| p.join("NovelForgeAI"))
            .unwrap_or_else(|| PathBuf::from("./data"));
        
        let _ = std::fs::create_dir_all(&db_dir);
        let db_path = db_dir.join("novelforge.db");

        let conn = Connection::open(&db_path)?;

        // Configure WAL mode and performance pragmas
        let _ = conn.pragma_update(None, "journal_mode", "WAL");
        let _ = conn.pragma_update(None, "foreign_keys", "ON");
        let _ = conn.pragma_update(None, "synchronous", "NORMAL");
        let _ = conn.pragma_update(None, "busy_timeout", 5000);

        // Execute table schemas
        conn.execute_batch(schema::INIT_SCHEMA)?;

        // Execute FTS5 schema
        let _ = conn.execute_batch(schema::FTS5_SCHEMA);

        // Run idempotent migrations for V2.0 multi-level hierarchy & plot system
        let migrations = [
            "ALTER TABLE novels ADD COLUMN series_id TEXT",
            "ALTER TABLE novels ADD COLUMN series_order INTEGER DEFAULT 1",
            "ALTER TABLE novels ADD COLUMN hierarchy_config TEXT DEFAULT '{\"enable_parts\":false,\"enable_volumes\":true,\"enable_scenes\":true,\"enable_beats\":false}'",
            "ALTER TABLE volumes ADD COLUMN part_id TEXT",
            "ALTER TABLE chapters ADD COLUMN part_id TEXT",
            "ALTER TABLE chapters ADD COLUMN order_index INTEGER DEFAULT 1",
            "ALTER TABLE chapters ADD COLUMN chapter_goal TEXT DEFAULT ''",
            "ALTER TABLE scenes ADD COLUMN title TEXT DEFAULT ''",
            "ALTER TABLE scenes ADD COLUMN scene_number INTEGER DEFAULT 1",
            "ALTER TABLE scenes ADD COLUMN order_index INTEGER DEFAULT 1",
            "ALTER TABLE scenes ADD COLUMN content TEXT DEFAULT ''",
            "ALTER TABLE scenes ADD COLUMN word_count INTEGER DEFAULT 0",
            "ALTER TABLE scenes ADD COLUMN time_anchor TEXT DEFAULT ''",
            "ALTER TABLE scenes ADD COLUMN conflict_target TEXT DEFAULT ''",
        ];
        for sql in migrations {
            let _ = conn.execute(sql, []);
        }

        // Seed default local CPA provider if no provider exists
        let provider_count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM ai_providers",
            [],
            |r| r.get(0),
        ).unwrap_or(0);

        if provider_count == 0 {
            let now = chrono::Utc::now().timestamp_millis();
            let provider_id = Uuid::new_v4().to_string();
            let _ = conn.execute(
                "INSERT INTO ai_providers (id, name, provider_type, base_url, api_key, is_active, created_at, updated_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
                params![
                    &provider_id,
                    "本地网关 (CPA / OpenAI 兼容)",
                    "OPENAI_COMPATIBLE",
                    "http://127.0.0.1:8317/v1",
                    "",
                    1,
                    now,
                    now
                ],
            );

            let model_id = Uuid::new_v4().to_string();
            let _ = conn.execute(
                "INSERT INTO ai_models (id, provider_id, model_name, display_name, context_window, max_output_tokens, is_default, created_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
                params![
                    &model_id,
                    &provider_id,
                    "gpt-4o-mini",
                    "GPT-4o Mini (默认)",
                    128000,
                    4096,
                    1,
                    now
                ],
            );
        }

        // Seed default sample novel if no novel exists
        let novel_count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM novels",
            [],
            |r| r.get(0),
        ).unwrap_or(0);

        if novel_count == 0 {
            let _ = Self::seed_sample_novel(&conn);
        }

        Ok(Self {
            conn: Arc::new(Mutex::new(conn)),
            db_path,
        })
    }

    fn seed_sample_novel(conn: &Connection) -> Result<()> {
        let now = chrono::Utc::now().timestamp_millis();
        let novel_id = Uuid::new_v4().to_string();

        conn.execute(
            "INSERT INTO novels (id, title, description, genre_profile, language, writing_style, status, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'ACTIVE', ?7, ?8)",
            params![
                &novel_id,
                "《星穹之门：终极纪元》",
                "人类深空先驱舰队跨越柯伊伯带，在太阳风暴余波与未知暗区中追寻古代超维文明遗留的星穹之门。",
                "硬科幻/太空歌剧",
                "zh-CN",
                "沉郁硬朗、富有宏大宇宙诗意、注重微动作与环境压迫感",
                now,
                now
            ],
        )?;

        conn.execute(
            "INSERT INTO novel_settings (novel_id, chapter_target_length) VALUES (?1, 3000)",
            params![&novel_id],
        )?;

        let volume_id = Uuid::new_v4().to_string();
        conn.execute(
            "INSERT INTO volumes (id, novel_id, title, order_index, summary, status, created_at)
             VALUES (?1, ?2, '第一卷：深空破晓', 1, '跨越柯伊伯带与未知脉冲接战', 'PLANNING', ?3)",
            params![&volume_id, &novel_id, now],
        )?;

        let chapter_id = Uuid::new_v4().to_string();
        let sample_content = "<p>冰冷的冷凝水顺着重巡洋舰“先驱者号”舰桥厚重的铅灰色合金装甲壁缓缓淌下，在低重力环境下凝结成一串悬垂的深蓝色水珠。</p><p>林远站在舷窗前，舷窗外是浩瀚无垠的柯伊伯带暗区，远处太阳的光芒已被削弱成一颗冰冷的苍白星芒。他的右手食指无意识地摩挲着舰长指引徽章边缘的缺口，那是三年前土星轨道战役中留下的弹片擦痕。</p><p>“曲率核心自检完成，工质流速稳定在百分之九十七。”首席科学官安雅的声音从战术投影台后方传来，沉稳中透着一丝不易察觉的紧绷，“但引力波雷达刚刚捕捉到底噪层有极其微弱的周期性脉冲。周期是十三点七秒，不是自然天体辐射。”</p><p>林远缓缓转过身，目光落在三维全息星图上闪烁的暗红光点上。“通报全舰，取消常规巡航状态，进入二级战备。还有三十分钟进入预定跃迁盲区，把所有无源传感器功率推到峰值。”</p><p>“明白。”安雅迅速敲击操作台，战术控制台上泛起层层淡青色的光晕，“如果那道信号是冲着我们的曲率核心来的，一旦跃迁启动，我们可能就无法回头了。”</p><p>林远凝视着虚空中沉默的星河，深吸了一口气。“这片星空从来不允许回头的人活下来。通知轮机舱，按计划注入反物质催化剂。”</p>";
        
        conn.execute(
            "INSERT INTO chapters (id, novel_id, volume_id, chapter_number, title, content, word_count, status, created_at, updated_at)
             VALUES (?1, ?2, ?3, 1, '跃迁前夕', ?4, 512, 'DRAFT', ?5, ?6)",
            params![&chapter_id, &novel_id, &volume_id, sample_content, now, now],
        )?;

        // Initial snapshot
        let version_id = Uuid::new_v4().to_string();
        conn.execute(
            "INSERT INTO chapter_versions (id, chapter_id, version_number, content, word_count, change_summary, source_agent, created_at)
             VALUES (?1, ?2, 1, ?3, 512, '初始示范草稿', 'DEMO_SEED', ?4)",
            params![&version_id, &chapter_id, sample_content, now],
        )?;

        // Seed Characters
        let char1_id = Uuid::new_v4().to_string();
        let char2_id = Uuid::new_v4().to_string();
        conn.execute(
            "INSERT INTO characters (id, novel_id, name, role_type, identity, personality, motivation, secret, current_status, arc_stage, tags, created_at, updated_at)
             VALUES (?1, ?2, '林远', 'PROTAGONIST', '先驱者号远征舰队旗舰舰长', '冷峻沉着、极度理智、内心负有创伤', '探寻失落先驱者文明遗迹真相', '三年前土星轨道撤退战中有未解指令', '担任先驱者号最高决策人', '觉醒破局期', '硬汉,舰长,深空探索', ?3, ?4)",
            params![&char1_id, &novel_id, now, now],
        )?;
        conn.execute(
            "INSERT INTO characters (id, novel_id, name, role_type, identity, personality, motivation, secret, current_status, arc_stage, tags, created_at, updated_at)
             VALUES (?1, ?2, '安雅', 'MAJOR', '首席科学官兼战术参谋', '敏锐执着、思维缜密、对未解物理现象高度着迷', '解密原初暗物质脉冲物理公式', '曾接触过第一代暗区禁忌标本', '正解析13.7秒微弱脉冲', '初识探知期', '天才科学家,参谋,冷静', ?3, ?4)",
            params![&char2_id, &novel_id, now, now],
        )?;

        // Seed Relationship
        let rel_id = Uuid::new_v4().to_string();
        conn.execute(
            "INSERT INTO character_relationships (id, novel_id, source_character_id, target_character_id, relation_type, description, trust_level, tension_level, updated_at)
             VALUES (?1, ?2, ?3, ?4, '生死战友', '在多次深空危机中建立起绝对背靠背信任', 95, 10, ?5)",
            params![&rel_id, &novel_id, &char1_id, &char2_id, now],
        )?;

        // Seed World Rule
        let rule_id = Uuid::new_v4().to_string();
        conn.execute(
            "INSERT INTO world_rules (id, novel_id, category, name, rule_content, authority_level, is_active, created_at, updated_at)
             VALUES (?1, ?2, 'PHYSICS', '曲率泡稳定法则', '在未校准引力扰动区启动曲率泡，必须维持工质流速>=95%，否则将引发时空剪切坍缩。', 'CANON', 1, ?3, ?4)",
            params![&rule_id, &novel_id, now, now],
        )?;

        // Seed Story Phase & Arc
        let phase_id = Uuid::new_v4().to_string();
        conn.execute(
            "INSERT INTO story_phases (id, novel_id, phase_number, title, goal, status, created_at)
             VALUES (?1, ?2, 1, '第一阶段：破晓远征', '突围柯伊伯带封锁区，安全抵达跳跃折叠坐标', 'ACTIVE', ?3)",
            params![&phase_id, &novel_id, now],
        )?;

        let arc_id = Uuid::new_v4().to_string();
        conn.execute(
            "INSERT INTO story_arcs (id, phase_id, arc_name, arc_type, main_conflict, status, created_at)
             VALUES (?1, ?2, '柯伊伯带突围弧', 'MAIN', '在未知暗区脉冲干扰下完成先驱者号首次超维曲率跃迁', 'IN_PROGRESS', ?3)",
            params![&arc_id, &phase_id, now],
        )?;

        Ok(())
    }

    pub fn get_db_path(&self) -> String {
        self.db_path.to_string_lossy().to_string()
    }

    // --- NOVELS ---

    pub fn create_novel(&self, input: CreateNovelInput) -> Result<Novel> {
        let conn = self.conn.lock();
        let id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now().timestamp_millis();
        let title = input.title.trim().to_string();
        let description = input.description.unwrap_or_default();
        let genre_profile = input.genre_profile.unwrap_or_else(|| "玄幻".to_string());
        let language = input.language.unwrap_or_else(|| "zh-CN".to_string());
        let writing_style = input.writing_style.unwrap_or_else(|| "通俗流畅、生动细腻".to_string());
        let chapter_target_length = input.chapter_target_length.unwrap_or(3000);
        let series_id = input.series_id;
        let hierarchy_config_str = input
            .hierarchy_config
            .map(|c| serde_json::to_string(&c).unwrap_or_default())
            .unwrap_or_else(|| {
                "{\"enable_parts\":false,\"enable_volumes\":true,\"enable_scenes\":true,\"enable_beats\":false}".to_string()
            });

        conn.execute(
            "INSERT INTO novels (id, title, description, genre_profile, language, writing_style, status, series_id, series_order, hierarchy_config, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'ACTIVE', ?7, 1, ?8, ?9, ?10)",
            params![
                &id,
                &title,
                &description,
                &genre_profile,
                &language,
                &writing_style,
                &series_id,
                &hierarchy_config_str,
                now,
                now
            ],
        )?;

        conn.execute(
            "INSERT INTO novel_settings (novel_id, chapter_target_length)
             VALUES (?1, ?2)",
            params![&id, chapter_target_length],
        )?;

        // Create default Volume 1
        let volume_id = Uuid::new_v4().to_string();
        conn.execute(
            "INSERT INTO volumes (id, novel_id, part_id, title, order_index, summary, status, created_at)
             VALUES (?1, ?2, NULL, '第一卷：初入尘世', 1, '故事开端与核心矛盾引入', 'PLANNING', ?3)",
            params![&volume_id, &id, now],
        )?;

        Ok(Novel {
            id,
            title,
            description,
            genre_profile,
            language,
            writing_style,
            status: "ACTIVE".to_string(),
            series_id,
            series_order: Some(1),
            hierarchy_config: Some(hierarchy_config_str),
            created_at: now,
            updated_at: now,
            chapter_count: Some(0),
            total_word_count: Some(0),
        })
    }

    pub fn list_novels(&self) -> Result<Vec<Novel>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(
            "SELECT n.id, n.title, n.description, n.genre_profile, n.language, n.writing_style, n.status,
                    n.series_id, n.series_order, n.hierarchy_config, n.created_at, n.updated_at,
                    COUNT(c.id) as chapter_count,
                    COALESCE(SUM(c.word_count), 0) as total_word_count
             FROM novels n
             LEFT JOIN chapters c ON n.id = c.novel_id
             GROUP BY n.id
             ORDER BY n.updated_at DESC"
        )?;

        let rows = stmt.query_map([], |row| {
            Ok(Novel {
                id: row.get(0)?,
                title: row.get(1)?,
                description: row.get(2)?,
                genre_profile: row.get(3)?,
                language: row.get(4)?,
                writing_style: row.get(5)?,
                status: row.get(6)?,
                series_id: row.get(7)?,
                series_order: row.get(8)?,
                hierarchy_config: row.get(9)?,
                created_at: row.get(10)?,
                updated_at: row.get(11)?,
                chapter_count: Some(row.get(12)?),
                total_word_count: Some(row.get(13)?),
            })
        })?;

        let mut novels = Vec::new();
        for r in rows {
            novels.push(r?);
        }
        Ok(novels)
    }

    pub fn get_novel(&self, id: &str) -> Result<Novel> {
        let conn = self.conn.lock();
        conn.query_row(
            "SELECT n.id, n.title, n.description, n.genre_profile, n.language, n.writing_style, n.status,
                    n.series_id, n.series_order, n.hierarchy_config, n.created_at, n.updated_at,
                    COUNT(c.id) as chapter_count,
                    COALESCE(SUM(c.word_count), 0) as total_word_count
             FROM novels n
             LEFT JOIN chapters c ON n.id = c.novel_id
             WHERE n.id = ?1
             GROUP BY n.id",
            params![id],
            |row| {
                Ok(Novel {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    description: row.get(2)?,
                    genre_profile: row.get(3)?,
                    language: row.get(4)?,
                    writing_style: row.get(5)?,
                    status: row.get(6)?,
                    series_id: row.get(7)?,
                    series_order: row.get(8)?,
                    hierarchy_config: row.get(9)?,
                    created_at: row.get(10)?,
                    updated_at: row.get(11)?,
                    chapter_count: Some(row.get(12)?),
                    total_word_count: Some(row.get(13)?),
                })
            },
        )
    }

    pub fn delete_novel(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute("DELETE FROM novels WHERE id = ?1", params![id])?;
        Ok(())
    }

    // --- VOLUMES ---

    pub fn list_volumes(&self, novel_id: &str) -> Result<Vec<Volume>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(
            "SELECT id, novel_id, part_id, title, order_index, summary, status, created_at
             FROM volumes WHERE novel_id = ?1 ORDER BY order_index ASC",
        )?;
        let rows = stmt.query_map(params![novel_id], |row| {
            Ok(Volume {
                id: row.get(0)?,
                novel_id: row.get(1)?,
                part_id: row.get(2)?,
                title: row.get(3)?,
                order_index: row.get(4)?,
                summary: row.get(5)?,
                status: row.get(6)?,
                created_at: row.get(7)?,
            })
        })?;
        let mut vols = Vec::new();
        for r in rows {
            vols.push(r?);
        }
        Ok(vols)
    }

    // --- CHAPTERS ---

    pub fn list_chapters(&self, novel_id: &str) -> Result<Vec<Chapter>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(
            "SELECT c.id, c.novel_id, c.part_id, c.volume_id, c.chapter_number, c.order_index,
                    c.title, c.chapter_goal, c.status, c.active_version_id, c.word_count,
                    v.content, c.created_at, c.updated_at
             FROM chapters c
             LEFT JOIN chapter_versions v ON c.active_version_id = v.id
             WHERE c.novel_id = ?1
             ORDER BY c.chapter_number ASC",
        )?;

        let rows = stmt.query_map(params![novel_id], |row| {
            Ok(Chapter {
                id: row.get(0)?,
                novel_id: row.get(1)?,
                part_id: row.get(2)?,
                volume_id: row.get(3)?,
                chapter_number: row.get(4)?,
                order_index: row.get(5)?,
                title: row.get(6)?,
                chapter_goal: row.get(7)?,
                status: row.get(8)?,
                active_version_id: row.get(9)?,
                word_count: row.get(10)?,
                content: row.get(11)?,
                created_at: row.get(12)?,
                updated_at: row.get(13)?,
            })
        })?;

        let mut chapters = Vec::new();
        for r in rows {
            chapters.push(r?);
        }
        Ok(chapters)
    }

    pub fn get_chapter(&self, id: &str) -> Result<Chapter> {
        let conn = self.conn.lock();
        conn.query_row(
            "SELECT c.id, c.novel_id, c.part_id, c.volume_id, c.chapter_number, c.order_index,
                    c.title, c.chapter_goal, c.status, c.active_version_id, c.word_count,
                    v.content, c.created_at, c.updated_at
             FROM chapters c
             LEFT JOIN chapter_versions v ON c.active_version_id = v.id
             WHERE c.id = ?1",
            params![id],
            |row| {
                Ok(Chapter {
                    id: row.get(0)?,
                    novel_id: row.get(1)?,
                    part_id: row.get(2)?,
                    volume_id: row.get(3)?,
                    chapter_number: row.get(4)?,
                    order_index: row.get(5)?,
                    title: row.get(6)?,
                    chapter_goal: row.get(7)?,
                    status: row.get(8)?,
                    active_version_id: row.get(9)?,
                    word_count: row.get(10)?,
                    content: row.get(11)?,
                    created_at: row.get(12)?,
                    updated_at: row.get(13)?,
                })
            },
        )
    }

    pub fn create_chapter(&self, input: CreateChapterInput) -> Result<Chapter> {
        let conn = self.conn.lock();
        let id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now().timestamp_millis();

        // Calculate next chapter number if not provided
        let chapter_number = match input.chapter_number {
            Some(n) => n,
            None => {
                let max_num: Option<i64> = conn
                    .query_row(
                        "SELECT MAX(chapter_number) FROM chapters WHERE novel_id = ?1",
                        params![&input.novel_id],
                        |r| r.get(0),
                    )
                    .unwrap_or(None);
                max_num.unwrap_or(0) + 1
            }
        };

        let initial_content = input.initial_content.unwrap_or_default();
        let word_count = count_chinese_characters(&initial_content);
        let order_index = input.order_index.unwrap_or(chapter_number);
        let chapter_goal = input.chapter_goal.unwrap_or_default();

        // 1. Insert chapters record first to satisfy foreign key constraint on chapter_versions
        conn.execute(
            "INSERT INTO chapters (id, novel_id, part_id, volume_id, chapter_number, order_index, title, chapter_goal, status, active_version_id, word_count, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 'DRAFT', NULL, ?9, ?10, ?11)",
            params![
                &id,
                &input.novel_id,
                &input.part_id,
                &input.volume_id,
                chapter_number,
                order_index,
                &input.title,
                &chapter_goal,
                word_count,
                now,
                now
            ],
        )?;

        // 2. Create initial version
        let version_id = Uuid::new_v4().to_string();
        conn.execute(
            "INSERT INTO chapter_versions (id, chapter_id, version_number, content, source_type, created_by, created_at)
             VALUES (?1, ?2, 1, ?3, 'USER_EDIT', 'user', ?4)",
            params![&version_id, &id, &initial_content, now],
        )?;

        // 3. Link active_version_id
        conn.execute(
            "UPDATE chapters SET active_version_id = ?1 WHERE id = ?2",
            params![&version_id, &id],
        )?;

        // Update novel's updated_at
        conn.execute(
            "UPDATE novels SET updated_at = ?1 WHERE id = ?2",
            params![now, &input.novel_id],
        )?;

        // Update FTS index
        let _ = conn.execute(
            "INSERT INTO chapters_fts (chapter_id, novel_id, title, content) VALUES (?1, ?2, ?3, ?4)",
            params![&id, &input.novel_id, &input.title, &initial_content],
        );

        Ok(Chapter {
            id,
            novel_id: input.novel_id,
            part_id: input.part_id,
            volume_id: input.volume_id,
            chapter_number,
            order_index: Some(order_index),
            title: input.title,
            chapter_goal: Some(chapter_goal),
            status: "DRAFT".to_string(),
            active_version_id: Some(version_id),
            word_count,
            content: Some(initial_content),
            created_at: now,
            updated_at: now,
        })
    }

    pub fn save_chapter_content(
        &self,
        chapter_id: &str,
        content: &str,
        create_new_version: bool,
        source_type: &str,
    ) -> Result<Chapter> {
        let conn = self.conn.lock();
        let now = chrono::Utc::now().timestamp_millis();
        let word_count = count_chinese_characters(content);

        // Fetch current active version
        let (current_version_id, novel_id, title): (Option<String>, String, String) = conn.query_row(
            "SELECT active_version_id, novel_id, title FROM chapters WHERE id = ?1",
            params![chapter_id],
            |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
        )?;

        let version_id = if create_new_version || current_version_id.is_none() {
            let max_ver: i64 = conn
                .query_row(
                    "SELECT COALESCE(MAX(version_number), 0) FROM chapter_versions WHERE chapter_id = ?1",
                    params![chapter_id],
                    |r| r.get(0),
                )
                .unwrap_or(0);
            let next_ver = max_ver + 1;
            let new_v_id = Uuid::new_v4().to_string();

            conn.execute(
                "INSERT INTO chapter_versions (id, chapter_id, version_number, content, source_type, created_by, created_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, 'user', ?6)",
                params![&new_v_id, chapter_id, next_ver, content, source_type, now],
            )?;

            new_v_id
        } else {
            let cur_v = current_version_id.unwrap();
            conn.execute(
                "UPDATE chapter_versions SET content = ?1, updated_at = ?2 WHERE id = ?3",
                params![content, now, &cur_v],
            ).or_else(|_| {
                // If updated_at column is missing on versions, update content directly
                conn.execute(
                    "UPDATE chapter_versions SET content = ?1 WHERE id = ?2",
                    params![content, &cur_v],
                )
            })?;
            cur_v
        };

        // Update chapters record
        conn.execute(
            "UPDATE chapters SET active_version_id = ?1, word_count = ?2, updated_at = ?3 WHERE id = ?4",
            params![&version_id, word_count, now, chapter_id],
        )?;

        // Update novels updated_at
        conn.execute(
            "UPDATE novels SET updated_at = ?1 WHERE id = ?2",
            params![now, &novel_id],
        )?;

        // Update FTS index
        let _ = conn.execute(
            "DELETE FROM chapters_fts WHERE chapter_id = ?1",
            params![chapter_id],
        );
        let _ = conn.execute(
            "INSERT INTO chapters_fts (chapter_id, novel_id, title, content) VALUES (?1, ?2, ?3, ?4)",
            params![chapter_id, &novel_id, &title, content],
        );

        drop(conn);
        self.get_chapter(chapter_id)
    }

    pub fn list_chapter_versions(&self, chapter_id: &str) -> Result<Vec<ChapterVersion>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(
            "SELECT id, chapter_id, version_number, content, source_type, created_by, content_hash, created_at
             FROM chapter_versions WHERE chapter_id = ?1 ORDER BY version_number DESC",
        )?;

        let rows = stmt.query_map(params![chapter_id], |row| {
            Ok(ChapterVersion {
                id: row.get(0)?,
                chapter_id: row.get(1)?,
                version_number: row.get(2)?,
                content: row.get(3)?,
                source_type: row.get(4)?,
                created_by: row.get(5)?,
                content_hash: row.get(6)?,
                created_at: row.get(7)?,
            })
        })?;

        let mut vers = Vec::new();
        for r in rows {
            vers.push(r?);
        }
        Ok(vers)
    }

    pub fn delete_chapter(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute("DELETE FROM chapters WHERE id = ?1", params![id])?;
        let _ = conn.execute("DELETE FROM chapters_fts WHERE chapter_id = ?1", params![id]);
        Ok(())
    }

    // --- STORY BIBLE & CHARACTERS ---

    pub fn list_characters(&self, novel_id: &str) -> Result<Vec<Character>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(
            "SELECT id, novel_id, name, aliases, profile, personality, background, motivation, status, created_at, updated_at
             FROM characters WHERE novel_id = ?1 ORDER BY created_at ASC",
        )?;

        let rows = stmt.query_map(params![novel_id], |row| {
            Ok(Character {
                id: row.get(0)?,
                novel_id: row.get(1)?,
                name: row.get(2)?,
                aliases: row.get(3)?,
                profile: row.get(4)?,
                personality: row.get(5)?,
                background: row.get(6)?,
                motivation: row.get(7)?,
                status: row.get(8)?,
                created_at: row.get(9)?,
                updated_at: row.get(10)?,
            })
        })?;

        let mut chars = Vec::new();
        for r in rows {
            chars.push(r?);
        }
        Ok(chars)
    }

    pub fn create_character(&self, input: CreateCharacterInput) -> Result<Character> {
        let conn = self.conn.lock();
        let id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now().timestamp_millis();
        let aliases = input.aliases.unwrap_or_default();
        let profile = input.profile.unwrap_or_default();
        let personality = input.personality.unwrap_or_default();
        let background = input.background.unwrap_or_default();
        let motivation = input.motivation.unwrap_or_default();

        conn.execute(
            "INSERT INTO characters (id, novel_id, name, aliases, profile, personality, background, motivation, status, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 'ACTIVE', ?9, ?10)",
            params![
                &id,
                &input.novel_id,
                &input.name,
                &aliases,
                &profile,
                &personality,
                &background,
                &motivation,
                now,
                now
            ],
        )?;

        Ok(Character {
            id,
            novel_id: input.novel_id,
            name: input.name,
            aliases,
            profile,
            personality,
            background,
            motivation,
            status: "ACTIVE".to_string(),
            created_at: now,
            updated_at: now,
        })
    }

    // --- WORLD RULES ---

    pub fn list_world_rules(&self, novel_id: &str) -> Result<Vec<WorldRule>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(
            "SELECT id, novel_id, title, rule_content, authority_level, status, created_at
             FROM world_rules WHERE novel_id = ?1 ORDER BY created_at ASC",
        )?;

        let rows = stmt.query_map(params![novel_id], |row| {
            Ok(WorldRule {
                id: row.get(0)?,
                novel_id: row.get(1)?,
                title: row.get(2)?,
                rule_content: row.get(3)?,
                authority_level: row.get(4)?,
                status: row.get(5)?,
                created_at: row.get(6)?,
            })
        })?;

        let mut rules = Vec::new();
        for r in rows {
            rules.push(r?);
        }
        Ok(rules)
    }

    pub fn create_world_rule(&self, input: CreateWorldRuleInput) -> Result<WorldRule> {
        let conn = self.conn.lock();
        let id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now().timestamp_millis();
        let authority_level = input.authority_level.unwrap_or_else(|| "CANON".to_string());

        conn.execute(
            "INSERT INTO world_rules (id, novel_id, title, rule_content, authority_level, status, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, 'ACTIVE', ?6)",
            params![
                &id,
                &input.novel_id,
                &input.title,
                &input.rule_content,
                &authority_level,
                now
            ],
        )?;

        Ok(WorldRule {
            id,
            novel_id: input.novel_id,
            title: input.title,
            rule_content: input.rule_content,
            authority_level,
            status: "ACTIVE".to_string(),
            created_at: now,
        })
    }

    // --- PLOT THREADS ---

    pub fn list_plot_threads(&self, novel_id: &str) -> Result<Vec<PlotThread>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(
            "SELECT id, novel_id, title, description, introduced_chapter_id, expected_resolution, resolved_chapter_id, status, created_at, updated_at
             FROM plot_threads WHERE novel_id = ?1 ORDER BY created_at ASC",
        )?;

        let rows = stmt.query_map(params![novel_id], |row| {
            Ok(PlotThread {
                id: row.get(0)?,
                novel_id: row.get(1)?,
                title: row.get(2)?,
                description: row.get(3)?,
                introduced_chapter_id: row.get(4)?,
                expected_resolution: row.get(5)?,
                resolved_chapter_id: row.get(6)?,
                status: row.get(7)?,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
            })
        })?;

        let mut threads = Vec::new();
        for r in rows {
            threads.push(r?);
        }
        Ok(threads)
    }

    pub fn create_plot_thread(&self, input: CreatePlotThreadInput) -> Result<PlotThread> {
        let conn = self.conn.lock();
        let id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now().timestamp_millis();
        let description = input.description.unwrap_or_default();
        let expected_resolution = input.expected_resolution.unwrap_or_default();

        conn.execute(
            "INSERT INTO plot_threads (id, novel_id, title, description, introduced_chapter_id, expected_resolution, status, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'PLANTED', ?7, ?8)",
            params![
                &id,
                &input.novel_id,
                &input.title,
                &description,
                &input.introduced_chapter_id,
                &expected_resolution,
                now,
                now
            ],
        )?;

        Ok(PlotThread {
            id,
            novel_id: input.novel_id,
            title: input.title,
            description,
            introduced_chapter_id: input.introduced_chapter_id,
            expected_resolution,
            resolved_chapter_id: None,
            status: "PLANTED".to_string(),
            created_at: now,
            updated_at: now,
        })
    }

    // --- AI PROVIDERS & MODELS ---

    pub fn list_providers(&self) -> Result<Vec<AiProvider>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(
            "SELECT id, name, provider_type, base_url, api_key, is_active, created_at, updated_at
             FROM ai_providers ORDER BY created_at ASC",
        )?;

        let rows = stmt.query_map([], |row| {
            let active_int: i64 = row.get(5)?;
            Ok(AiProvider {
                id: row.get(0)?,
                name: row.get(1)?,
                provider_type: row.get(2)?,
                base_url: row.get(3)?,
                api_key: row.get(4)?,
                is_active: active_int == 1,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        })?;

        let mut providers = Vec::new();
        for r in rows {
            providers.push(r?);
        }
        Ok(providers)
    }

    pub fn list_models(&self, provider_id: &str) -> Result<Vec<AiModel>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(
            "SELECT id, provider_id, model_name, display_name, context_window, max_output_tokens, is_default, created_at
             FROM ai_models WHERE provider_id = ?1 ORDER BY created_at ASC",
        )?;

        let rows = stmt.query_map(params![provider_id], |row| {
            let def_int: i64 = row.get(6)?;
            Ok(AiModel {
                id: row.get(0)?,
                provider_id: row.get(1)?,
                model_name: row.get(2)?,
                display_name: row.get(3)?,
                context_window: row.get(4)?,
                max_output_tokens: row.get(5)?,
                is_default: def_int == 1,
                created_at: row.get(7)?,
            })
        })?;

        let mut models = Vec::new();
        for r in rows {
            models.push(r?);
        }
        Ok(models)
    }

    pub fn save_provider(&self, input: SaveProviderInput) -> Result<AiProvider> {
        let conn = self.conn.lock();
        let now = chrono::Utc::now().timestamp_millis();
        let id = input.id.unwrap_or_else(|| Uuid::new_v4().to_string());
        let is_active_int = if input.is_active { 1 } else { 0 };

        if input.is_active {
            conn.execute("UPDATE ai_providers SET is_active = 0", [])?;
        }

        conn.execute(
            "INSERT INTO ai_providers (id, name, provider_type, base_url, api_key, is_active, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
             ON CONFLICT(id) DO UPDATE SET
                name=excluded.name,
                provider_type=excluded.provider_type,
                base_url=excluded.base_url,
                api_key=excluded.api_key,
                is_active=excluded.is_active,
                updated_at=excluded.updated_at",
            params![
                &id,
                &input.name,
                &input.provider_type,
                &input.base_url,
                &input.api_key,
                is_active_int,
                now,
                now
            ],
        )?;

        // Update models if provided
        if !input.models.is_empty() {
            conn.execute("DELETE FROM ai_models WHERE provider_id = ?1", params![&id])?;
            for m in input.models {
                let m_id = m.id.unwrap_or_else(|| Uuid::new_v4().to_string());
                let is_def_int = if m.is_default.unwrap_or(false) { 1 } else { 0 };
                conn.execute(
                    "INSERT INTO ai_models (id, provider_id, model_name, display_name, context_window, max_output_tokens, is_default, created_at)
                     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
                    params![
                        &m_id,
                        &id,
                        &m.model_name,
                        &m.display_name,
                        m.context_window.unwrap_or(128000),
                        m.max_output_tokens.unwrap_or(4096),
                        is_def_int,
                        now
                    ],
                )?;
            }
        }

        Ok(AiProvider {
            id,
            name: input.name,
            provider_type: input.provider_type,
            base_url: input.base_url,
            api_key: input.api_key,
            is_active: input.is_active,
            created_at: now,
            updated_at: now,
        })
    }

    pub fn get_active_provider_and_model(&self) -> Result<Option<(AiProvider, AiModel)>> {
        let conn = self.conn.lock();
        let provider = conn.query_row(
            "SELECT id, name, provider_type, base_url, api_key, is_active, created_at, updated_at
             FROM ai_providers WHERE is_active = 1 LIMIT 1",
            [],
            |row| {
                Ok(AiProvider {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    provider_type: row.get(2)?,
                    base_url: row.get(3)?,
                    api_key: row.get(4)?,
                    is_active: true,
                    created_at: row.get(6)?,
                    updated_at: row.get(7)?,
                })
            },
        );

        match provider {
            Ok(p) => {
                let model = conn.query_row(
                    "SELECT id, provider_id, model_name, display_name, context_window, max_output_tokens, is_default, created_at
                     FROM ai_models WHERE provider_id = ?1 ORDER BY is_default DESC LIMIT 1",
                    params![&p.id],
                    |row| {
                        let def_int: i64 = row.get(6)?;
                        Ok(AiModel {
                            id: row.get(0)?,
                            provider_id: row.get(1)?,
                            model_name: row.get(2)?,
                            display_name: row.get(3)?,
                            context_window: row.get(4)?,
                            max_output_tokens: row.get(5)?,
                            is_default: def_int == 1,
                            created_at: row.get(7)?,
                        })
                    },
                );

                match model {
                    Ok(m) => Ok(Some((p, m))),
                    Err(_) => {
                        // Create a fallback model if none exists
                        let m = AiModel {
                            id: "fallback".to_string(),
                            provider_id: p.id.clone(),
                            model_name: "gpt-4o-mini".to_string(),
                            display_name: "Default Model".to_string(),
                            context_window: 128000,
                            max_output_tokens: 4096,
                            is_default: true,
                            created_at: 0,
                        };
                        Ok(Some((p, m)))
                    }
                }
            }
            Err(_) => Ok(None),
        }
    }

    // --- CHARACTER RELATIONSHIPS ---

    pub fn list_character_relationships(&self, novel_id: &str) -> Result<Vec<CharacterRelationship>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(
            "SELECT id, novel_id, source_character_id, target_character_id, relation_type, description, status, created_at
             FROM character_relationships WHERE novel_id = ?1 ORDER BY created_at ASC",
        )?;

        let rows = stmt.query_map(params![novel_id], |row| {
            Ok(CharacterRelationship {
                id: row.get(0)?,
                novel_id: row.get(1)?,
                source_character_id: row.get(2)?,
                target_character_id: row.get(3)?,
                relation_type: row.get(4)?,
                description: row.get(5)?,
                status: row.get(6)?,
                created_at: row.get(7)?,
            })
        })?;

        let mut list = Vec::new();
        for r in rows {
            list.push(r?);
        }
        Ok(list)
    }

    pub fn create_character_relationship(&self, input: CreateCharacterRelationshipInput) -> Result<CharacterRelationship> {
        let conn = self.conn.lock();
        let id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now().timestamp_millis();
        let desc = input.description.unwrap_or_default();

        conn.execute(
            "INSERT INTO character_relationships (id, novel_id, source_character_id, target_character_id, relation_type, description, status, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'ACTIVE', ?7)",
            params![
                &id,
                &input.novel_id,
                &input.source_character_id,
                &input.target_character_id,
                &input.relation_type,
                &desc,
                now
            ],
        )?;

        Ok(CharacterRelationship {
            id,
            novel_id: input.novel_id,
            source_character_id: input.source_character_id,
            target_character_id: input.target_character_id,
            relation_type: input.relation_type,
            description: desc,
            status: "ACTIVE".to_string(),
            created_at: now,
        })
    }

    pub fn delete_character_relationship(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute("DELETE FROM character_relationships WHERE id = ?1", params![id])?;
        Ok(())
    }

    // --- STORY PHASES ---

    pub fn list_story_phases(&self, novel_id: &str) -> Result<Vec<StoryPhase>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(
            "SELECT id, novel_id, title, order_index, goal, status, created_at
             FROM story_phases WHERE novel_id = ?1 ORDER BY order_index ASC",
        )?;

        let rows = stmt.query_map(params![novel_id], |row| {
            Ok(StoryPhase {
                id: row.get(0)?,
                novel_id: row.get(1)?,
                title: row.get(2)?,
                order_index: row.get(3)?,
                goal: row.get(4)?,
                status: row.get(5)?,
                created_at: row.get(6)?,
            })
        })?;

        let mut list = Vec::new();
        for r in rows {
            list.push(r?);
        }
        Ok(list)
    }

    pub fn create_story_phase(&self, input: CreateStoryPhaseInput) -> Result<StoryPhase> {
        let conn = self.conn.lock();
        let id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now().timestamp_millis();
        let order_idx = input.order_index.unwrap_or_else(|| {
            let max_idx: Option<i64> = conn
                .query_row(
                    "SELECT MAX(order_index) FROM story_phases WHERE novel_id = ?1",
                    params![&input.novel_id],
                    |r| r.get(0),
                )
                .ok();
            max_idx.unwrap_or(0) + 1
        });
        let goal = input.goal.unwrap_or_default();

        conn.execute(
            "INSERT INTO story_phases (id, novel_id, title, order_index, goal, status, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, 'PLANNING', ?6)",
            params![&id, &input.novel_id, &input.title, order_idx, &goal, now],
        )?;

        Ok(StoryPhase {
            id,
            novel_id: input.novel_id,
            title: input.title,
            order_index: order_idx,
            goal,
            status: "PLANNING".to_string(),
            created_at: now,
        })
    }

    pub fn delete_story_phase(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute("DELETE FROM story_phases WHERE id = ?1", params![id])?;
        Ok(())
    }

    // --- STORY ARCS ---

    pub fn list_story_arcs(&self, novel_id: &str) -> Result<Vec<StoryArc>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(
            "SELECT id, novel_id, phase_id, title, goal, description, status, start_chapter_id, planned_end, priority, created_at
             FROM story_arcs WHERE novel_id = ?1 ORDER BY created_at ASC",
        )?;

        let rows = stmt.query_map(params![novel_id], |row| {
            Ok(StoryArc {
                id: row.get(0)?,
                novel_id: row.get(1)?,
                phase_id: row.get(2)?,
                title: row.get(3)?,
                goal: row.get(4)?,
                description: row.get(5)?,
                status: row.get(6)?,
                start_chapter_id: row.get(7)?,
                planned_end: row.get(8)?,
                priority: row.get(9)?,
                created_at: row.get(10)?,
            })
        })?;

        let mut list = Vec::new();
        for r in rows {
            list.push(r?);
        }
        Ok(list)
    }

    pub fn create_story_arc(&self, input: CreateStoryArcInput) -> Result<StoryArc> {
        let conn = self.conn.lock();
        let id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now().timestamp_millis();
        let goal = input.goal.unwrap_or_default();
        let desc = input.description.unwrap_or_default();
        let priority = input.priority.unwrap_or_else(|| "MAIN".to_string());

        conn.execute(
            "INSERT INTO story_arcs (id, novel_id, phase_id, title, goal, description, status, priority, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'DEVELOPING', ?7, ?8)",
            params![&id, &input.novel_id, &input.phase_id, &input.title, &goal, &desc, &priority, now],
        )?;

        Ok(StoryArc {
            id,
            novel_id: input.novel_id,
            phase_id: input.phase_id,
            title: input.title,
            goal,
            description: desc,
            status: "DEVELOPING".to_string(),
            start_chapter_id: None,
            planned_end: "".to_string(),
            priority,
            created_at: now,
        })
    }

    pub fn update_story_arc_status(&self, id: &str, status: &str) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute("UPDATE story_arcs SET status = ?1 WHERE id = ?2", params![status, id])?;
        Ok(())
    }

    // --- SCENES ---

    pub fn list_scenes(&self, chapter_id: &str) -> Result<Vec<Scene>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(
            "SELECT id, chapter_id, sequence, order_index, title, scene_number,
                    objective, outline, pov_character_id, location_id, content,
                    word_count, time_anchor, conflict_target, status, created_at
             FROM scenes WHERE chapter_id = ?1 ORDER BY sequence ASC",
        )?;

        let rows = stmt.query_map(params![chapter_id], |row| {
            Ok(Scene {
                id: row.get(0)?,
                chapter_id: row.get(1)?,
                sequence: row.get(2)?,
                order_index: row.get(3)?,
                title: row.get(4)?,
                scene_number: row.get(5)?,
                objective: row.get(6)?,
                outline: row.get(7)?,
                pov_character_id: row.get(8)?,
                location_id: row.get(9)?,
                content: row.get(10)?,
                word_count: row.get(11)?,
                time_anchor: row.get(12)?,
                conflict_target: row.get(13)?,
                status: row.get(14)?,
                created_at: row.get(15)?,
            })
        })?;

        let mut list = Vec::new();
        for r in rows {
            list.push(r?);
        }
        Ok(list)
    }

    pub fn create_scene(&self, input: CreateSceneInput) -> Result<Scene> {
        let conn = self.conn.lock();
        let id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now().timestamp_millis();
        let location_id = input.location_id.unwrap_or_default();
        let title = input.title.unwrap_or_default();
        let scene_number = input.scene_number.unwrap_or(input.sequence);
        let order_index = input.order_index.unwrap_or(input.sequence);
        let content = input.content.unwrap_or_default();
        let word_count = count_chinese_characters(&content);
        let time_anchor = input.time_anchor.unwrap_or_default();
        let conflict_target = input.conflict_target.unwrap_or_default();

        conn.execute(
            "INSERT INTO scenes (id, chapter_id, sequence, order_index, title, scene_number, objective, outline, pov_character_id, location_id, content, word_count, time_anchor, conflict_target, status, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, 'PLANNED', ?15)",
            params![
                &id,
                &input.chapter_id,
                input.sequence,
                order_index,
                &title,
                scene_number,
                &input.objective,
                &input.outline,
                &input.pov_character_id,
                &location_id,
                &content,
                word_count,
                &time_anchor,
                &conflict_target,
                now
            ],
        )?;

        Ok(Scene {
            id,
            chapter_id: input.chapter_id,
            sequence: input.sequence,
            order_index: Some(order_index),
            title: Some(title),
            scene_number: Some(scene_number),
            objective: input.objective,
            outline: input.outline,
            pov_character_id: input.pov_character_id,
            location_id,
            content: Some(content),
            word_count: Some(word_count),
            time_anchor: Some(time_anchor),
            conflict_target: Some(conflict_target),
            status: "PLANNED".to_string(),
            created_at: now,
        })
    }

    pub fn delete_scene(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute("DELETE FROM scenes WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn update_scene_status(&self, id: &str, status: &str) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute("UPDATE scenes SET status = ?1 WHERE id = ?2", params![status, id])?;
        Ok(())
    }

    // --- STORY EVENTS ---

    pub fn list_story_events(&self, novel_id: &str) -> Result<Vec<StoryEvent>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(
            "SELECT id, novel_id, title, description, story_time, source_chapter_id, cause_event_id, location_id, status, created_at
             FROM story_events WHERE novel_id = ?1 ORDER BY created_at ASC",
        )?;

        let rows = stmt.query_map(params![novel_id], |row| {
            Ok(StoryEvent {
                id: row.get(0)?,
                novel_id: row.get(1)?,
                title: row.get(2)?,
                description: row.get(3)?,
                story_time: row.get(4)?,
                source_chapter_id: row.get(5)?,
                cause_event_id: row.get(6)?,
                location_id: row.get(7)?,
                status: row.get(8)?,
                created_at: row.get(9)?,
            })
        })?;

        let mut list = Vec::new();
        for r in rows {
            list.push(r?);
        }
        Ok(list)
    }

    pub fn create_story_event(&self, input: CreateStoryEventInput) -> Result<StoryEvent> {
        let conn = self.conn.lock();
        let id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now().timestamp_millis();
        let desc = input.description.unwrap_or_default();
        let story_time = input.story_time.unwrap_or_default();

        conn.execute(
            "INSERT INTO story_events (id, novel_id, title, description, story_time, source_chapter_id, status, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'OCCURRED', ?7)",
            params![
                &id,
                &input.novel_id,
                &input.title,
                &desc,
                &story_time,
                &input.source_chapter_id,
                now
            ],
        )?;

        Ok(StoryEvent {
            id,
            novel_id: input.novel_id,
            title: input.title,
            description: desc,
            story_time,
            source_chapter_id: input.source_chapter_id,
            cause_event_id: None,
            location_id: "".to_string(),
            status: "OCCURRED".to_string(),
            created_at: now,
        })
    }

    // --- REVIEW REPORTS & FINDINGS ---

    pub fn create_review_report(
        &self,
        chapter_id: &str,
        version_number: i64,
        score: i64,
        summary: &str,
        findings: &[ContinuityAuditFinding],
    ) -> Result<ReviewReport> {
        let conn = self.conn.lock();
        let report_id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now().timestamp_millis();

        conn.execute(
            "INSERT INTO review_reports (id, chapter_id, version_number, score, summary, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![&report_id, chapter_id, version_number, score, summary, now],
        )?;

        let mut saved_findings = Vec::new();
        for f in findings {
            let f_id = Uuid::new_v4().to_string();
            let quote = f.evidence_quote.clone().unwrap_or_default();
            conn.execute(
                "INSERT INTO review_findings (id, report_id, severity, category, title, description, evidence_quote, suggestion, status, created_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 'OPEN', ?9)",
                params![
                    &f_id,
                    &report_id,
                    &f.severity,
                    &f.category,
                    &f.title,
                    &f.description,
                    &quote,
                    &f.suggestion,
                    now
                ],
            )?;

            saved_findings.push(ReviewFinding {
                id: f_id,
                report_id: report_id.clone(),
                severity: f.severity.clone(),
                category: f.category.clone(),
                title: f.title.clone(),
                description: f.description.clone(),
                evidence_quote: quote,
                suggestion: f.suggestion.clone(),
                status: "OPEN".to_string(),
                created_at: now,
            });
        }

        Ok(ReviewReport {
            id: report_id,
            chapter_id: chapter_id.to_string(),
            version_number,
            score,
            summary: summary.to_string(),
            created_at: now,
            findings: saved_findings,
        })
    }

    pub fn list_review_reports(&self, chapter_id: &str) -> Result<Vec<ReviewReport>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(
            "SELECT id, chapter_id, version_number, score, summary, created_at
             FROM review_reports WHERE chapter_id = ?1 ORDER BY created_at DESC",
        )?;

        let rows = stmt.query_map(params![chapter_id], |row| {
            let r_id: String = row.get(0)?;
            Ok((
                r_id,
                row.get::<_, String>(1)?,
                row.get::<_, i64>(2)?,
                row.get::<_, i64>(3)?,
                row.get::<_, String>(4)?,
                row.get::<_, i64>(5)?,
            ))
        })?;

        let mut reports = Vec::new();
        let raw_reports: Vec<_> = rows.filter_map(|r| r.ok()).collect();

        for (r_id, ch_id, ver, score, summary, created_at) in raw_reports {
            let mut f_stmt = conn.prepare(
                "SELECT id, report_id, severity, category, title, description, evidence_quote, suggestion, status, created_at
                 FROM review_findings WHERE report_id = ?1 ORDER BY created_at ASC",
            )?;

            let f_rows = f_stmt.query_map(params![&r_id], |f_row| {
                Ok(ReviewFinding {
                    id: f_row.get(0)?,
                    report_id: f_row.get(1)?,
                    severity: f_row.get(2)?,
                    category: f_row.get(3)?,
                    title: f_row.get(4)?,
                    description: f_row.get(5)?,
                    evidence_quote: f_row.get(6)?,
                    suggestion: f_row.get(7)?,
                    status: f_row.get(8)?,
                    created_at: f_row.get(9)?,
                })
            })?;

            let findings = f_rows.filter_map(|f| f.ok()).collect();

            reports.push(ReviewReport {
                id: r_id,
                chapter_id: ch_id,
                version_number: ver,
                score,
                summary,
                created_at,
                findings,
            });
        }

        Ok(reports)
    }

    pub fn get_latest_review_report(&self, chapter_id: &str) -> Result<Option<ReviewReport>> {
        let reports = self.list_review_reports(chapter_id)?;
        Ok(reports.into_iter().next())
    }

    pub fn update_finding_status(&self, finding_id: &str, status: &str) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute(
            "UPDATE review_findings SET status = ?1 WHERE id = ?2",
            params![status, finding_id],
        )?;
        Ok(())
    }

    // --- PHASE 4: CANON FACTS & LAYERED MEMORY ---

    pub fn list_canon_facts(&self, novel_id: &str, query: Option<&str>) -> Result<Vec<CanonFact>> {
        let conn = self.conn.lock();
        if let Some(q) = query {
            let trimmed = q.trim();
            if !trimmed.is_empty() {
                let fts_res = conn.prepare(
                    "SELECT f.id, f.novel_id, f.subject_id, f.predicate, f.object_value, f.truth_scope, f.authority_level, f.status, f.effective_from, f.effective_until, f.source_chapter_id, f.version, f.created_at
                     FROM canon_facts f
                     JOIN canon_facts_fts ON canon_facts_fts.fact_id = f.id
                     WHERE f.novel_id = ?1 AND canon_facts_fts MATCH ?2
                     ORDER BY f.created_at DESC",
                );

                if let Ok(mut stmt) = fts_res {
                    let rows = stmt.query_map(params![novel_id, trimmed], |row| {
                        Ok(CanonFact {
                            id: row.get(0)?,
                            novel_id: row.get(1)?,
                            subject_id: row.get(2)?,
                            predicate: row.get(3)?,
                            object_value: row.get(4)?,
                            truth_scope: row.get(5)?,
                            authority_level: row.get(6)?,
                            status: row.get(7)?,
                            effective_from: row.get(8)?,
                            effective_until: row.get(9)?,
                            source_chapter_id: row.get(10)?,
                            version: row.get(11)?,
                            created_at: row.get(12)?,
                        })
                    })?;

                    let mut list = Vec::new();
                    for r in rows {
                        if let Ok(item) = r {
                            list.push(item);
                        }
                    }
                    if !list.is_empty() {
                        return Ok(list);
                    }
                }
            }
        }

        // Fallback or full list
        let mut stmt = conn.prepare(
            "SELECT id, novel_id, subject_id, predicate, object_value, truth_scope, authority_level, status, effective_from, effective_until, source_chapter_id, version, created_at
             FROM canon_facts WHERE novel_id = ?1 ORDER BY created_at DESC",
        )?;

        let rows = stmt.query_map(params![novel_id], |row| {
            Ok(CanonFact {
                id: row.get(0)?,
                novel_id: row.get(1)?,
                subject_id: row.get(2)?,
                predicate: row.get(3)?,
                object_value: row.get(4)?,
                truth_scope: row.get(5)?,
                authority_level: row.get(6)?,
                status: row.get(7)?,
                effective_from: row.get(8)?,
                effective_until: row.get(9)?,
                source_chapter_id: row.get(10)?,
                version: row.get(11)?,
                created_at: row.get(12)?,
            })
        })?;

        let mut list = Vec::new();
        for r in rows {
            list.push(r?);
        }
        Ok(list)
    }

    pub fn create_canon_fact(&self, input: CreateCanonFactInput) -> Result<CanonFact> {
        let conn = self.conn.lock();
        let id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now().timestamp_millis();
        let sub = input.subject_id.unwrap_or_default();
        let scope = input.truth_scope.unwrap_or_else(|| "GLOBAL".to_string());
        let authority = input.authority_level.unwrap_or_else(|| "CONFIRMED_PLOT".to_string());

        conn.execute(
            "INSERT INTO canon_facts (id, novel_id, subject_id, predicate, object_value, truth_scope, authority_level, status, source_chapter_id, version, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 'ACTIVE', ?8, 1, ?9)",
            params![
                &id,
                &input.novel_id,
                &sub,
                &input.predicate,
                &input.object_value,
                &scope,
                &authority,
                &input.source_chapter_id,
                now
            ],
        )?;

        let _ = conn.execute(
            "INSERT INTO canon_facts_fts (fact_id, novel_id, subject_id, predicate, object_value)
             VALUES (?1, ?2, ?3, ?4, ?5)",
            params![&id, &input.novel_id, &sub, &input.predicate, &input.object_value],
        );

        Ok(CanonFact {
            id,
            novel_id: input.novel_id,
            subject_id: sub,
            predicate: input.predicate,
            object_value: input.object_value,
            truth_scope: scope,
            authority_level: authority,
            status: "ACTIVE".to_string(),
            effective_from: "".to_string(),
            effective_until: "".to_string(),
            source_chapter_id: input.source_chapter_id,
            version: 1,
            created_at: now,
        })
    }

    pub fn delete_canon_fact(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute("DELETE FROM canon_facts WHERE id = ?1", params![id])?;
        let _ = conn.execute("DELETE FROM canon_facts_fts WHERE fact_id = ?1", params![id]);
        Ok(())
    }

    // --- CHARACTER DYNAMIC STATE EVENTS ---

    pub fn list_character_state_events(&self, character_id: &str) -> Result<Vec<CharacterStateEvent>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(
            "SELECT id, character_id, source_chapter_id, effective_time, field_name, previous_value, new_value, status, created_at
             FROM character_state_events WHERE character_id = ?1 ORDER BY created_at ASC",
        )?;

        let rows = stmt.query_map(params![character_id], |row| {
            Ok(CharacterStateEvent {
                id: row.get(0)?,
                character_id: row.get(1)?,
                source_chapter_id: row.get(2)?,
                effective_time: row.get(3)?,
                field_name: row.get(4)?,
                previous_value: row.get(5)?,
                new_value: row.get(6)?,
                status: row.get(7)?,
                created_at: row.get(8)?,
            })
        })?;

        let mut list = Vec::new();
        for r in rows {
            list.push(r?);
        }
        Ok(list)
    }

    pub fn create_character_state_event(&self, input: CreateCharacterStateEventInput) -> Result<CharacterStateEvent> {
        let conn = self.conn.lock();
        let id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now().timestamp_millis();
        let eff_time = input.effective_time.unwrap_or_default();
        let prev = input.previous_value.unwrap_or_default();

        conn.execute(
            "INSERT INTO character_state_events (id, character_id, source_chapter_id, effective_time, field_name, previous_value, new_value, status, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 'CONFIRMED', ?8)",
            params![
                &id,
                &input.character_id,
                &input.source_chapter_id,
                &eff_time,
                &input.field_name,
                &prev,
                &input.new_value,
                now
            ],
        )?;

        Ok(CharacterStateEvent {
            id,
            character_id: input.character_id,
            source_chapter_id: input.source_chapter_id,
            effective_time: eff_time,
            field_name: input.field_name,
            previous_value: prev,
            new_value: input.new_value,
            status: "CONFIRMED".to_string(),
            created_at: now,
        })
    }

    // --- FTS5 CHAPTERS SEARCH ---

    pub fn search_chapters_fts(&self, novel_id: &str, query: &str) -> Result<Vec<(String, String, String)>> {
        let conn = self.conn.lock();
        let trimmed = query.trim();
        if trimmed.is_empty() {
            return Ok(Vec::new());
        }

        let mut stmt = conn.prepare(
            "SELECT chapter_id, title, snippet(chapters_fts, 3, '【', '】', '...', 15)
             FROM chapters_fts
             WHERE novel_id = ?1 AND chapters_fts MATCH ?2
             LIMIT 5",
        )?;

        let rows = stmt.query_map(params![novel_id, trimmed], |row| {
            Ok((row.get(0)?, row.get(1)?, row.get(2)?))
        })?;

        let mut results = Vec::new();
        for r in rows {
            if let Ok(item) = r {
                results.push(item);
            }
        }
        Ok(results)
    }

    // --- FIVE-LAYER MEMORY CONTEXT PACK ASSEMBLER ---

    pub fn assemble_memory_context_pack(
        &self,
        novel_id: &str,
        chapter_id: &str,
        prompt_intent: &str,
        target_character_ids: Option<&[String]>,
    ) -> Result<MemoryContextPack> {
        let novel = self.get_novel(novel_id)?;
        let current_chapter = self.get_chapter(chapter_id)?;
        let all_characters = self.list_characters(novel_id).unwrap_or_default();
        let world_rules = self.list_world_rules(novel_id).unwrap_or_default();
        let canon_facts = self.list_canon_facts(novel_id, None).unwrap_or_default();
        let story_arcs = self.list_story_arcs(novel_id).unwrap_or_default();
        let phases = self.list_story_phases(novel_id).unwrap_or_default();
        let chapters = self.list_chapters(novel_id).unwrap_or_default();

        // 1. L0: Working Memory
        let l0 = format!(
            "当前创作目标：第 {} 章《{}》\n创作意图指令：{}",
            current_chapter.chapter_number, current_chapter.title, prompt_intent
        );

        // 2. L1: Short-term Narrative Memory (Previous 1~2 chapters summary or tail)
        let mut l1 = Vec::new();
        let prev_chapters: Vec<_> = chapters
            .iter()
            .filter(|c| c.chapter_number < current_chapter.chapter_number)
            .collect();

        if let Some(prev) = prev_chapters.last() {
            if let Some(content) = prev.content.as_ref() {
                let tail: String = content.chars().rev().take(600).collect::<Vec<_>>().into_iter().rev().collect();
                l1.push(format!("前一章《{}》衔接线索：\n……{}", prev.title, tail));
            }
        }

        // Active characters recent state events
        for char in all_characters.iter().take(4) {
            if let Ok(events) = self.list_character_state_events(&char.id) {
                if let Some(latest) = events.last() {
                    l1.push(format!("{}: 最新状态[{}] -> {}", char.name, latest.field_name, latest.new_value));
                }
            }
        }

        // 3. L2: Arc Memory (Active Story Arcs & Phases)
        let mut l2 = Vec::new();
        if let Some(active_phase) = phases.first() {
            l2.push(format!("当前所处大纲阶段：【{}】(战略目标: {})", active_phase.title, active_phase.goal));
        }
        for arc in story_arcs.iter().filter(|a| a.status == "DEVELOPING").take(2) {
            l2.push(format!("当前推进中剧情弧：【{}】(冲突焦点: {})", arc.title, arc.goal));
        }

        // 4. L3: Long-term Canon Memory (World rules & character core profiles & facts)
        let mut l3_rules = Vec::new();
        for r in world_rules.iter().filter(|r| r.authority_level == "CANON").take(5) {
            l3_rules.push(format!("{}: {}", r.title, r.rule_content));
        }

        let mut l3_profiles = Vec::new();
        let filter_ids = target_character_ids.unwrap_or(&[]);
        for char in all_characters.iter() {
            if filter_ids.is_empty() || filter_ids.contains(&char.id) {
                l3_profiles.push(format!(
                    "{} (别名:{}): 性格[{}], 动机[{}], 背景[{}]",
                    char.name, char.aliases, char.personality, char.motivation, char.background
                ));
            }
        }

        // 5. L4: Retrieval Memory (FTS5 search for prompt keywords)
        let mut l4 = Vec::new();
        let query_sample = prompt_intent.chars().take(20).collect::<String>();
        if let Ok(snippets) = self.search_chapters_fts(novel_id, &query_sample) {
            for (ch_id, title, snippet) in snippets {
                if ch_id != current_chapter.id {
                    l4.push(format!("历史章节《{}》相关记录: {}", title, snippet));
                }
            }
        }

        for fact in canon_facts.iter().take(5) {
            l4.push(format!("因果事实：【{}】{}【{}】", fact.subject_id, fact.predicate, fact.object_value));
        }

        // Assemble unified system prompt
        let mut prompt = format!(
            "你是 NovelForge AI 专业长篇小说创作系统的核心叙事 Agent。\n\
             作品名：《{}》，题材：{}，文风：{}\n\
             【系统长期记忆引擎 (L0~L4 Context Pack)】已装载：\n\n",
            novel.title, novel.genre_profile, novel.writing_style
        );

        prompt.push_str("=== [L3 长期权威法则与人物档案] ===\n");
        for rule in &l3_rules {
            prompt.push_str(&format!("- [Canon 法则] {}\n", rule));
        }
        for prof in &l3_profiles {
            prompt.push_str(&format!("- [人物档案] {}\n", prof));
        }
        prompt.push('\n');

        if !l2.is_empty() {
            prompt.push_str("=== [L2 中期剧情弧与阶段目标] ===\n");
            for arc in &l2 {
                prompt.push_str(&format!("- {}\n", arc));
            }
            prompt.push('\n');
        }

        if !l1.is_empty() {
            prompt.push_str("=== [L1 近期剧情脉络与人物动态] ===\n");
            for item in &l1 {
                prompt.push_str(&format!("- {}\n", item));
            }
            prompt.push('\n');
        }

        if !l4.is_empty() {
            prompt.push_str("=== [L4 历史因果与检索事实] ===\n");
            for item in &l4 {
                prompt.push_str(&format!("- {}\n", item));
            }
            prompt.push('\n');
        }

        prompt.push_str("=== [L0 当前工作任务目标] ===\n");
        prompt.push_str(&l0);
        prompt.push_str("\n\n【创作准则】：严格遵守权威世界观法则与人物已知动态，前后呼应，严禁前后矛盾与降智冲突。");

        Ok(MemoryContextPack {
            working_memory_l0: l0,
            short_term_l1: l1,
            arc_memory_l2: l2,
            canon_rules_l3: l3_rules,
            character_profiles_l3: l3_profiles,
            retrieved_history_l4: l4,
            assembled_system_prompt: prompt,
        })
    }

    // --- PHASE 5: SERIALIZATION JOBS ---

    pub fn create_serialization_job(
        &self,
        novel_id: &str,
        target_chapters_count: i64,
        auto_approve: bool,
        budget_tokens: i64,
        config: &str,
    ) -> Result<SerializationJob> {
        let conn = self.conn.lock();
        let id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now().timestamp_millis();
        let auto_int = if auto_approve { 1 } else { 0 };

        conn.execute(
            "INSERT INTO serialization_jobs (id, novel_id, status, target_chapters_count, completed_chapters_count, auto_approve, budget_tokens, used_tokens, config, created_at, updated_at)
             VALUES (?1, ?2, 'PENDING', ?3, 0, ?4, ?5, 0, ?6, ?7, ?8)",
            params![
                &id,
                novel_id,
                target_chapters_count,
                auto_int,
                budget_tokens,
                config,
                now,
                now
            ],
        )?;

        Ok(SerializationJob {
            id,
            novel_id: novel_id.to_string(),
            status: "PENDING".to_string(),
            target_chapters_count,
            completed_chapters_count: 0,
            current_chapter_id: None,
            auto_approve,
            budget_tokens,
            used_tokens: 0,
            config: config.to_string(),
            error_message: None,
            created_at: now,
            updated_at: now,
        })
    }

    pub fn get_serialization_job(&self, job_id: &str) -> Result<SerializationJob> {
        let conn = self.conn.lock();
        conn.query_row(
            "SELECT id, novel_id, status, target_chapters_count, completed_chapters_count, current_chapter_id, auto_approve, budget_tokens, used_tokens, config, error_message, created_at, updated_at
             FROM serialization_jobs WHERE id = ?1",
            params![job_id],
            |row| {
                let auto_int: i64 = row.get(6)?;
                Ok(SerializationJob {
                    id: row.get(0)?,
                    novel_id: row.get(1)?,
                    status: row.get(2)?,
                    target_chapters_count: row.get(3)?,
                    completed_chapters_count: row.get(4)?,
                    current_chapter_id: row.get(5)?,
                    auto_approve: auto_int == 1,
                    budget_tokens: row.get(7)?,
                    used_tokens: row.get(8)?,
                    config: row.get(9)?,
                    error_message: row.get(10)?,
                    created_at: row.get(11)?,
                    updated_at: row.get(12)?,
                })
            },
        )
    }

    pub fn update_serialization_job_progress(
        &self,
        job_id: &str,
        completed_chapters: i64,
        current_chapter_id: Option<&str>,
        used_tokens: i64,
        status: &str,
        error_message: Option<&str>,
    ) -> Result<()> {
        let conn = self.conn.lock();
        let now = chrono::Utc::now().timestamp_millis();
        conn.execute(
            "UPDATE serialization_jobs
             SET completed_chapters_count = ?1, current_chapter_id = ?2, used_tokens = ?3, status = ?4, error_message = ?5, updated_at = ?6
             WHERE id = ?7",
            params![
                completed_chapters,
                current_chapter_id,
                used_tokens,
                status,
                error_message,
                now,
                job_id
            ],
        )?;
        Ok(())
    }

    pub fn list_serialization_jobs(&self, novel_id: &str) -> Result<Vec<SerializationJob>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(
            "SELECT id, novel_id, status, target_chapters_count, completed_chapters_count, current_chapter_id, auto_approve, budget_tokens, used_tokens, config, error_message, created_at, updated_at
             FROM serialization_jobs WHERE novel_id = ?1 ORDER BY created_at DESC",
        )?;

        let rows = stmt.query_map(params![novel_id], |row| {
            let auto_int: i64 = row.get(6)?;
            Ok(SerializationJob {
                id: row.get(0)?,
                novel_id: row.get(1)?,
                status: row.get(2)?,
                target_chapters_count: row.get(3)?,
                completed_chapters_count: row.get(4)?,
                current_chapter_id: row.get(5)?,
                auto_approve: auto_int == 1,
                budget_tokens: row.get(7)?,
                used_tokens: row.get(8)?,
                config: row.get(9)?,
                error_message: row.get(10)?,
                created_at: row.get(11)?,
                updated_at: row.get(12)?,
            })
        })?;

        let mut list = Vec::new();
        for r in rows {
            list.push(r?);
        }
        Ok(list)
    }

    // --- PHASE 6 & 7: PUBLISHING & DIAGNOSTICS METHODS ---

    pub fn backup_database(&self) -> Result<String> {
        let conn = self.conn.lock();
        let backup_dir = self.db_path.parent().unwrap_or(std::path::Path::new(".")).join("backups");
        let _ = std::fs::create_dir_all(&backup_dir);
        let timestamp = chrono::Utc::now().format("%Y%m%d_%H%M%S");
        let backup_path = backup_dir.join(format!("novelforge_backup_{}.db", timestamp));

        let mut dst = Connection::open(&backup_path)?;
        let backup = rusqlite::backup::Backup::new(&conn, &mut dst)?;
        backup.run_to_completion(5, std::time::Duration::from_millis(100), None)?;

        Ok(backup_path.to_string_lossy().to_string())
    }

    pub fn optimize_database(&self) -> Result<DatabaseHealthReport> {
        let conn = self.conn.lock();
        
        // 1. Run integrity check
        let integrity: String = conn.query_row("PRAGMA integrity_check", [], |r| r.get(0)).unwrap_or_else(|_| "ok".to_string());

        // 2. Run WAL checkpoint to truncate journal
        let wal_status: String = conn.query_row("PRAGMA wal_checkpoint(TRUNCATE)", [], |r| {
            let busy: i64 = r.get(0)?;
            let log: i64 = r.get(1)?;
            let checkpointed: i64 = r.get(2)?;
            Ok(format!("busy={}, log={}, checkpointed={}", busy, log, checkpointed))
        }).unwrap_or_else(|_| "checkpointed".to_string());

        // 3. Optimize tables
        let _ = conn.execute_batch("PRAGMA optimize;");

        // 4. Gather counts
        let total_novels: i64 = conn.query_row("SELECT COUNT(*) FROM novels", [], |r| r.get(0)).unwrap_or(0);
        let total_chapters: i64 = conn.query_row("SELECT COUNT(*) FROM chapters", [], |r| r.get(0)).unwrap_or(0);
        let total_versions: i64 = conn.query_row("SELECT COUNT(*) FROM chapter_versions", [], |r| r.get(0)).unwrap_or(0);
        let total_characters: i64 = conn.query_row("SELECT COUNT(*) FROM characters", [], |r| r.get(0)).unwrap_or(0);
        let total_world_rules: i64 = conn.query_row("SELECT COUNT(*) FROM world_rules", [], |r| r.get(0)).unwrap_or(0);
        let total_canon_facts: i64 = conn.query_row("SELECT COUNT(*) FROM canon_facts", [], |r| r.get(0)).unwrap_or(0);

        let db_size = std::fs::metadata(&self.db_path).map(|m| m.len()).unwrap_or(0);

        Ok(DatabaseHealthReport {
            db_path: self.db_path.to_string_lossy().to_string(),
            db_size_bytes: db_size,
            integrity_status: integrity,
            wal_checkpoint: wal_status,
            total_novels,
            total_chapters,
            total_versions,
            total_characters,
            total_world_rules,
            total_canon_facts,
        })
    }

    pub fn export_novel_html_book(&self, novel_id: &str) -> Result<String> {
        let novel = self.get_novel(novel_id)?;
        let chapters = self.list_chapters(novel_id)?;

        let mut nav_items = String::new();
        let mut chapter_articles = String::new();

        for ch in chapters {
            let ch_content = ch.content.unwrap_or_default();
            let paragraphs: Vec<String> = ch_content
                .lines()
                .filter(|line| !line.trim().is_empty())
                .map(|line| format!("<p>{}</p>", html_escape(line.trim())))
                .collect();
            let formatted_body = paragraphs.join("\n");

            nav_items.push_str(&format!(
                r##"<li><a href="#ch-{}">第 {} 章 {}</a></li>"##,
                ch.id, ch.chapter_number, html_escape(&ch.title)
            ));

            chapter_articles.push_str(&format!(
                r#"<article class="chapter" id="ch-{}">
                    <header class="chapter-header">
                        <span class="chapter-num">第 {} 章</span>
                        <h2>{}</h2>
                        <span class="chapter-meta">{} 字</span>
                    </header>
                    <div class="chapter-body">
                        {}
                    </div>
                </article>"#,
                ch.id, ch.chapter_number, html_escape(&ch.title), ch.word_count, formatted_body
            ));
        }

        let html = format!(
            r#"<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>《{}》 - NovelForge AI 电子书</title>
    <style>
        :root {{
            --bg-color: #faf8f5;
            --text-color: #2b2b2b;
            --sidebar-bg: #f3efe9;
            --border-color: #e2dbce;
            --accent: #4f46e5;
            --font-serif: "Source Han Serif SC", "Noto Serif CJK SC", "Songti SC", "SimSun", serif;
            --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
        }}
        [data-theme="dark"] {{
            --bg-color: #12141a;
            --text-color: #d1d5db;
            --sidebar-bg: #181b22;
            --border-color: #262b36;
            --accent: #818cf8;
        }}
        [data-theme="parchment"] {{
            --bg-color: #f4ecd8;
            --text-color: #3f3123;
            --sidebar-bg: #ebe0c6;
            --border-color: #d8cbb0;
            --accent: #92400e;
        }}
        * {{ box-sizing: border-box; margin: 0; padding: 0; }}
        body {{
            background: var(--bg-color);
            color: var(--text-color);
            font-family: var(--font-serif);
            font-size: 18px;
            line-height: 1.85;
            display: flex;
            min-height: 100vh;
            transition: background 0.25s, color 0.25s;
        }}
        aside.sidebar {{
            width: 320px;
            background: var(--sidebar-bg);
            border-right: 1px solid var(--border-color);
            padding: 24px;
            position: sticky;
            top: 0;
            height: 100vh;
            overflow-y: auto;
            flex-shrink: 0;
            font-family: var(--font-sans);
        }}
        .book-title {{ font-size: 1.25rem; font-weight: bold; margin-bottom: 6px; }}
        .book-meta {{ font-size: 0.85rem; color: #6b7280; margin-bottom: 16px; line-height: 1.5; }}
        .theme-buttons {{ display: flex; gap: 8px; margin-bottom: 20px; }}
        .theme-btn {{ padding: 4px 10px; font-size: 0.8rem; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-color); color: var(--text-color); cursor: pointer; }}
        .nav-list {{ list-style: none; }}
        .nav-list li {{ margin-bottom: 8px; }}
        .nav-list a {{ color: var(--text-color); text-decoration: none; font-size: 0.9rem; opacity: 0.85; transition: 0.2s; }}
        .nav-list a:hover {{ color: var(--accent); opacity: 1; }}
        main.content {{
            flex: 1;
            max-width: 820px;
            margin: 0 auto;
            padding: 48px 32px 120px;
        }}
        .book-header {{ text-align: center; margin-bottom: 60px; padding-bottom: 40px; border-bottom: 1px solid var(--border-color); }}
        .book-header h1 {{ font-size: 2.4rem; margin-bottom: 12px; font-family: var(--font-serif); }}
        .book-desc {{ font-size: 1rem; color: #6b7280; max-width: 600px; margin: 0 auto; font-style: italic; }}
        article.chapter {{ margin-bottom: 80px; padding-bottom: 40px; border-bottom: 1px dashed var(--border-color); }}
        .chapter-header {{ text-align: center; margin-bottom: 32px; }}
        .chapter-num {{ font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; color: var(--accent); font-family: var(--font-sans); }}
        .chapter-header h2 {{ font-size: 1.8rem; margin: 8px 0; }}
        .chapter-meta {{ font-size: 0.8rem; color: #9ca3af; font-family: var(--font-sans); }}
        .chapter-body p {{
            text-indent: 2em;
            margin-bottom: 1.4em;
            text-align: justify;
        }}
        @media (max-width: 768px) {{
            body {{ flex-direction: column; }}
            aside.sidebar {{ width: 100%; height: auto; position: relative; }}
            main.content {{ padding: 24px 16px; }}
        }}
    </style>
</head>
<body>
    <aside class="sidebar">
        <div class="book-title">《{}》</div>
        <div class="book-meta">类型：{} | 章节数：{}</div>
        <div class="theme-buttons">
            <button class="theme-btn" onclick="document.body.removeAttribute('data-theme')">明亮</button>
            <button class="theme-btn" onclick="document.body.setAttribute('data-theme', 'dark')">深邃</button>
            <button class="theme-btn" onclick="document.body.setAttribute('data-theme', 'parchment')">羊皮纸</button>
        </div>
        <hr style="border:0; border-top:1px solid var(--border-color); margin-bottom: 16px;" />
        <ul class="nav-list">
            {}
        </ul>
    </aside>
    <main class="content">
        <header class="book-header">
            <h1>《{}》</h1>
            <p class="book-desc">{}</p>
        </header>
        {}
    </main>
</body>
</html>"#,
            html_escape(&novel.title),
            html_escape(&novel.title),
            html_escape(&novel.genre_profile),
            novel.chapter_count.unwrap_or(0),
            nav_items,
            html_escape(&novel.title),
            html_escape(&novel.description),
            chapter_articles
        );

        Ok(html)
    }

    pub fn export_novel_archive(&self, novel_id: &str) -> Result<String> {
        let novel = self.get_novel(novel_id)?;
        let chapters = self.list_chapters(novel_id)?;
        let characters = self.list_characters(novel_id)?;
        let character_relationships = self.list_character_relationships(novel_id)?;
        let world_rules = self.list_world_rules(novel_id)?;
        let canon_facts = self.list_canon_facts(novel_id, None)?;
        let plot_threads = self.list_plot_threads(novel_id)?;
        let story_phases = self.list_story_phases(novel_id)?;
        let story_arcs = self.list_story_arcs(novel_id)?;

        let mut character_states = Vec::new();
        for c in &characters {
            if let Ok(events) = self.list_character_state_events(&c.id) {
                character_states.extend(events);
            }
        }

        let archive = NovelArchive {
            novel,
            chapters,
            characters,
            character_relationships,
            character_states,
            world_rules,
            canon_facts,
            plot_threads,
            story_phases,
            story_arcs,
            exported_at: chrono::Utc::now().timestamp(),
            version: "2.0".to_string(),
        };

        let json = serde_json::to_string_pretty(&archive)
            .map_err(|e| rusqlite::Error::ToSqlConversionFailure(Box::new(e)))?;
        Ok(json)
    }

    pub fn import_novel_archive(&self, archive_json: &str) -> Result<Novel> {
        let archive: NovelArchive = serde_json::from_str(archive_json)
            .map_err(|e| rusqlite::Error::ToSqlConversionFailure(Box::new(e)))?;

        let novel_input = CreateNovelInput {
            title: format!("{} (导入副本)", archive.novel.title),
            description: Some(archive.novel.description),
            genre_profile: Some(archive.novel.genre_profile),
            language: Some(archive.novel.language),
            writing_style: Some(archive.novel.writing_style),
            chapter_target_length: None,
            series_id: None,
            hierarchy_config: None,
        };

        let new_novel = self.create_novel(novel_input)?;

        // Import characters
        for c in archive.characters {
            let _ = self.create_character(CreateCharacterInput {
                novel_id: new_novel.id.clone(),
                name: c.name,
                aliases: Some(c.aliases),
                profile: Some(c.profile),
                personality: Some(c.personality),
                background: Some(c.background),
                motivation: Some(c.motivation),
            });
        }

        // Import chapters
        for ch in archive.chapters {
            let _ = self.create_chapter(CreateChapterInput {
                novel_id: new_novel.id.clone(),
                part_id: None,
                volume_id: None,
                chapter_number: Some(ch.chapter_number),
                order_index: ch.order_index,
                title: ch.title,
                chapter_goal: ch.chapter_goal,
                initial_content: ch.content,
            });
        }

        // Import world rules
        for r in archive.world_rules {
            let _ = self.create_world_rule(CreateWorldRuleInput {
                novel_id: new_novel.id.clone(),
                title: r.title,
                rule_content: r.rule_content,
                authority_level: Some(r.authority_level),
            });
        }

        // Import canon facts
        for f in archive.canon_facts {
            let _ = self.create_canon_fact(CreateCanonFactInput {
                novel_id: new_novel.id.clone(),
                subject_id: Some(f.subject_id),
                predicate: f.predicate,
                object_value: f.object_value,
                truth_scope: Some(f.truth_scope),
                authority_level: Some(f.authority_level),
                source_chapter_id: None,
            });
        }

        Ok(new_novel)
    }

    // ==========================================
    // V2.0 MULTI-LEVEL HIERARCHY & PLOT SYSTEM
    // ==========================================

    // --- SERIES / UNIVERSE (系列 / 宇宙) ---

    pub fn create_series(&self, input: CreateSeriesInput) -> Result<Series> {
        let conn = self.conn.lock();
        let id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now().timestamp_millis();
        let desc = input.description.unwrap_or_default();
        let genre = input.genre_profile.unwrap_or_default();
        let world_def = input.world_definition.unwrap_or_default();

        conn.execute(
            "INSERT INTO series (id, title, description, genre_profile, world_definition, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![&id, &input.title, &desc, &genre, &world_def, now, now],
        )?;

        Ok(Series {
            id,
            title: input.title,
            description: desc,
            genre_profile: genre,
            world_definition: world_def,
            created_at: now,
            updated_at: now,
        })
    }

    pub fn list_series(&self) -> Result<Vec<Series>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(
            "SELECT id, title, description, genre_profile, world_definition, created_at, updated_at
             FROM series ORDER BY updated_at DESC",
        )?;
        let rows = stmt.query_map([], |row| {
            Ok(Series {
                id: row.get(0)?,
                title: row.get(1)?,
                description: row.get(2)?,
                genre_profile: row.get(3)?,
                world_definition: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        })?;
        let mut list = Vec::new();
        for r in rows {
            list.push(r?);
        }
        Ok(list)
    }

    pub fn get_series(&self, id: &str) -> Result<Series> {
        let conn = self.conn.lock();
        conn.query_row(
            "SELECT id, title, description, genre_profile, world_definition, created_at, updated_at
             FROM series WHERE id = ?1",
            params![id],
            |row| {
                Ok(Series {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    description: row.get(2)?,
                    genre_profile: row.get(3)?,
                    world_definition: row.get(4)?,
                    created_at: row.get(5)?,
                    updated_at: row.get(6)?,
                })
            },
        )
    }

    pub fn delete_series(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock();
        let _ = conn.execute("UPDATE novels SET series_id = NULL WHERE series_id = ?1", params![id]);
        conn.execute("DELETE FROM series WHERE id = ?1", params![id])?;
        Ok(())
    }

    // --- PARTS (部 / 篇) ---

    pub fn create_part(&self, input: CreatePartInput) -> Result<Part> {
        let conn = self.conn.lock();
        let id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now().timestamp_millis();
        let summary = input.summary.unwrap_or_default();
        let order_index = input.order_index.unwrap_or_else(|| {
            let max_idx: Option<i64> = conn
                .query_row(
                    "SELECT MAX(order_index) FROM parts WHERE novel_id = ?1",
                    params![&input.novel_id],
                    |r| r.get(0),
                )
                .ok();
            max_idx.unwrap_or(0) + 1
        });
        let part_number = input.part_number.unwrap_or(order_index);

        conn.execute(
            "INSERT INTO parts (id, novel_id, part_number, title, summary, order_index, status, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'ACTIVE', ?7, ?8)",
            params![&id, &input.novel_id, part_number, &input.title, &summary, order_index, now, now],
        )?;

        Ok(Part {
            id,
            novel_id: input.novel_id,
            part_number,
            title: input.title,
            summary,
            order_index,
            status: "ACTIVE".to_string(),
            created_at: now,
            updated_at: now,
        })
    }

    pub fn list_parts(&self, novel_id: &str) -> Result<Vec<Part>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(
            "SELECT id, novel_id, part_number, title, summary, order_index, status, created_at, updated_at
             FROM parts WHERE novel_id = ?1 ORDER BY order_index ASC",
        )?;
        let rows = stmt.query_map(params![novel_id], |row| {
            Ok(Part {
                id: row.get(0)?,
                novel_id: row.get(1)?,
                part_number: row.get(2)?,
                title: row.get(3)?,
                summary: row.get(4)?,
                order_index: row.get(5)?,
                status: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })?;
        let mut list = Vec::new();
        for r in rows {
            list.push(r?);
        }
        Ok(list)
    }

    pub fn get_part(&self, id: &str) -> Result<Part> {
        let conn = self.conn.lock();
        conn.query_row(
            "SELECT id, novel_id, part_number, title, summary, order_index, status, created_at, updated_at
             FROM parts WHERE id = ?1",
            params![id],
            |row| {
                Ok(Part {
                    id: row.get(0)?,
                    novel_id: row.get(1)?,
                    part_number: row.get(2)?,
                    title: row.get(3)?,
                    summary: row.get(4)?,
                    order_index: row.get(5)?,
                    status: row.get(6)?,
                    created_at: row.get(7)?,
                    updated_at: row.get(8)?,
                })
            },
        )
    }

    pub fn delete_part(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute("DELETE FROM parts WHERE id = ?1", params![id])?;
        Ok(())
    }

    // --- HIERARCHY CONFIGURATION ---

    pub fn get_novel_hierarchy_config(&self, novel_id: &str) -> Result<HierarchyConfig> {
        let conn = self.conn.lock();
        let raw: Option<String> = conn
            .query_row(
                "SELECT hierarchy_config FROM novels WHERE id = ?1",
                params![novel_id],
                |r| r.get(0),
            )
            .unwrap_or(None);

        if let Some(s) = raw {
            if let Ok(cfg) = serde_json::from_str::<HierarchyConfig>(&s) {
                return Ok(cfg);
            }
        }
        Ok(HierarchyConfig::default())
    }

    pub fn update_novel_hierarchy_config(&self, novel_id: &str, config: HierarchyConfig) -> Result<HierarchyConfig> {
        let conn = self.conn.lock();
        let s = serde_json::to_string(&config).unwrap_or_default();
        let now = chrono::Utc::now().timestamp_millis();
        conn.execute(
            "UPDATE novels SET hierarchy_config = ?1, updated_at = ?2 WHERE id = ?3",
            params![&s, now, novel_id],
        )?;
        Ok(config)
    }

    // --- VOLUMES (CREATE & DELETE) ---

    pub fn create_volume(&self, input: CreateVolumeInput) -> Result<Volume> {
        let conn = self.conn.lock();
        let id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now().timestamp_millis();
        let summary = input.summary.unwrap_or_default();
        let order_index = input.order_index.unwrap_or_else(|| {
            let max_idx: Option<i64> = conn
                .query_row(
                    "SELECT MAX(order_index) FROM volumes WHERE novel_id = ?1",
                    params![&input.novel_id],
                    |r| r.get(0),
                )
                .ok();
            max_idx.unwrap_or(0) + 1
        });

        conn.execute(
            "INSERT INTO volumes (id, novel_id, part_id, title, order_index, summary, status, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'PLANNING', ?7)",
            params![&id, &input.novel_id, &input.part_id, &input.title, order_index, &summary, now],
        )?;

        Ok(Volume {
            id,
            novel_id: input.novel_id,
            part_id: input.part_id,
            title: input.title,
            order_index,
            summary,
            status: "PLANNING".to_string(),
            created_at: now,
        })
    }

    pub fn delete_volume(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock();
        let _ = conn.execute("UPDATE chapters SET volume_id = NULL WHERE volume_id = ?1", params![id]);
        conn.execute("DELETE FROM volumes WHERE id = ?1", params![id])?;
        Ok(())
    }

    // --- PLOT BEATS (情节节拍) ---

    pub fn create_plot_beat(&self, input: CreatePlotBeatInput) -> Result<PlotBeat> {
        let conn = self.conn.lock();
        let id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now().timestamp_millis();
        let order_index = input.order_index.unwrap_or_else(|| {
            let max_idx: Option<i64> = conn
                .query_row(
                    "SELECT MAX(order_index) FROM plot_beats WHERE scene_id = ?1",
                    params![&input.scene_id],
                    |r| r.get(0),
                )
                .ok();
            max_idx.unwrap_or(0) + 1
        });
        let beat_number = input.beat_number.unwrap_or(order_index);
        let beat_type = input.beat_type.unwrap_or_else(|| "ACTION".to_string());
        let desc = input.description.unwrap_or_default();
        let emotional_shift = input.emotional_shift.unwrap_or_default();
        let characters_present = input.characters_present.unwrap_or_default();

        conn.execute(
            "INSERT INTO plot_beats (id, scene_id, beat_number, beat_type, title, description, emotional_shift, characters_present, order_index, status, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, 'PENDING', ?10)",
            params![&id, &input.scene_id, beat_number, &beat_type, &input.title, &desc, &emotional_shift, &characters_present, order_index, now],
        )?;

        Ok(PlotBeat {
            id,
            scene_id: input.scene_id,
            beat_number,
            beat_type,
            title: input.title,
            description: desc,
            emotional_shift,
            characters_present,
            order_index,
            status: "PENDING".to_string(),
            created_at: now,
        })
    }

    pub fn list_plot_beats(&self, scene_id: &str) -> Result<Vec<PlotBeat>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(
            "SELECT id, scene_id, beat_number, beat_type, title, description, emotional_shift, characters_present, order_index, status, created_at
             FROM plot_beats WHERE scene_id = ?1 ORDER BY order_index ASC, beat_number ASC",
        )?;
        let rows = stmt.query_map(params![scene_id], |row| {
            Ok(PlotBeat {
                id: row.get(0)?,
                scene_id: row.get(1)?,
                beat_number: row.get(2)?,
                beat_type: row.get(3)?,
                title: row.get(4)?,
                description: row.get(5)?,
                emotional_shift: row.get(6)?,
                characters_present: row.get(7)?,
                order_index: row.get(8)?,
                status: row.get(9)?,
                created_at: row.get(10)?,
            })
        })?;
        let mut list = Vec::new();
        for r in rows {
            list.push(r?);
        }
        Ok(list)
    }

    pub fn update_plot_beat_status(&self, id: &str, status: &str) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute("UPDATE plot_beats SET status = ?1 WHERE id = ?2", params![status, id])?;
        Ok(())
    }

    pub fn delete_plot_beat(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute("DELETE FROM plot_beats WHERE id = ?1", params![id])?;
        Ok(())
    }

    // --- CHARACTER ARCS (人物成长弧) ---

    pub fn create_character_arc(&self, input: CreateCharacterArcInput) -> Result<CharacterArc> {
        let conn = self.conn.lock();
        let id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now().timestamp_millis();
        let stage_from = input.stage_from.unwrap_or_default();
        let stage_to = input.stage_to.unwrap_or_default();
        let current_stage = input.current_stage.unwrap_or_else(|| stage_from.clone());
        let internal_conflict = input.internal_conflict.unwrap_or_default();

        conn.execute(
            "INSERT INTO character_arcs (id, novel_id, character_id, title, stage_from, stage_to, current_stage, internal_conflict, status, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 'DEVELOPING', ?9, ?10)",
            params![&id, &input.novel_id, &input.character_id, &input.title, &stage_from, &stage_to, &current_stage, &internal_conflict, now, now],
        )?;

        Ok(CharacterArc {
            id,
            novel_id: input.novel_id,
            character_id: input.character_id,
            title: input.title,
            stage_from,
            stage_to,
            current_stage,
            internal_conflict,
            status: "DEVELOPING".to_string(),
            created_at: now,
            updated_at: now,
        })
    }

    pub fn list_character_arcs(&self, novel_id: &str) -> Result<Vec<CharacterArc>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(
            "SELECT id, novel_id, character_id, title, stage_from, stage_to, current_stage, internal_conflict, status, created_at, updated_at
             FROM character_arcs WHERE novel_id = ?1 ORDER BY created_at ASC",
        )?;
        let rows = stmt.query_map(params![novel_id], |row| {
            Ok(CharacterArc {
                id: row.get(0)?,
                novel_id: row.get(1)?,
                character_id: row.get(2)?,
                title: row.get(3)?,
                stage_from: row.get(4)?,
                stage_to: row.get(5)?,
                current_stage: row.get(6)?,
                internal_conflict: row.get(7)?,
                status: row.get(8)?,
                created_at: row.get(9)?,
                updated_at: row.get(10)?,
            })
        })?;
        let mut list = Vec::new();
        for r in rows {
            list.push(r?);
        }
        Ok(list)
    }

    pub fn update_character_arc_stage(&self, id: &str, current_stage: &str, status: &str) -> Result<()> {
        let conn = self.conn.lock();
        let now = chrono::Utc::now().timestamp_millis();
        conn.execute(
            "UPDATE character_arcs SET current_stage = ?1, status = ?2, updated_at = ?3 WHERE id = ?4",
            params![current_stage, status, now, id],
        )?;
        Ok(())
    }

    pub fn delete_character_arc(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute("DELETE FROM character_arcs WHERE id = ?1", params![id])?;
        Ok(())
    }

    // --- PARALLEL NARRATIVE THREADS (并行叙事线) ---

    pub fn create_parallel_thread(&self, input: CreateParallelThreadInput) -> Result<ParallelThread> {
        let conn = self.conn.lock();
        let id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now().timestamp_millis();
        let color = input.thread_color.unwrap_or_else(|| "#854d0e".to_string());
        let summary = input.summary.unwrap_or_default();
        let convergence = input.convergence_target.unwrap_or_default();

        conn.execute(
            "INSERT INTO parallel_threads (id, novel_id, title, pov_character_id, thread_color, summary, convergence_target, status, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 'ACTIVE', ?8, ?9)",
            params![&id, &input.novel_id, &input.title, &input.pov_character_id, &color, &summary, &convergence, now, now],
        )?;

        Ok(ParallelThread {
            id,
            novel_id: input.novel_id,
            title: input.title,
            pov_character_id: input.pov_character_id,
            thread_color: color,
            summary,
            convergence_target: convergence,
            status: "ACTIVE".to_string(),
            created_at: now,
            updated_at: now,
        })
    }

    pub fn list_parallel_threads(&self, novel_id: &str) -> Result<Vec<ParallelThread>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(
            "SELECT id, novel_id, title, pov_character_id, thread_color, summary, convergence_target, status, created_at, updated_at
             FROM parallel_threads WHERE novel_id = ?1 ORDER BY created_at ASC",
        )?;
        let rows = stmt.query_map(params![novel_id], |row| {
            Ok(ParallelThread {
                id: row.get(0)?,
                novel_id: row.get(1)?,
                title: row.get(2)?,
                pov_character_id: row.get(3)?,
                thread_color: row.get(4)?,
                summary: row.get(5)?,
                convergence_target: row.get(6)?,
                status: row.get(7)?,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
            })
        })?;
        let mut list = Vec::new();
        for r in rows {
            list.push(r?);
        }
        Ok(list)
    }

    pub fn update_parallel_thread_status(&self, id: &str, status: &str) -> Result<()> {
        let conn = self.conn.lock();
        let now = chrono::Utc::now().timestamp_millis();
        conn.execute(
            "UPDATE parallel_threads SET status = ?1, updated_at = ?2 WHERE id = ?3",
            params![status, now, id],
        )?;
        Ok(())
    }

    pub fn delete_parallel_thread(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute("DELETE FROM parallel_threads WHERE id = ?1", params![id])?;
        Ok(())
    }

    // --- PLOT ASSOCIATIONS (多对多剧情跨层关联 M:N) ---

    pub fn create_plot_association(&self, input: CreatePlotAssociationInput) -> Result<PlotAssociation> {
        let conn = self.conn.lock();
        let id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now().timestamp_millis();
        let role = input.role_in_target.unwrap_or_else(|| "PROGRESSION".to_string());
        let notes = input.notes.unwrap_or_default();
        let weight = input.weight.unwrap_or(1);

        conn.execute(
            "INSERT INTO plot_associations (id, novel_id, relation_type, entity_id, target_type, target_id, role_in_target, notes, weight, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
             ON CONFLICT(relation_type, entity_id, target_type, target_id)
             DO UPDATE SET role_in_target = ?7, notes = ?8, weight = ?9",
            params![&id, &input.novel_id, &input.relation_type, &input.entity_id, &input.target_type, &input.target_id, &role, &notes, weight, now],
        )?;

        Ok(PlotAssociation {
            id,
            novel_id: input.novel_id,
            relation_type: input.relation_type,
            entity_id: input.entity_id,
            target_type: input.target_type,
            target_id: input.target_id,
            role_in_target: role,
            notes,
            weight,
            created_at: now,
        })
    }

    pub fn delete_plot_association(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute("DELETE FROM plot_associations WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn list_plot_associations_for_target(&self, target_type: &str, target_id: &str) -> Result<Vec<PlotAssociationView>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(
            "SELECT id, novel_id, relation_type, entity_id, target_type, target_id, role_in_target, notes, weight, created_at
             FROM plot_associations WHERE target_type = ?1 AND target_id = ?2 ORDER BY weight DESC, created_at ASC",
        )?;

        let rows = stmt.query_map(params![target_type, target_id], |row| {
            Ok(PlotAssociation {
                id: row.get(0)?,
                novel_id: row.get(1)?,
                relation_type: row.get(2)?,
                entity_id: row.get(3)?,
                target_type: row.get(4)?,
                target_id: row.get(5)?,
                role_in_target: row.get(6)?,
                notes: row.get(7)?,
                weight: row.get(8)?,
                created_at: row.get(9)?,
            })
        })?;

        let mut list = Vec::new();
        for r in rows {
            let assoc = r?;
            let entity_title = self.resolve_entity_title(&conn, &assoc.relation_type, &assoc.entity_id);
            let target_title = self.resolve_target_title(&conn, &assoc.target_type, &assoc.target_id);
            list.push(PlotAssociationView {
                association: assoc,
                entity_title,
                target_title,
            });
        }
        Ok(list)
    }

    pub fn list_plot_associations_for_entity(&self, relation_type: &str, entity_id: &str) -> Result<Vec<PlotAssociationView>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(
            "SELECT id, novel_id, relation_type, entity_id, target_type, target_id, role_in_target, notes, weight, created_at
             FROM plot_associations WHERE relation_type = ?1 AND entity_id = ?2 ORDER BY created_at ASC",
        )?;

        let rows = stmt.query_map(params![relation_type, entity_id], |row| {
            Ok(PlotAssociation {
                id: row.get(0)?,
                novel_id: row.get(1)?,
                relation_type: row.get(2)?,
                entity_id: row.get(3)?,
                target_type: row.get(4)?,
                target_id: row.get(5)?,
                role_in_target: row.get(6)?,
                notes: row.get(7)?,
                weight: row.get(8)?,
                created_at: row.get(9)?,
            })
        })?;

        let mut list = Vec::new();
        for r in rows {
            let assoc = r?;
            let entity_title = self.resolve_entity_title(&conn, &assoc.relation_type, &assoc.entity_id);
            let target_title = self.resolve_target_title(&conn, &assoc.target_type, &assoc.target_id);
            list.push(PlotAssociationView {
                association: assoc,
                entity_title,
                target_title,
            });
        }
        Ok(list)
    }

    pub fn list_novel_plot_matrix(&self, novel_id: &str) -> Result<Vec<PlotAssociationView>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(
            "SELECT id, novel_id, relation_type, entity_id, target_type, target_id, role_in_target, notes, weight, created_at
             FROM plot_associations WHERE novel_id = ?1 ORDER BY relation_type, created_at ASC",
        )?;

        let rows = stmt.query_map(params![novel_id], |row| {
            Ok(PlotAssociation {
                id: row.get(0)?,
                novel_id: row.get(1)?,
                relation_type: row.get(2)?,
                entity_id: row.get(3)?,
                target_type: row.get(4)?,
                target_id: row.get(5)?,
                role_in_target: row.get(6)?,
                notes: row.get(7)?,
                weight: row.get(8)?,
                created_at: row.get(9)?,
            })
        })?;

        let mut list = Vec::new();
        for r in rows {
            let assoc = r?;
            let entity_title = self.resolve_entity_title(&conn, &assoc.relation_type, &assoc.entity_id);
            let target_title = self.resolve_target_title(&conn, &assoc.target_type, &assoc.target_id);
            list.push(PlotAssociationView {
                association: assoc,
                entity_title,
                target_title,
            });
        }
        Ok(list)
    }

    fn resolve_entity_title(&self, conn: &Connection, relation_type: &str, entity_id: &str) -> String {
        match relation_type {
            "MAIN_PLOT" | "SUBPLOT" | "STORY_ARC" => {
                conn.query_row("SELECT title FROM story_arcs WHERE id = ?1", params![entity_id], |r| r.get(0)).unwrap_or_else(|_| "未知故事弧".to_string())
            }
            "CHARACTER_ARC" => {
                conn.query_row("SELECT title FROM character_arcs WHERE id = ?1", params![entity_id], |r| r.get(0)).unwrap_or_else(|_| "未知角色弧".to_string())
            }
            "FORESHADOWING" => {
                conn.query_row("SELECT title FROM plot_threads WHERE id = ?1", params![entity_id], |r| r.get(0)).unwrap_or_else(|_| "未知伏笔".to_string())
            }
            "PARALLEL_THREAD" => {
                conn.query_row("SELECT title FROM parallel_threads WHERE id = ?1", params![entity_id], |r| r.get(0)).unwrap_or_else(|_| "未知并行线".to_string())
            }
            "TIMELINE_EVENT" => {
                conn.query_row("SELECT title FROM story_events WHERE id = ?1", params![entity_id], |r| r.get(0)).unwrap_or_else(|_| "未知事件".to_string())
            }
            _ => entity_id.to_string(),
        }
    }

    fn resolve_target_title(&self, conn: &Connection, target_type: &str, target_id: &str) -> String {
        match target_type {
            "PART" => conn.query_row("SELECT title FROM parts WHERE id = ?1", params![target_id], |r| r.get(0)).unwrap_or_else(|_| "未知部/篇".to_string()),
            "VOLUME" => conn.query_row("SELECT title FROM volumes WHERE id = ?1", params![target_id], |r| r.get(0)).unwrap_or_else(|_| "未知分卷".to_string()),
            "CHAPTER" => conn.query_row("SELECT title FROM chapters WHERE id = ?1", params![target_id], |r| r.get(0)).unwrap_or_else(|_| "未知章节".to_string()),
            "SCENE" => conn.query_row("SELECT COALESCE(NULLIF(title, ''), '场景 ' || sequence) FROM scenes WHERE id = ?1", params![target_id], |r| r.get(0)).unwrap_or_else(|_| "未知场景".to_string()),
            "BEAT" => conn.query_row("SELECT title FROM plot_beats WHERE id = ?1", params![target_id], |r| r.get(0)).unwrap_or_else(|_| "未知节拍".to_string()),
            _ => target_id.to_string(),
        }
    }

    // --- STRUCTURAL & LIFECYCLE OPERATIONS ---

    pub fn move_node(&self, input: MoveNodeInput) -> Result<()> {
        let conn = self.conn.lock();
        match input.node_type.as_str() {
            "CHAPTER" => {
                if let Some(parent_id) = &input.new_parent_id {
                    let is_vol: bool = conn.query_row("SELECT 1 FROM volumes WHERE id = ?1", params![parent_id], |_| Ok(true)).unwrap_or(false);
                    if is_vol {
                        conn.execute("UPDATE chapters SET volume_id = ?1 WHERE id = ?2", params![parent_id, &input.node_id])?;
                    } else {
                        conn.execute("UPDATE chapters SET part_id = ?1, volume_id = NULL WHERE id = ?2", params![parent_id, &input.node_id])?;
                    }
                } else {
                    conn.execute("UPDATE chapters SET volume_id = NULL, part_id = NULL WHERE id = ?1", params![&input.node_id])?;
                }
                if let Some(order) = input.new_order {
                    conn.execute("UPDATE chapters SET order_index = ?1 WHERE id = ?2", params![order, &input.node_id])?;
                }
            }
            "SCENE" => {
                if let Some(parent_id) = &input.new_parent_id {
                    conn.execute("UPDATE scenes SET chapter_id = ?1 WHERE id = ?2", params![parent_id, &input.node_id])?;
                }
                if let Some(order) = input.new_order {
                    conn.execute("UPDATE scenes SET sequence = ?1, order_index = ?1 WHERE id = ?2", params![order, &input.node_id])?;
                }
            }
            "BEAT" => {
                if let Some(parent_id) = &input.new_parent_id {
                    conn.execute("UPDATE plot_beats SET scene_id = ?1 WHERE id = ?2", params![parent_id, &input.node_id])?;
                }
                if let Some(order) = input.new_order {
                    conn.execute("UPDATE plot_beats SET order_index = ?1, beat_number = ?1 WHERE id = ?2", params![order, &input.node_id])?;
                }
            }
            "VOLUME" => {
                if let Some(parent_id) = &input.new_parent_id {
                    conn.execute("UPDATE volumes SET part_id = ?1 WHERE id = ?2", params![parent_id, &input.node_id])?;
                }
                if let Some(order) = input.new_order {
                    conn.execute("UPDATE volumes SET order_index = ?1 WHERE id = ?2", params![order, &input.node_id])?;
                }
            }
            _ => {}
        }
        Ok(())
    }

    pub fn split_chapter(&self, input: SplitChapterInput) -> Result<(Chapter, Chapter)> {
        let orig = self.get_chapter(&input.chapter_id)?;
        let content = orig.content.clone().unwrap_or_default();
        let split_idx = input.split_point.max(0) as usize;

        // Split text content safely
        let (first_text, second_text) = if input.split_type == "SCENE_INDEX" {
            (content.clone(), "".to_string())
        } else {
            let chars: Vec<char> = content.chars().collect();
            if split_idx < chars.len() {
                let p1: String = chars[..split_idx].iter().collect();
                let p2: String = chars[split_idx..].iter().collect();
                (p1, p2)
            } else {
                (content.clone(), "".to_string())
            }
        };

        // 1. Shift existing chapters that come after orig
        let conn = self.conn.lock();
        conn.execute(
            "UPDATE chapters SET chapter_number = chapter_number + 1, order_index = order_index + 1
             WHERE novel_id = ?1 AND chapter_number > ?2",
            params![&orig.novel_id, orig.chapter_number],
        )?;

        let new_ch_num = orig.chapter_number + 1;
        let new_title = input.new_chapter_title.unwrap_or_else(|| format!("{} (下)", orig.title));
        drop(conn);

        // 2. Save original chapter with first_text
        let updated_orig = self.save_chapter_content(&orig.id, &first_text, true, "SPLIT_REVISION")?;

        // 3. Create new chapter with second_text
        let new_ch = self.create_chapter(CreateChapterInput {
            novel_id: orig.novel_id.clone(),
            part_id: orig.part_id.clone(),
            volume_id: orig.volume_id.clone(),
            chapter_number: Some(new_ch_num),
            order_index: Some(new_ch_num),
            title: new_title,
            chapter_goal: orig.chapter_goal.clone(),
            initial_content: Some(second_text),
        })?;

        // 4. If split_type == "SCENE_INDEX", move scenes after split_point to new chapter
        if input.split_type == "SCENE_INDEX" {
            let conn = self.conn.lock();
            let _ = conn.execute(
                "UPDATE scenes SET chapter_id = ?1, sequence = sequence - ?2 WHERE chapter_id = ?3 AND sequence > ?2",
                params![&new_ch.id, input.split_point, &orig.id],
            );
        }

        Ok((updated_orig, new_ch))
    }

    pub fn merge_chapters(&self, input: MergeChaptersInput) -> Result<Chapter> {
        let src = self.get_chapter(&input.source_chapter_id)?;
        let tgt = self.get_chapter(&input.target_chapter_id)?;

        let src_content = src.content.unwrap_or_default();
        let tgt_content = tgt.content.unwrap_or_default();

        let merged_content = if tgt_content.trim().is_empty() {
            src_content
        } else if src_content.trim().is_empty() {
            tgt_content
        } else {
            format!("{}\n\n{}", tgt_content.trim(), src_content.trim())
        };

        // 1. Save merged content into target chapter
        let updated_tgt = self.save_chapter_content(&tgt.id, &merged_content, true, "MERGE_CONTENT")?;

        let conn = self.conn.lock();

        // 2. Reparent scenes from source chapter to target chapter
        let max_seq: i64 = conn
            .query_row(
                "SELECT COALESCE(MAX(sequence), 0) FROM scenes WHERE chapter_id = ?1",
                params![&tgt.id],
                |r| r.get(0),
            )
            .unwrap_or(0);

        let _ = conn.execute(
            "UPDATE scenes SET chapter_id = ?1, sequence = sequence + ?2 WHERE chapter_id = ?3",
            params![&tgt.id, max_seq, &src.id],
        );

        // 3. Migrate plot associations from source chapter to target chapter
        let _ = conn.execute(
            "UPDATE OR IGNORE plot_associations SET target_id = ?1 WHERE target_type = 'CHAPTER' AND target_id = ?2",
            params![&tgt.id, &src.id],
        );
        let _ = conn.execute(
            "DELETE FROM plot_associations WHERE target_type = 'CHAPTER' AND target_id = ?1",
            params![&src.id],
        );

        // 4. Delete source chapter (cascades versions)
        conn.execute("DELETE FROM chapters WHERE id = ?1", params![&src.id])?;

        // 5. Shift subsequent chapter numbers down
        conn.execute(
            "UPDATE chapters SET chapter_number = chapter_number - 1, order_index = order_index - 1
             WHERE novel_id = ?1 AND chapter_number > ?2",
            params![&src.novel_id, src.chapter_number],
        )?;

        Ok(updated_tgt)
    }

    pub fn split_scene(&self, input: SplitSceneInput) -> Result<(Scene, Scene)> {
        let conn = self.conn.lock();
        let orig: Scene = conn.query_row(
            "SELECT id, chapter_id, sequence, order_index, title, scene_number, objective, outline, pov_character_id, location_id, content, word_count, time_anchor, conflict_target, status, created_at
             FROM scenes WHERE id = ?1",
            params![&input.scene_id],
            |row| {
                Ok(Scene {
                    id: row.get(0)?,
                    chapter_id: row.get(1)?,
                    sequence: row.get(2)?,
                    order_index: row.get(3)?,
                    title: row.get(4)?,
                    scene_number: row.get(5)?,
                    objective: row.get(6)?,
                    outline: row.get(7)?,
                    pov_character_id: row.get(8)?,
                    location_id: row.get(9)?,
                    content: row.get(10)?,
                    word_count: row.get(11)?,
                    time_anchor: row.get(12)?,
                    conflict_target: row.get(13)?,
                    status: row.get(14)?,
                    created_at: row.get(15)?,
                })
            },
        )?;

        conn.execute(
            "UPDATE scenes SET sequence = sequence + 1, order_index = order_index + 1 WHERE chapter_id = ?1 AND sequence > ?2",
            params![&orig.chapter_id, orig.sequence],
        )?;

        let new_scene_id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now().timestamp_millis();
        let new_title = input.new_scene_title.unwrap_or_else(|| {
            format!("{} (后半段)", orig.title.as_deref().unwrap_or("场景"))
        });

        conn.execute(
            "INSERT INTO scenes (id, chapter_id, sequence, order_index, title, scene_number, objective, outline, pov_character_id, location_id, content, word_count, time_anchor, conflict_target, status, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, '', 0, ?11, ?12, 'PLANNED', ?13)",
            params![
                &new_scene_id,
                &orig.chapter_id,
                orig.sequence + 1,
                orig.sequence + 1,
                &new_title,
                orig.sequence + 1,
                &orig.objective,
                &orig.outline,
                &orig.pov_character_id,
                &orig.location_id,
                &orig.time_anchor,
                &orig.conflict_target,
                now
            ],
        )?;

        let _ = conn.execute(
            "UPDATE plot_beats SET scene_id = ?1, order_index = order_index - ?2 WHERE scene_id = ?3 AND order_index > ?2",
            params![&new_scene_id, input.split_beat_index, &orig.id],
        );

        let new_scene = Scene {
            id: new_scene_id,
            chapter_id: orig.chapter_id.clone(),
            sequence: orig.sequence + 1,
            order_index: Some(orig.sequence + 1),
            title: Some(new_title),
            scene_number: Some(orig.sequence + 1),
            objective: orig.objective.clone(),
            outline: orig.outline.clone(),
            pov_character_id: orig.pov_character_id.clone(),
            location_id: orig.location_id.clone(),
            content: Some("".to_string()),
            word_count: Some(0),
            time_anchor: orig.time_anchor.clone(),
            conflict_target: orig.conflict_target.clone(),
            status: "PLANNED".to_string(),
            created_at: now,
        };

        Ok((orig, new_scene))
    }

    pub fn merge_scenes(&self, input: MergeScenesInput) -> Result<Scene> {
        let conn = self.conn.lock();
        let max_order: i64 = conn
            .query_row(
                "SELECT COALESCE(MAX(order_index), 0) FROM plot_beats WHERE scene_id = ?1",
                params![&input.target_scene_id],
                |r| r.get(0),
            )
            .unwrap_or(0);

        let _ = conn.execute(
            "UPDATE plot_beats SET scene_id = ?1, order_index = order_index + ?2 WHERE scene_id = ?3",
            params![&input.target_scene_id, max_order, &input.source_scene_id],
        );

        let _ = conn.execute(
            "UPDATE OR IGNORE plot_associations SET target_id = ?1 WHERE target_type = 'SCENE' AND target_id = ?2",
            params![&input.target_scene_id, &input.source_scene_id],
        );
        let _ = conn.execute(
            "DELETE FROM plot_associations WHERE target_type = 'SCENE' AND target_id = ?1",
            params![&input.source_scene_id],
        );

        conn.execute("DELETE FROM scenes WHERE id = ?1", params![&input.source_scene_id])?;

        conn.query_row(
            "SELECT id, chapter_id, sequence, order_index, title, scene_number, objective, outline, pov_character_id, location_id, content, word_count, time_anchor, conflict_target, status, created_at
             FROM scenes WHERE id = ?1",
            params![&input.target_scene_id],
            |row| {
                Ok(Scene {
                    id: row.get(0)?,
                    chapter_id: row.get(1)?,
                    sequence: row.get(2)?,
                    order_index: row.get(3)?,
                    title: row.get(4)?,
                    scene_number: row.get(5)?,
                    objective: row.get(6)?,
                    outline: row.get(7)?,
                    pov_character_id: row.get(8)?,
                    location_id: row.get(9)?,
                    content: row.get(10)?,
                    word_count: row.get(11)?,
                    time_anchor: row.get(12)?,
                    conflict_target: row.get(13)?,
                    status: row.get(14)?,
                    created_at: row.get(15)?,
                })
            },
        )
    }

    pub fn renumber_hierarchy(&self, input: RenumberHierarchyInput) -> Result<()> {
        let conn = self.conn.lock();

        // 1. Renumber Parts
        let mut p_stmt = conn.prepare("SELECT id FROM parts WHERE novel_id = ?1 ORDER BY order_index ASC, created_at ASC")?;
        let p_ids: Vec<String> = p_stmt.query_map(params![&input.novel_id], |r| r.get(0))?.filter_map(|r| r.ok()).collect();
        for (idx, pid) in p_ids.iter().enumerate() {
            let num = (idx + 1) as i64;
            let _ = conn.execute("UPDATE parts SET part_number = ?1, order_index = ?1 WHERE id = ?2", params![num, pid]);
        }

        // 2. Renumber Volumes
        let mut v_stmt = conn.prepare("SELECT id FROM volumes WHERE novel_id = ?1 ORDER BY order_index ASC, created_at ASC")?;
        let v_ids: Vec<String> = v_stmt.query_map(params![&input.novel_id], |r| r.get(0))?.filter_map(|r| r.ok()).collect();
        for (idx, vid) in v_ids.iter().enumerate() {
            let num = (idx + 1) as i64;
            let _ = conn.execute("UPDATE volumes SET order_index = ?1 WHERE id = ?2", params![num, vid]);
        }

        // 3. Renumber Chapters
        if input.per_volume_chapter_numbering.unwrap_or(false) {
            for vid in &v_ids {
                let mut c_stmt = conn.prepare("SELECT id FROM chapters WHERE volume_id = ?1 ORDER BY chapter_number ASC, created_at ASC")?;
                let c_ids: Vec<String> = c_stmt.query_map(params![vid], |r| r.get(0))?.filter_map(|r| r.ok()).collect();
                for (idx, cid) in c_ids.iter().enumerate() {
                    let num = (idx + 1) as i64;
                    let _ = conn.execute("UPDATE chapters SET chapter_number = ?1, order_index = ?1 WHERE id = ?2", params![num, cid]);
                }
            }
        } else {
            let mut c_stmt = conn.prepare("SELECT id FROM chapters WHERE novel_id = ?1 ORDER BY chapter_number ASC, created_at ASC")?;
            let c_ids: Vec<String> = c_stmt.query_map(params![&input.novel_id], |r| r.get(0))?.filter_map(|r| r.ok()).collect();
            for (idx, cid) in c_ids.iter().enumerate() {
                let num = (idx + 1) as i64;
                let _ = conn.execute("UPDATE chapters SET chapter_number = ?1, order_index = ?1 WHERE id = ?2", params![num, cid]);
            }
        }

        // 4. Renumber Scenes per chapter
        let mut all_c_stmt = conn.prepare("SELECT id FROM chapters WHERE novel_id = ?1")?;
        let all_c_ids: Vec<String> = all_c_stmt.query_map(params![&input.novel_id], |r| r.get(0))?.filter_map(|r| r.ok()).collect();
        for cid in all_c_ids {
            let mut s_stmt = conn.prepare("SELECT id FROM scenes WHERE chapter_id = ?1 ORDER BY sequence ASC, created_at ASC")?;
            let s_ids: Vec<String> = s_stmt.query_map(params![&cid], |r| r.get(0))?.filter_map(|r| r.ok()).collect();
            for (s_idx, sid) in s_ids.iter().enumerate() {
                let s_num = (s_idx + 1) as i64;
                let _ = conn.execute("UPDATE scenes SET sequence = ?1, order_index = ?1, scene_number = ?1 WHERE id = ?2", params![s_num, &sid]);

                // 5. Renumber Beats per scene
                let mut b_stmt = conn.prepare("SELECT id FROM plot_beats WHERE scene_id = ?1 ORDER BY order_index ASC, created_at ASC")?;
                let b_ids: Vec<String> = b_stmt.query_map(params![&sid], |r| r.get(0))?.filter_map(|r| r.ok()).collect();
                for (b_idx, bid) in b_ids.iter().enumerate() {
                    let b_num = (b_idx + 1) as i64;
                    let _ = conn.execute("UPDATE plot_beats SET beat_number = ?1, order_index = ?1 WHERE id = ?2", params![b_num, &bid]);
                }
            }
        }

        Ok(())
    }

    // --- NOVEL CONTENT TREE HIERARCHY ---

    pub fn get_novel_content_tree(&self, novel_id: &str) -> Result<NovelContentTree> {
        let config = self.get_novel_hierarchy_config(novel_id)?;
        let parts = self.list_parts(novel_id)?;
        let volumes = self.list_volumes(novel_id)?;
        let chapters = self.list_chapters(novel_id)?;

        let conn = self.conn.lock();

        let get_plot_count = |target_type: &str, target_id: &str| -> i64 {
            conn.query_row(
                "SELECT COUNT(*) FROM plot_associations WHERE target_type = ?1 AND target_id = ?2",
                params![target_type, target_id],
                |r| r.get(0),
            ).unwrap_or(0)
        };

        let mut chapter_nodes = Vec::new();
        for ch in &chapters {
            let mut scene_nodes = Vec::new();
            if config.enable_scenes {
                let mut s_stmt = conn.prepare(
                    "SELECT id, sequence, title, objective, word_count, status FROM scenes WHERE chapter_id = ?1 ORDER BY sequence ASC",
                )?;
                let scenes = s_stmt.query_map(params![&ch.id], |r| {
                    Ok((r.get::<_, String>(0)?, r.get::<_, i64>(1)?, r.get::<_, Option<String>>(2)?, r.get::<_, String>(3)?, r.get::<_, Option<i64>>(4)?, r.get::<_, String>(5)?))
                })?;

                for s in scenes {
                    if let Ok((sid, seq, stitle, sobj, sword, sstat)) = s {
                        let mut beat_nodes = Vec::new();
                        if config.enable_beats {
                            let mut b_stmt = conn.prepare(
                                "SELECT id, beat_number, title, description, status FROM plot_beats WHERE scene_id = ?1 ORDER BY order_index ASC",
                            )?;
                            let beats = b_stmt.query_map(params![&sid], |r| {
                                Ok((r.get::<_, String>(0)?, r.get::<_, i64>(1)?, r.get::<_, String>(2)?, r.get::<_, String>(3)?, r.get::<_, String>(4)?))
                            })?;
                            for b in beats {
                                if let Ok((bid, bnum, btitle, bdesc, bstat)) = b {
                                    beat_nodes.push(ContentTreeNode {
                                        id: bid.clone(),
                                        node_type: "BEAT".to_string(),
                                        title: btitle,
                                        number: bnum,
                                        order_index: bnum,
                                        parent_id: Some(sid.clone()),
                                        word_count: 0,
                                        status: bstat,
                                        goal_or_summary: bdesc,
                                        associated_plot_count: get_plot_count("BEAT", &bid),
                                        children: vec![],
                                    });
                                }
                            }
                        }

                        let title_display = stitle.filter(|t| !t.trim().is_empty()).unwrap_or_else(|| format!("场景 {}", seq));
                        scene_nodes.push(ContentTreeNode {
                            id: sid.clone(),
                            node_type: "SCENE".to_string(),
                            title: title_display,
                            number: seq,
                            order_index: seq,
                            parent_id: Some(ch.id.clone()),
                            word_count: sword.unwrap_or(0),
                            status: sstat,
                            goal_or_summary: sobj,
                            associated_plot_count: get_plot_count("SCENE", &sid),
                            children: beat_nodes,
                        });
                    }
                }
            }

            chapter_nodes.push(ContentTreeNode {
                id: ch.id.clone(),
                node_type: "CHAPTER".to_string(),
                title: ch.title.clone(),
                number: ch.chapter_number,
                order_index: ch.order_index.unwrap_or(ch.chapter_number),
                parent_id: ch.volume_id.clone().or_else(|| ch.part_id.clone()),
                word_count: ch.word_count,
                status: ch.status.clone(),
                goal_or_summary: ch.chapter_goal.clone().unwrap_or_default(),
                associated_plot_count: get_plot_count("CHAPTER", &ch.id),
                children: scene_nodes,
            });
        }

        let root_nodes = if config.enable_parts && !parts.is_empty() {
            let mut p_nodes = Vec::new();
            for p in &parts {
                let mut v_nodes = Vec::new();
                let p_vols: Vec<&Volume> = volumes.iter().filter(|v| v.part_id.as_deref() == Some(&p.id)).collect();
                for v in p_vols {
                    let v_chaps: Vec<ContentTreeNode> = chapter_nodes
                        .iter()
                        .filter(|c| c.parent_id.as_deref() == Some(&v.id))
                        .cloned()
                        .collect();
                    let v_words: i64 = v_chaps.iter().map(|c| c.word_count).sum();
                    v_nodes.push(ContentTreeNode {
                        id: v.id.clone(),
                        node_type: "VOLUME".to_string(),
                        title: v.title.clone(),
                        number: v.order_index,
                        order_index: v.order_index,
                        parent_id: Some(p.id.clone()),
                        word_count: v_words,
                        status: v.status.clone(),
                        goal_or_summary: v.summary.clone(),
                        associated_plot_count: get_plot_count("VOLUME", &v.id),
                        children: v_chaps,
                    });
                }
                let direct_chaps: Vec<ContentTreeNode> = chapter_nodes
                    .iter()
                    .filter(|c| c.parent_id.as_deref() == Some(&p.id))
                    .cloned()
                    .collect();
                for dc in direct_chaps {
                    v_nodes.push(dc);
                }

                let p_words: i64 = v_nodes.iter().map(|n| n.word_count).sum();
                p_nodes.push(ContentTreeNode {
                    id: p.id.clone(),
                    node_type: "PART".to_string(),
                    title: p.title.clone(),
                    number: p.part_number,
                    order_index: p.order_index,
                    parent_id: None,
                    word_count: p_words,
                    status: p.status.clone(),
                    goal_or_summary: p.summary.clone(),
                    associated_plot_count: get_plot_count("PART", &p.id),
                    children: v_nodes,
                });
            }
            p_nodes
        } else if config.enable_volumes && !volumes.is_empty() {
            let mut v_nodes = Vec::new();
            for v in &volumes {
                let v_chaps: Vec<ContentTreeNode> = chapter_nodes
                    .iter()
                    .filter(|c| c.parent_id.as_deref() == Some(&v.id))
                    .cloned()
                    .collect();
                let v_words: i64 = v_chaps.iter().map(|c| c.word_count).sum();
                v_nodes.push(ContentTreeNode {
                    id: v.id.clone(),
                    node_type: "VOLUME".to_string(),
                    title: v.title.clone(),
                    number: v.order_index,
                    order_index: v.order_index,
                    parent_id: None,
                    word_count: v_words,
                    status: v.status.clone(),
                    goal_or_summary: v.summary.clone(),
                    associated_plot_count: get_plot_count("VOLUME", &v.id),
                    children: v_chaps,
                });
            }
            let unassigned: Vec<ContentTreeNode> = chapter_nodes
                .iter()
                .filter(|c| c.parent_id.is_none())
                .cloned()
                .collect();
            for u in unassigned {
                v_nodes.push(u);
            }
            v_nodes
        } else {
            chapter_nodes
        };

        Ok(NovelContentTree {
            novel_id: novel_id.to_string(),
            hierarchy_config: config,
            root_nodes,
        })
    }

    // --- MULTI-AGENT HIERARCHICAL CREATION CONTEXT ASSEMBLY ---

    pub fn assemble_hierarchical_creation_context(
        &self,
        novel_id: &str,
        chapter_id: &str,
        scene_id: Option<&str>,
    ) -> Result<HierarchicalCreationContext> {
        let novel = self.get_novel(novel_id)?;
        let chapter = self.get_chapter(chapter_id)?;

        let series_summary = if let Some(sid) = &novel.series_id {
            self.get_series(sid).ok().map(|s| format!("《{}》: {}", s.title, s.description))
        } else {
            None
        };

        let volume = if let Some(vid) = &chapter.volume_id {
            let conn = self.conn.lock();
            conn.query_row(
                "SELECT id, novel_id, part_id, title, order_index, summary, status, created_at FROM volumes WHERE id = ?1",
                params![vid],
                |r| Ok(Volume {
                    id: r.get(0)?,
                    novel_id: r.get(1)?,
                    part_id: r.get(2)?,
                    title: r.get(3)?,
                    order_index: r.get(4)?,
                    summary: r.get(5)?,
                    status: r.get(6)?,
                    created_at: r.get(7)?,
                }),
            ).ok()
        } else {
            None
        };

        let part = if let Some(pid) = &chapter.part_id {
            self.get_part(pid).ok()
        } else if let Some(ref v) = volume {
            if let Some(ref pid) = v.part_id {
                self.get_part(pid).ok()
            } else {
                None
            }
        } else {
            None
        };

        let scenes = self.list_scenes(chapter_id)?;
        let active_scene = if let Some(sid) = scene_id {
            scenes.into_iter().find(|s| s.id == sid)
        } else {
            scenes.into_iter().next()
        };

        let scene_beats = if let Some(ref sc) = active_scene {
            self.list_plot_beats(&sc.id)?
        } else {
            Vec::new()
        };

        let mut target_pairs: Vec<(&str, &str)> = Vec::new();
        if let Some(p) = &part {
            target_pairs.push(("PART", &p.id));
        }
        if let Some(v) = &volume {
            target_pairs.push(("VOLUME", &v.id));
        }
        target_pairs.push(("CHAPTER", &chapter.id));
        if let Some(sc) = &active_scene {
            target_pairs.push(("SCENE", &sc.id));
        }

        let mut associated_main_lines = Vec::new();
        let mut associated_subplots = Vec::new();
        let mut associated_story_arcs = Vec::new();
        let mut associated_character_arcs = Vec::new();
        let mut active_foreshadowings = Vec::new();
        let mut parallel_threads = Vec::new();
        let mut recent_timeline_events = Vec::new();

        let conn = self.conn.lock();
        for (ttype, tid) in target_pairs {
            let mut stmt = conn.prepare(
                "SELECT relation_type, entity_id, role_in_target, notes FROM plot_associations WHERE target_type = ?1 AND target_id = ?2",
            )?;
            let rows = stmt.query_map(params![ttype, tid], |r| {
                Ok((r.get::<_, String>(0)?, r.get::<_, String>(1)?, r.get::<_, String>(2)?, r.get::<_, String>(3)?))
            })?;

            for r in rows {
                if let Ok((rel_type, ent_id, role, notes)) = r {
                    match rel_type.as_str() {
                        "MAIN_PLOT" => {
                            if let Ok(arc) = conn.query_row("SELECT title, goal FROM story_arcs WHERE id = ?1", params![&ent_id], |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))) {
                                associated_main_lines.push(format!("【主线】{} (目标: {}) [角色: {}, 备忘: {}]", arc.0, arc.1, role, notes));
                            }
                        }
                        "SUBPLOT" => {
                            if let Ok(arc) = conn.query_row("SELECT title, goal FROM story_arcs WHERE id = ?1", params![&ent_id], |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))) {
                                associated_subplots.push(format!("【支线】{} (目标: {}) [角色: {}]", arc.0, arc.1, role));
                            }
                        }
                        "STORY_ARC" => {
                            if let Ok(arc) = conn.query_row("SELECT title, goal, priority FROM story_arcs WHERE id = ?1", params![&ent_id], |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?, row.get::<_, String>(2)?))) {
                                associated_story_arcs.push(format!("【故事弧 ({})】{} (目标: {})", arc.2, arc.0, arc.1));
                            }
                        }
                        "CHARACTER_ARC" => {
                            if let Ok(ca) = conn.query_row(
                                "SELECT ca.title, c.name, ca.stage_from, ca.stage_to, ca.current_stage, ca.internal_conflict
                                 FROM character_arcs ca JOIN characters c ON ca.character_id = c.id WHERE ca.id = ?1",
                                params![&ent_id],
                                |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?, row.get::<_, String>(2)?, row.get::<_, String>(3)?, row.get::<_, String>(4)?, row.get::<_, String>(5)?))
                            ) {
                                associated_character_arcs.push(format!("【角色蜕变弧】{} · 角色: {} [当前阶段: {} | 起点: {} -> 终点: {}] 内心矛盾: {}", ca.0, ca.1, ca.4, ca.2, ca.3, ca.5));
                            }
                        }
                        "FORESHADOWING" => {
                            if let Ok(pt) = conn.query_row("SELECT title, description, expected_resolution, status FROM plot_threads WHERE id = ?1", params![&ent_id], |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?, row.get::<_, String>(2)?, row.get::<_, String>(3)?))) {
                                active_foreshadowings.push(format!("【伏笔线索 ({})】{} (细节: {}) 预期回收: {} [本处作用: {}]", pt.3, pt.0, pt.1, pt.2, role));
                            }
                        }
                        "PARALLEL_THREAD" => {
                            if let Ok(th) = conn.query_row("SELECT title, summary, convergence_target FROM parallel_threads WHERE id = ?1", params![&ent_id], |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?, row.get::<_, String>(2)?))) {
                                parallel_threads.push(format!("【并行线】{} (概要: {}) 预期汇合: {}", th.0, th.1, th.2));
                            }
                        }
                        "TIMELINE_EVENT" => {
                            if let Ok(ev) = conn.query_row("SELECT title, story_time, description FROM story_events WHERE id = ?1", params![&ent_id], |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?, row.get::<_, String>(2)?))) {
                                recent_timeline_events.push(format!("【时间线】[{}] {} ({})", ev.1, ev.0, ev.2));
                            }
                        }
                        _ => {}
                    }
                }
            }
        }

        let canon_rules: Vec<String> = {
            let mut canon_stmt = conn.prepare("SELECT title, rule_content FROM world_rules WHERE novel_id = ?1 AND authority_level = 'CANON' LIMIT 8")?;
            canon_stmt.query_map(params![novel_id], |r| Ok(format!("- 《{}》: {}", r.get::<_, String>(0)?, r.get::<_, String>(1)?)))?.filter_map(|r| r.ok()).collect()
        };

        let char_profiles: Vec<String> = {
            let mut char_stmt = conn.prepare("SELECT name, personality, motivation, status FROM characters WHERE novel_id = ?1 LIMIT 6")?;
            char_stmt.query_map(params![novel_id], |r| Ok(format!("- {} (性格: {}, 动机: {})", r.get::<_, String>(0)?, r.get::<_, String>(1)?, r.get::<_, String>(2)?)))?.filter_map(|r| r.ok()).collect()
        };
        drop(conn);

        associated_main_lines.dedup();
        associated_subplots.dedup();
        associated_story_arcs.dedup();
        associated_character_arcs.dedup();
        active_foreshadowings.dedup();
        parallel_threads.dedup();
        recent_timeline_events.dedup();

        let mut prompt = String::new();
        prompt.push_str("## 【当前创作层级定位与连续性上下文】\n");
        prompt.push_str(&format!("- **当前作品**：《{}》\n", novel.title));
        if let Some(s) = &series_summary {
            prompt.push_str(&format!("- **系列/宇宙体系**：{}\n", s));
        }
        if let Some(p) = &part {
            prompt.push_str(&format!("- **所属部/篇**：第 {} 篇《{}》 (阶段目标: {})\n", p.part_number, p.title, p.summary));
        }
        if let Some(v) = &volume {
            prompt.push_str(&format!("- **所属分卷**：第 {} 卷《{}》 (大纲总结: {})\n", v.order_index, v.title, v.summary));
        }
        prompt.push_str(&format!("- **当前章节**：第 {} 章《{}》 (章节目标: {})\n", chapter.chapter_number, chapter.title, chapter.chapter_goal.as_deref().unwrap_or("未设置")));
        if let Some(sc) = &active_scene {
            prompt.push_str(&format!("- **当前场景**：第 {} 幕《{}》 (场景目标: {})\n", sc.sequence, sc.title.as_deref().unwrap_or("未命名"), sc.objective));
            if !sc.outline.is_empty() {
                prompt.push_str(&format!("  * 场景细纲：{}\n", sc.outline));
            }
            if let Some(conflict) = &sc.conflict_target {
                if !conflict.is_empty() {
                    prompt.push_str(&format!("  * 冲突核心：{}\n", conflict));
                }
            }
        }

        if !scene_beats.is_empty() {
            prompt.push_str("\n### 【当前场景情节节拍 (Plot Beats)】\n");
            for beat in &scene_beats {
                prompt.push_str(&format!("{}. [{}] {} - {}\n", beat.beat_number, beat.beat_type, beat.title, beat.description));
                if !beat.emotional_shift.is_empty() {
                    prompt.push_str(&format!("   * 情绪流向：{}\n", beat.emotional_shift));
                }
            }
        }

        prompt.push_str("\n### 【跨层级剧情关联 (M:N 因果矩阵)】\n");
        if !associated_main_lines.is_empty() {
            prompt.push_str(&format!("- **主线指引**：\n  {}\n", associated_main_lines.join("\n  ")));
        }
        if !associated_subplots.is_empty() {
            prompt.push_str(&format!("- **支线交织**：\n  {}\n", associated_subplots.join("\n  ")));
        }
        if !associated_character_arcs.is_empty() {
            prompt.push_str(&format!("- **人物成长弧线**：\n  {}\n", associated_character_arcs.join("\n  ")));
        }
        if !active_foreshadowings.is_empty() {
            prompt.push_str(&format!("- **伏笔与悬念线索**：\n  {}\n", active_foreshadowings.join("\n  ")));
        }
        if !parallel_threads.is_empty() {
            prompt.push_str(&format!("- **并行叙事线**：\n  {}\n", parallel_threads.join("\n  ")));
        }
        if !recent_timeline_events.is_empty() {
            prompt.push_str(&format!("- **时间线锚点**：\n  {}\n", recent_timeline_events.join("\n  ")));
        }

        if !canon_rules.is_empty() {
            prompt.push_str("\n### 【核心世界观公理 (Canon Rules)】\n");
            prompt.push_str(&canon_rules.join("\n"));
            prompt.push('\n');
        }

        if !char_profiles.is_empty() {
            prompt.push_str("\n### 【核心登场角色】\n");
            prompt.push_str(&char_profiles.join("\n"));
            prompt.push('\n');
        }

        Ok(HierarchicalCreationContext {
            novel_id: novel_id.to_string(),
            chapter_id: chapter_id.to_string(),
            scene_id: active_scene.as_ref().map(|s| s.id.clone()),
            series_summary,
            part_title: part.as_ref().map(|p| p.title.clone()),
            part_goal: part.as_ref().map(|p| p.summary.clone()),
            volume_title: volume.as_ref().map(|v| v.title.clone()),
            volume_goal: volume.as_ref().map(|v| v.summary.clone()),
            chapter_title: chapter.title,
            chapter_number: chapter.chapter_number,
            chapter_goal: chapter.chapter_goal.unwrap_or_default(),
            scene_title: active_scene.as_ref().and_then(|s| s.title.clone()),
            scene_objective: active_scene.as_ref().map(|s| s.objective.clone()),
            scene_beats,
            associated_main_lines,
            associated_subplots,
            associated_story_arcs,
            associated_character_arcs,
            active_foreshadowings,
            parallel_threads,
            recent_timeline_events,
            l3_canon_rules: canon_rules,
            l3_active_character_profiles: char_profiles,
            formatted_system_prompt: prompt,
        })
    }
}

fn html_escape(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&#39;")
}

/// Helper function to count Chinese characters, English words and punctuation accurately
pub fn count_chinese_characters(text: &str) -> i64 {
    let mut count = 0;
    for c in text.chars() {
        if !c.is_whitespace() {
            count += 1;
        }
    }
    count
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_db() -> DbManager {
        let conn = Connection::open_in_memory().unwrap();
        let _ = conn.pragma_update(None, "foreign_keys", "ON");
        let _ = conn.pragma_update(None, "busy_timeout", 5000);
        conn.execute_batch(schema::INIT_SCHEMA).unwrap();
        let _ = conn.execute_batch(schema::FTS5_SCHEMA);
        DbManager {
            conn: Arc::new(Mutex::new(conn)),
            db_path: PathBuf::from(":memory:"),
        }
    }

    #[test]
    fn test_novel_and_chapter_lifecycle() {
        let db = create_test_db();

        // 1. Create novel
        let novel = db.create_novel(CreateNovelInput {
            title: "星穹之门".to_string(),
            description: Some("穿越星空的传奇故事".to_string()),
            genre_profile: Some("科幻".to_string()),
            language: Some("zh-CN".to_string()),
            writing_style: Some("硬派科幻、宏大叙事".to_string()),
            chapter_target_length: Some(4000),
            series_id: None,
            hierarchy_config: None,
        }).unwrap();

        assert_eq!(novel.title, "星穹之门");
        assert_eq!(novel.genre_profile, "科幻");

        // 2. Create chapter
        let chapter = db.create_chapter(CreateChapterInput {
            novel_id: novel.id.clone(),
            part_id: None,
            volume_id: None,
            chapter_number: Some(1),
            order_index: Some(1),
            title: "启航日".to_string(),
            chapter_goal: None,
            initial_content: Some("巨大的行星发动机在夜色中发出沉闷的低吼。".to_string()),
        }).unwrap();

        assert_eq!(chapter.title, "启航日");
        assert_eq!(chapter.chapter_number, 1);
        assert!(chapter.word_count > 0);

        // 3. Save chapter and version check
        let updated = db.save_chapter_content(
            &chapter.id,
            "巨大的行星发动机在夜色中发出沉闷的低吼。天幕之上，星环泛着冷冽的银蓝光芒。",
            true,
            "USER_EDIT",
        ).unwrap();

        assert!(updated.word_count > chapter.word_count);

        let versions = db.list_chapter_versions(&chapter.id).unwrap();
        assert_eq!(versions.len(), 2);
    }

    #[test]
    fn test_character_and_world_rules() {
        let db = create_test_db();
        let novel = db.create_novel(CreateNovelInput {
            title: "仙武长生".to_string(),
            description: None,
            genre_profile: Some("仙侠".to_string()),
            language: None,
            writing_style: None,
            chapter_target_length: None,
            series_id: None,
            hierarchy_config: None,
        }).unwrap();

        let chara = db.create_character(CreateCharacterInput {
            novel_id: novel.id.clone(),
            name: "李观棋".to_string(),
            aliases: Some("白衣剑客".to_string()),
            profile: Some("青云门关门弟子".to_string()),
            personality: Some("外冷内热、沉静果断".to_string()),
            background: Some("幼年流落街头，被师尊带上山".to_string()),
            motivation: Some("追寻父母失踪的真相".to_string()),
        }).unwrap();

        assert_eq!(chara.name, "李观棋");

        let rule = db.create_world_rule(CreateWorldRuleInput {
            novel_id: novel.id.clone(),
            title: "灵气潮汐法则".to_string(),
            rule_content: "每逢朔望之夜，天地灵气暴涨三成，修士极易走火入魔。".to_string(),
            authority_level: Some("CANON".to_string()),
        }).unwrap();

        assert_eq!(rule.title, "灵气潮汐法则");

        let rules = db.list_world_rules(&novel.id).unwrap();
        assert_eq!(rules.len(), 1);
    }
}
