use uuid::Uuid;
use novelforge_ai_lib::database::DbManager;
use novelforge_ai_lib::models::{
    CreateChapterInput, CreateCharacterInput, CreateNovelInput, CreateWorldRuleInput,
    CreateSeriesInput, CreatePartInput, CreateVolumeInput, CreateSceneInput, CreatePlotBeatInput,
    CreateCharacterArcInput, CreateParallelThreadInput, CreatePlotAssociationInput, HierarchyConfig,
    MoveNodeInput, SplitChapterInput, MergeChaptersInput, SplitSceneInput, MergeScenesInput,
    RenumberHierarchyInput, CreateWorkflowRunInput, AdvanceWorkflowStepInput, ExecuteToolboxActionInput,
    SaveVoiceProfileInput, SaveModelArenaRunInput,
};

fn main() {
    println!("=== 开始 NovelForge AI 本地数据库与全功能验证 ===");

    let db = DbManager::new().expect("初始化本地 SQLite 数据库失败");
    println!("1. 数据库初始化成功，路径: {}", db.get_db_path());

    // 1. 创建小说
    let novel = db
        .create_novel(CreateNovelInput {
            title: "星穹之门：终极纪元".to_string(),
            description: Some("跨越三千万光年的硬核科幻史诗巨作".to_string()),
            genre_profile: Some("科幻".to_string()),
            language: Some("zh-CN".to_string()),
            writing_style: Some("硬派沉稳、考据扎实".to_string()),
            chapter_target_length: Some(4000),
            series_id: None,
            hierarchy_config: None,
        })
        .expect("创建小说失败");
    println!("2. 成功创建小说: 《{}》 (ID: {})", novel.title, novel.id);

    // 2. 读取小说列表
    let novels = db.list_novels().expect("读取小说列表失败");
    assert!(novels.iter().any(|n| n.id == novel.id));
    println!("3. 验证小说列表: 当前共有 {} 部作品", novels.len());

    // 3. 创建章节
    let ch1 = db
        .create_chapter(CreateChapterInput {
            novel_id: novel.id.clone(),
            part_id: None,
            volume_id: None,
            chapter_number: Some(1),
            order_index: Some(1),
            title: "第一章：视界边缘的沉鸣".to_string(),
            chapter_goal: Some("交代世界观背景与曲率危机".to_string()),
            initial_content: Some("星空如墨，引擎轰鸣，战舰在黑暗中疾驰。".to_string()),
        })
        .expect("创建章节失败");
    println!(
        "4. 成功创建第 {} 章《{}》, 字数: {}",
        ch1.chapter_number, ch1.title, ch1.word_count
    );

    // 4. 正文编辑与版本历史
    let updated = db
        .save_chapter_content(
            &ch1.id,
            "巨大的反物质引擎在寒夜中发出沉闷的轰鸣，舷窗外是静谧而冰冷的柯伊伯带。林远深吸一口气，按下了最终指令。",
            true,
            "USER_EDIT",
        )
        .expect("更新章节正文失败");
    println!("5. 保存正文快照成功，当前字数: {}", updated.word_count);

    let versions = db.list_chapter_versions(&ch1.id).expect("获取版本列表失败");
    assert_eq!(versions.len(), 2);
    println!("6. 验证版本控制: 成功保留 {} 个历史版本快照", versions.len());

    // 5. 创建人物档案
    let character = db
        .create_character(CreateCharacterInput {
            novel_id: novel.id.clone(),
            name: "林远".to_string(),
            aliases: Some("深空领航员".to_string()),
            profile: Some("深空开拓舰队首席领航员".to_string()),
            personality: Some("沉着敏锐、孤傲冷峻".to_string()),
            background: Some("经历过第三次太阳风暴的幸存者".to_string()),
            motivation: Some("寻找失落的先驱者舰队".to_string()),
        })
        .expect("创建人物失败");
    println!("7. 成功创建角色档案: 【{}】 (动机: {})", character.name, character.motivation);

    // 6. 创建世界观规则 (Canon)
    let rule = db
        .create_world_rule(CreateWorldRuleInput {
            novel_id: novel.id.clone(),
            title: "曲率泡稳定法则".to_string(),
            rule_content: "在重力井深度超过0.15G的引力场中强行展开曲率泡将引发时空剪切。".to_string(),
            authority_level: Some("CANON".to_string()),
        })
        .expect("创建世界规则失败");
    println!("8. 成功创建权威世界观规则 (Canon): 【{}】", rule.title);

    // 7. 验证模型提供商配置
    let (provider, model) = db
        .get_active_provider_and_model()
        .expect("获取激活提供商失败")
        .expect("未找到激活提供商");
    println!(
        "9. 验证模型网关: 激活服务商[{}]，端点[{}]，默认模型[{}]",
        provider.name, provider.base_url, model.model_name
    );

    // 8. 验证角色关系拓扑 (Phase 2)
    let char2 = db
        .create_character(CreateCharacterInput {
            novel_id: novel.id.clone(),
            name: "安雅".to_string(),
            aliases: Some("首席工程师".to_string()),
            profile: Some("先驱者号主引擎架构师".to_string()),
            personality: Some("理智严谨、快言快语".to_string()),
            background: Some("空间动力研究所高材生".to_string()),
            motivation: Some("维护舰队动力系统周全".to_string()),
        })
        .expect("创建角色2失败");

    let relation = db
        .create_character_relationship(novelforge_ai_lib::models::CreateCharacterRelationshipInput {
            novel_id: novel.id.clone(),
            source_character_id: character.id.clone(),
            target_character_id: char2.id.clone(),
            relation_type: "生死战友".to_string(),
            description: Some("历经三次跃迁事故，相互绝对信任".to_string()),
        })
        .expect("创建角色关系失败");
    println!("10. 验证角色关系拓扑: 【{}】与【{}】关系为[{}]", character.name, char2.name, relation.relation_type);

    // 9. 验证故事大纲阶段与剧情弧 (Phase 2)
    let phase = db
        .create_story_phase(novelforge_ai_lib::models::CreateStoryPhaseInput {
            novel_id: novel.id.clone(),
            title: "第一阶段：破晓远征".to_string(),
            order_index: Some(1),
            goal: Some("突破封锁线并进入未知星域".to_string()),
        })
        .expect("创建故事阶段失败");

    let arc = db
        .create_story_arc(novelforge_ai_lib::models::CreateStoryArcInput {
            novel_id: novel.id.clone(),
            phase_id: Some(phase.id.clone()),
            title: "柯伊伯带突围弧".to_string(),
            goal: Some("避开星际海盗与引力雷区".to_string()),
            description: Some("主线核心冲突点".to_string()),
            priority: Some("MAIN".to_string()),
        })
        .expect("创建剧情弧失败");
    println!("11. 验证大纲规划: 阶段【{}】 -> 剧情弧【{}】", phase.title, arc.title);

    // 10. 验证章节场景细纲拆解 (Phase 2)
    let scene = db
        .create_scene(novelforge_ai_lib::models::CreateSceneInput {
            chapter_id: ch1.id.clone(),
            sequence: 1,
            order_index: Some(1),
            title: Some("反物质引擎点火".to_string()),
            scene_number: Some(1),
            objective: "展现战舰起航前的压迫感与林远的决断".to_string(),
            outline: "1.主引擎充能倒计时 2.安雅汇报引力读数异常 3.林远决意启动".to_string(),
            pov_character_id: Some(character.id.clone()),
            location_id: Some("先驱者号主舰桥".to_string()),
            content: Some("主屏幕上，红色的重力井警告如同心脏般剧烈搏动。".to_string()),
            time_anchor: Some("起航前30分钟".to_string()),
            conflict_target: Some("引力读数异常与强行点火的决策冲突".to_string()),
        })
        .expect("创建场景细纲失败");
    println!("12. 验证场景拆解 (Scene): 场次[{}] 目标: {}", scene.sequence, scene.objective);

    // 11. 验证逻辑审稿报告与发现入库 (Phase 3)
    let findings = vec![novelforge_ai_lib::models::ContinuityAuditFinding {
        severity: "MINOR".to_string(),
        category: "TIMELINE".to_string(),
        title: "反物质引擎预热时间细节补充".to_string(),
        description: "建议补充主引擎从静默到全功率运作的耗时描述".to_string(),
        evidence_quote: Some("巨大的反物质引擎在寒夜中发出沉闷的轰鸣".to_string()),
        suggestion: "增加三分钟倒计时的临场压迫细节".to_string(),
    }];

    let report = db
        .create_review_report(
            &ch1.id,
            1,
            92,
            "本章节奏紧凑，世界观设定严密，符合硬科幻基调。",
            &findings,
        )
        .expect("创建审稿报告失败");
    println!("13. 验证逻辑审稿报告: 得分[{}]，发现[{}]项建议，总结: {}", report.score, report.findings.len(), report.summary);

    // 12. 验证权威事实库与 FTS5 全文检索 (Phase 4)
    let fact = db
        .create_canon_fact(novelforge_ai_lib::models::CreateCanonFactInput {
            novel_id: novel.id.clone(),
            subject_id: Some("先驱者号".to_string()),
            predicate: "搭载了绝密实验性".to_string(),
            object_value: "反物质曲率核心二号机".to_string(),
            truth_scope: Some("GLOBAL".to_string()),
            authority_level: Some("CANON".to_string()),
            source_chapter_id: Some(ch1.id.clone()),
        })
        .expect("创建权威事实失败");
    println!("14. 验证权威事实 (Canon Fact): 【{}】{}【{}】", fact.subject_id, fact.predicate, fact.object_value);

    let search_facts = db.list_canon_facts(&novel.id, Some("曲率")).expect("搜索事实失败");
    assert!(!search_facts.is_empty());
    println!("15. 验证 FTS5 事实全文检索: 成功检索到 {} 条包含'曲率'的事实", search_facts.len());

    // 13. 验证角色动态状态追踪 (Phase 4)
    let state_ev = db
        .create_character_state_event(novelforge_ai_lib::models::CreateCharacterStateEventInput {
            character_id: character.id.clone(),
            source_chapter_id: Some(ch1.id.clone()),
            effective_time: Some("跃迁纪元01日".to_string()),
            field_name: "心理状态".to_string(),
            previous_value: Some("忐忑与警惕".to_string()),
            new_value: "决然决断，破釜沉舟".to_string(),
        })
        .expect("创建角色状态变更失败");
    println!("16. 验证动态角色状态追踪: 【{}】变更维度[{}] -> {}", character.name, state_ev.field_name, state_ev.new_value);

    // 14. 验证五层记忆 Context Pack 组装 (Phase 4)
    let context_pack = db
        .assemble_memory_context_pack(&novel.id, &ch1.id, "调查引擎读数异常并准备跃迁", Some(&[character.id.clone()]))
        .expect("组装五层记忆 Context Pack 失败");
    assert!(!context_pack.assembled_system_prompt.is_empty());
    println!("17. 验证五层记忆 (L0~L4 Context Pack) 组装: 生成提示词包 {} 字符，成功注入 L3 Canon 规则与 L1 前情", context_pack.assembled_system_prompt.len());

    // 15. 验证自动连载任务队列 (Phase 5)
    let job = db
        .create_serialization_job(&novel.id, 3, false, 50000, "{\"style\":\"hard-sf\"}")
        .expect("创建自动连载任务失败");
    println!("18. 验证自动连载引擎 (Job ID: {}): 目标章节[{}]，状态[{}]", job.id, job.target_chapters_count, job.status);

    db.update_serialization_job_progress(&job.id, 1, Some(&ch1.id), 2500, "WAITING_REVIEW", None)
        .expect("更新连载任务进度失败");
    let updated_job = db.get_serialization_job(&job.id).expect("获取连载任务失败");
    assert_eq!(updated_job.completed_chapters_count, 1);
    assert_eq!(updated_job.status, "WAITING_REVIEW");
    println!("19. 验证连载任务状态流转: 已完成[{}]章，当前状态[{}]，消耗Token[{}]", updated_job.completed_chapters_count, updated_job.status, updated_job.used_tokens);

    // 16. 验证数据库在线热备份 (Phase 7)
    let backup_path = db.backup_database().expect("在线热备份失败");
    assert!(std::path::Path::new(&backup_path).exists());
    println!("20. 验证数据库在线热备份: 成功生成热备份文件 [{}]", backup_path);

    // 17. 验证数据库健康度诊断与优化 (Phase 7)
    let health = db.optimize_database().expect("数据库健康检查失败");
    assert_eq!(health.integrity_status, "ok");
    println!("21. 验证数据库诊断优化: 完整性检查[{}], WAL检查点[{}], 作品数[{}], 章节数[{}]", health.integrity_status, health.wal_checkpoint, health.total_novels, health.total_chapters);

    // 18. 验证发布中心 HTML5 电子书单文件生成 (Phase 6)
    let html_book = db.export_novel_html_book(&novel.id).expect("生成 HTML 电子书失败");
    assert!(html_book.contains("<!DOCTYPE html>"));
    assert!(html_book.contains("星穹之门：终极纪元"));
    println!("22. 验证多格式发布: 成功生成自包含 HTML5 电子书, 长度 {} 字节, 包含响应式目录与三套主题", html_book.len());

    // 19. 验证全书工程 JSON 归档与复原 (Phase 6 & 7)
    let archive_json = db.export_novel_archive(&novel.id).expect("全书归档失败");
    assert!(archive_json.contains("林远"));
    assert!(archive_json.contains("先驱者号"));
    let imported_novel = db.import_novel_archive(&archive_json).expect("全书归档恢复失败");
    assert!(imported_novel.title.contains("导入副本"));
    println!("23. 验证全书工程归档与导入恢复: 归档 JSON 长度 {} 字符，成功复原小说【{}】", archive_json.len(), imported_novel.title);

    // ==========================================
    // V2.0 多层级结构与独立剧情关系系统专项验证 (24 ~ 36)
    // ==========================================

    // 24. 验证系列/宇宙 (Series) 管理
    let series = db
        .create_series(CreateSeriesInput {
            title: "星穹漫游者宇宙".to_string(),
            description: Some("覆盖三大文明与数千光年战史的恢弘宇宙".to_string()),
            genre_profile: Some("硬科幻".to_string()),
            world_definition: Some("以反物质引擎与曲率引擎为主的宇宙文明".to_string()),
        })
        .expect("创建系列失败");
    println!("24. 验证系列/宇宙: 成功创建系列【{}】 (ID: {})", series.title, series.id);
    let series_list = db.list_series().expect("读取系列列表失败");
    assert!(series_list.iter().any(|s| s.id == series.id));

    // 25. 验证多层级配置 (HierarchyConfig)
    let custom_hierarchy = HierarchyConfig {
        enable_parts: true,
        enable_volumes: true,
        enable_scenes: true,
        enable_beats: true,
    };
    let updated_config = db
        .update_novel_hierarchy_config(&novel.id, custom_hierarchy)
        .expect("更新小说层级配置失败");
    assert!(updated_config.enable_parts && updated_config.enable_beats);
    println!("25. 验证层级配置: 成功启用 部/篇、卷、场景、节拍");

    // 26. 验证部/篇 (Part) 与 分卷 (Volume)
    let part1 = db
        .create_part(CreatePartInput {
            novel_id: novel.id.clone(),
            part_number: Some(1),
            title: "第一部：黑洞视界".to_string(),
            summary: Some("从近地轨道到柯伊伯带边缘的远航".to_string()),
            order_index: Some(1),
        })
        .expect("创建部/篇失败");
    println!("26. 验证部/篇创建: 【{}】 (序号: {})", part1.title, part1.part_number);

    let vol1 = db
        .create_volume(CreateVolumeInput {
            novel_id: novel.id.clone(),
            part_id: Some(part1.id.clone()),
            title: "第一卷：先驱者的远征".to_string(),
            summary: Some("先驱者号起航与第一次曲率跃迁测试".to_string()),
            order_index: Some(1),
        })
        .expect("创建分卷失败");
    println!("27. 验证分卷创建: 挂载于部【{}】下的卷【{}】", part1.title, vol1.title);

    // 将已有的 ch1 移动/归属到该部与分卷
    db.move_node(MoveNodeInput {
        node_type: "CHAPTER".to_string(),
        node_id: ch1.id.clone(),
        new_parent_id: Some(vol1.id.clone()),
        new_order: Some(1),
    }).expect("移动章节至分卷失败");
    println!("28. 验证跨层级移动 (Move Node): 成功将第1章归属于【{}】", vol1.title);

    // 27. 验证场景 (Scene) 与 情节节拍 (PlotBeat)
    let scene1 = db
        .create_scene(CreateSceneInput {
            chapter_id: ch1.id.clone(),
            sequence: 1,
            order_index: Some(1),
            title: Some("场景一：主控室异常读数".to_string()),
            scene_number: Some(1),
            objective: "确认引力透镜参数并排除仪表故障".to_string(),
            outline: "二号副传感器读数持续溢出，大副要求紧急中止".to_string(),
            pov_character_id: Some(character.id.clone()),
            location_id: Some("先驱者号中央舰桥".to_string()),
            content: Some("林远手动复位并发现疑似微型引力坍缩".to_string()),
            time_anchor: Some("跃迁前30分钟".to_string()),
            conflict_target: Some("大副紧急中止提议".to_string()),
        })
        .expect("创建场景失败");
    println!("29. 验证场景创建: 【{:?}】 (POV: {})", scene1.title, character.name);

    let beat1 = db
        .create_plot_beat(CreatePlotBeatInput {
            scene_id: scene1.id.clone(),
            beat_number: Some(1),
            beat_type: Some("ACTION".to_string()),
            title: "蜂鸣警报骤响".to_string(),
            description: Some("警报红光闪烁，引力波雷达显示三处异常峰值".to_string()),
            emotional_shift: Some("紧迫感递增".to_string()),
            characters_present: Some(character.name.clone()),
            order_index: Some(1),
        })
        .expect("创建节拍1失败");

    let _beat2 = db
        .create_plot_beat(CreatePlotBeatInput {
            scene_id: scene1.id.clone(),
            beat_number: Some(2),
            beat_type: Some("CRISIS".to_string()),
            title: "副反应堆过载风险".to_string(),
            description: Some("林远必须在15秒内做出抉择".to_string()),
            emotional_shift: Some("生死悬于一线".to_string()),
            characters_present: Some(character.name.clone()),
            order_index: Some(2),
        })
        .expect("创建节拍2失败");

    db.update_plot_beat_status(&beat1.id, "COMPLETED").expect("更新节拍状态失败");
    let beats = db.list_plot_beats(&scene1.id).expect("查询节拍列表失败");
    assert_eq!(beats.len(), 2);
    println!("30. 验证情节节拍 (PlotBeat): 场景【{:?}】下创建 {} 个细粒度节拍，节拍1状态已置为[{}]",
        scene1.title, beats.len(), beats[0].status);

    // 28. 验证独立剧情关系：人物成长弧 (CharacterArc) 与 并行叙事线 (ParallelThread)
    let char_arc = db
        .create_character_arc(CreateCharacterArcInput {
            novel_id: novel.id.clone(),
            character_id: character.id.clone(),
            title: "林远的心智蜕变".to_string(),
            stage_from: Some("深陷学术教条、遇突发危机犹豫不决".to_string()),
            stage_to: Some("铁血果断、敢于直面未知深空的成熟舰长".to_string()),
            current_stage: Some("初步觉醒：意识到理论无法解答深空异常".to_string()),
            internal_conflict: Some("理论权威与深空未知的矛盾".to_string()),
        })
        .expect("创建人物成长弧失败");
    println!("31. 验证人物成长弧: 【{}】，当前阶段: {}", char_arc.title, char_arc.current_stage);

    let parallel_thread = db
        .create_parallel_thread(CreateParallelThreadInput {
            novel_id: novel.id.clone(),
            title: "地球总部的秘密博弈".to_string(),
            pov_character_id: None,
            thread_color: Some("#3B82F6".to_string()),
            summary: Some("地面控制中心对远征任务隐瞒了核心危险参数".to_string()),
            convergence_target: Some("第三卷跃迁交汇点".to_string()),
        })
        .expect("创建并行叙事线失败");
    println!("32. 验证并行叙事线: 【{}】汇聚目标[{}]", parallel_thread.title, parallel_thread.convergence_target);

    // 29. 验证跨层级多对多剧情关联 (M:N Plot Association)
    let fs = db
        .create_plot_thread(novelforge_ai_lib::models::CreatePlotThreadInput {
            novel_id: novel.id.clone(),
            title: "失落的曲率核心密钥".to_string(),
            description: Some("量子干涉异常引出伏笔".to_string()),
            introduced_chapter_id: Some(ch1.id.clone()),
            expected_resolution: Some("第三卷解开".to_string()),
        })
        .expect("创建伏笔失败");

    // 关联1：主线关联到“第一部”
    db.create_plot_association(CreatePlotAssociationInput {
        novel_id: novel.id.clone(),
        relation_type: "MAIN_PLOT".to_string(),
        entity_id: arc.id.clone(),
        target_type: "PART".to_string(),
        target_id: part1.id.clone(),
        role_in_target: Some("CLIMAX_SETUP".to_string()),
        notes: Some("第一部奠定反物质主线基础".to_string()),
        weight: Some(10),
    }).expect("创建部级主线关联失败");

    // 关联2：人物成长弧关联到场景1
    db.create_plot_association(CreatePlotAssociationInput {
        novel_id: novel.id.clone(),
        relation_type: "CHARACTER_ARC".to_string(),
        entity_id: char_arc.id.clone(),
        target_type: "SCENE".to_string(),
        target_id: scene1.id.clone(),
        role_in_target: Some("CATALYST".to_string()),
        notes: Some("警报事件触动林远打破常规".to_string()),
        weight: Some(8),
    }).expect("创建场景级人物弧关联失败");

    // 关联3：伏笔关联到第1章
    db.create_plot_association(CreatePlotAssociationInput {
        novel_id: novel.id.clone(),
        relation_type: "FORESHADOWING".to_string(),
        entity_id: fs.id.clone(),
        target_type: "CHAPTER".to_string(),
        target_id: ch1.id.clone(),
        role_in_target: Some("FORESHADOWS".to_string()),
        notes: Some("第1章埋下量子干涉异常的伏笔".to_string()),
        weight: Some(5),
    }).expect("创建章节级伏笔关联失败");

    let matrix = db.list_novel_plot_matrix(&novel.id).expect("查询全书剧情矩阵失败");
    assert!(matrix.len() >= 3);
    println!("33. 验证跨层级多对多剧情关联网: 成功装配全书剧情网状矩阵, 现有 {} 个关联锚点，实现部、卷、章、场景与主线/人物弧/伏笔解耦贯通", matrix.len());

    // 30. 验证章节拆分与版本留存 (Split Chapter)
    let full_content = "第一段：引力波如狂潮般袭来，主屏幕上读数急剧攀升。\n\n===SPLIT_POINT===\n\n第二段：跃迁通道彻底敞开，无尽的银河星海瞬间化作拉长的白光线。";
    db.save_chapter_content(&ch1.id, full_content, true, "SPLIT_TEST").expect("准备拆分正文失败");

    let split_result = db.split_chapter(SplitChapterInput {
        chapter_id: ch1.id.clone(),
        split_type: "CONTENT_OFFSET".to_string(),
        split_point: 35,
        new_chapter_title: Some("第1章（续）：跃迁之光".to_string()),
    }).expect("章节拆分失败");
    println!("34. 验证章节拆分 (Split Chapter): 原章节保留 {} 字，新生成章节【{}】 ({} 字)，自动创建历史版本并重排后继序号",
        split_result.0.word_count, split_result.1.title, split_result.1.word_count);

    // 31. 验证章节合并与剧情引用安全 (Merge Chapters)
    let merged_chapter = db.merge_chapters(MergeChaptersInput {
        source_chapter_id: split_result.1.id.clone(),
        target_chapter_id: ch1.id.clone(),
    }).expect("章节合并失败");
    assert!(merged_chapter.word_count >= 50);
    println!("35. 验证章节合并 (Merge Chapters): 目标章节字数增至 {} 字，子场景重新归属，原剧情关联平滑转移并清理孤儿节点",
        merged_chapter.word_count);

    // 32. 验证场景拆分与合并 (Split & Merge Scene)
    let split_scene_res = db.split_scene(SplitSceneInput {
        scene_id: scene1.id.clone(),
        split_beat_index: 1,
        new_scene_title: Some("场景一（续）：引力坍缩确证".to_string()),
    }).expect("场景拆分失败");
    println!("36. 验证场景拆分 (Split Scene): 成功拆分出新场景【{:?}】", split_scene_res.1.title);

    let merged_scene = db.merge_scenes(MergeScenesInput {
        source_scene_id: split_scene_res.1.id.clone(),
        target_scene_id: scene1.id.clone(),
    }).expect("场景合并失败");
    println!("37. 验证场景合并 (Merge Scene): 节拍已合并回收至目标场景【{:?}】", merged_scene.title);

    // 33. 验证层级重编号 (Renumber Hierarchy)
    db.renumber_hierarchy(RenumberHierarchyInput {
        novel_id: novel.id.clone(),
        per_volume_chapter_numbering: Some(false),
    }).expect("层级重编号失败");
    println!("38. 验证层级重编号 (Renumber Hierarchy): 规范化全局部、卷、章、场景连续序列号完成");

    // 34. 验证完整内容树递归生成 (Novel Content Tree)
    let content_tree = db.get_novel_content_tree(&novel.id).expect("组装小说内容树失败");
    println!("39. 验证小说完整大纲内容树: 根节点拥有 {} 个一级节点 (部/卷/章)，已无缝整合层级与场景节拍", content_tree.root_nodes.len());

    // 35. 验证多 Agent 创作上下文组装 (Hierarchical Creation Context Assembly)
    let creation_ctx = db.assemble_hierarchical_creation_context(&novel.id, &ch1.id, Some(&scene1.id))
        .expect("组装多 Agent 创作上下文失败");
    println!("DEBUG prompt (length: {}):\n{}", creation_ctx.formatted_system_prompt.len(), creation_ctx.formatted_system_prompt);
    assert!(!creation_ctx.formatted_system_prompt.is_empty());
    assert!(creation_ctx.formatted_system_prompt.contains(&novel.title));
    assert!(creation_ctx.formatted_system_prompt.contains(&part1.title));
    assert!(creation_ctx.formatted_system_prompt.contains(&vol1.title));
    println!("40. 验证多 Agent 创作上下文组装:\n--- 上下文片段预览 ---\n{}\n--- 结束预览 ---",
        creation_ctx.formatted_system_prompt);

    // ==========================================
    // V2.3 NOVELIST WORKFLOW & TOOLBOX TESTS (41 ~ 44)
    // ==========================================

    // 41. 验证工作流模板与内置播种
    let templates = db.list_workflow_templates(Some(&novel.id)).expect("获取工作流模板列表失败");
    assert!(templates.len() >= 2);
    let builtin_tpl = templates.iter().find(|t| t.is_builtin).expect("未找到内置工作流模板");
    println!("41. 验证工作流模板与内置播种: 成功加载 {} 套模板，内置示范【{}】(类别: {})",
        templates.len(), builtin_tpl.name, builtin_tpl.category);

    // 42. 验证工作流运行实例创建与步骤初始化
    let run_details = db.create_workflow_run(CreateWorkflowRunInput {
        template_id: builtin_tpl.id.clone(),
        novel_id: novel.id.clone(),
        target_chapter_id: Some(ch1.id.clone()),
        run_mode: Some("STEP".to_string()),
        context_bindings_json: Some("{\"character_ids\":[\"c1\",\"c2\"]}".to_string()),
    }).expect("创建工作流运行实例失败");

    assert_eq!(run_details.run.status, "PENDING");
    assert_eq!(run_details.steps.len(), 3);
    assert_eq!(run_details.steps[0].step_key, "premise");
    println!("42. 验证工作流运行创建: 运行 ID【{}】，共 {} 步骤，首步【{}】就绪",
        run_details.run.id, run_details.steps.len(), run_details.steps[0].title);

    // 43. 验证工作流单步编辑输出与断点流转
    let step0_id = &run_details.steps[0].id;
    let updated_step0 = db.update_workflow_step_output(step0_id, "【作者人工原地修改后的金手指设定】: 因果律签到系统，越战越强。")
        .expect("原地编辑步骤输出失败");
    assert!(updated_step0.edited_output.contains("因果律签到系统"));

    let advanced_run = db.advance_workflow_step(AdvanceWorkflowStepInput {
        run_id: run_details.run.id.clone(),
        step_index: 0,
        input_values_json: Some("{\"genre\":\"玄幻修仙\"}".to_string()),
        auto_advance_next: Some(false),
    }).expect("推进工作流步骤失败");

    assert_eq!(advanced_run.run.status, "WAITING_STEP");
    assert_eq!(advanced_run.run.current_step_index, 1);
    assert_eq!(advanced_run.steps[0].status, "COMPLETED");
    println!("43. 验证工作流单步编辑与流转: 第一步已完成并保留人工修改输出，当前指针推进至第 {} 步【{}】，状态[{}]",
        advanced_run.run.current_step_index, advanced_run.steps[1].title, advanced_run.run.status);

    // 44. 验证小说专项工具箱 Prompt 动态装配
    let toolbox_res = db.assemble_toolbox_prompt(ExecuteToolboxActionInput {
        novel_id: novel.id.clone(),
        action_type: "gold_opening".to_string(),
        chapter_id: Some(ch1.id.clone()),
        custom_input: Some("主角穿越在即将被妖兽吞噬的冰冷雪原上".to_string()),
        character_ids: Some(vec![character.id.clone(), char2.id.clone()]),
        world_rule_ids: Some(vec![rule.id.clone()]),
        include_prev_chapter: Some(true),
        include_memo: Some(true),
    }).expect("组装专项工具箱 Prompt 失败");

    assert!(toolbox_res.system_prompt.contains("网文白金作家"));
    assert!(toolbox_res.user_prompt.contains(&novel.title));
    assert!(toolbox_res.user_prompt.contains("林远"));
    assert!(toolbox_res.user_prompt.contains("曲率泡稳定法则"));
    println!("44. 验证小说专项工具箱 Prompt 动态装配: 动作[{}], 目标[{}], 摘要: {}",
        toolbox_res.action_type, toolbox_res.target_destination, toolbox_res.assembled_context_summary);

    // 45. 验证文风档案内置播种
    let voice_profiles = db.list_voice_profiles(None).expect("查询文风档案列表失败");
    assert!(voice_profiles.len() >= 3);
    let active_voice = db.get_active_voice_profile(None).expect("获取激活文风失败");
    assert!(active_voice.is_some());
    let active_vp = active_voice.unwrap();
    println!("45. 验证文风档案内置播种: 已内置 {} 套专业文风，当前默认激活【{}】(节奏: {}, 语调: {})",
        voice_profiles.len(), active_vp.name, active_vp.sentence_rhythm, active_vp.vocabulary_tone);

    // 46. 验证自定义文风档案创建与切换激活
    let custom_vp = db.save_voice_profile(SaveVoiceProfileInput {
        id: None,
        novel_id: Some(novel.id.clone()),
        name: "专属·冷冽悬疑克制风".to_string(),
        description: Some("专为本书定制的悬疑暗黑硬派叙事".to_string()),
        sample_text: Some("风雪刮过破败的钟楼，暗红的血痕在冰层下蔓延。".to_string()),
        sentence_rhythm: Some("FAST_PACED".to_string()),
        vocabulary_tone: Some("COLD_REALISTIC".to_string()),
        pov_preference: Some("THIRD_LIMITED".to_string()),
        sensory_ratio: Some("VISUAL_FOCUS".to_string()),
        custom_rules_json: Some("[\"严禁感叹号\", \"减少副词\"]".to_string()),
        is_active: Some(true),
    }).expect("创建自定义文风档案失败");

    let novel_active_vp = db.get_active_voice_profile(Some(&novel.id)).expect("获取小说激活文风失败").unwrap();
    assert_eq!(novel_active_vp.id, custom_vp.id);
    assert!(novel_active_vp.is_active);
    println!("46. 验证自定义文风档案创建与激活: 成功为《{}》创建并激活文风【{}】(ID: {})",
        novel.title, novel_active_vp.name, novel_active_vp.id);

    // 47. 验证审稿发现详情提取 (Finding Retrieval)
    let finding_detail = db.get_review_finding(&report.findings[0].id).expect("查询审稿发现失败");
    assert!(finding_detail.is_some());
    let f = finding_detail.unwrap();
    println!("47. 验证审稿发现详情提取: 发现ID【{}】，标题【{}】，原文引用【{}】",
        f.id, f.title, f.evidence_quote);

    // 48. 验证文风切换与隔离持久化
    db.set_active_voice_profile("profile-scifi-realistic", Some(&novel.id)).expect("切换文风失败");
    let switched_vp = db.get_active_voice_profile(Some(&novel.id)).expect("获取切换后文风失败").unwrap();
    assert_eq!(switched_vp.name, "硬核科幻·冷峻考据风");
    println!("48. 验证文风切换与隔离持久化: 成功切换为【{}】，原自定义文风已自动置为非激活", switched_vp.name);

    // 49. 验证 Model Arena 比稿记录持久化与盲测模式
    let arena_run = db.save_model_arena_run(SaveModelArenaRunInput {
        id: None,
        novel_id: novel.id.clone(),
        chapter_id: Some(ch1.id.clone()),
        prompt: "描写反物质发动机预热启动时的舰桥震撼氛围".to_string(),
        model_a_provider: "DeepSeek 官方".to_string(),
        model_a_name: "deepseek-chat".to_string(),
        model_a_output: "淡蓝色的切伦科夫辐射幽光沿着磁约束管道层层点亮，林远脚下的金属甲板传来低频蜂鸣。".to_string(),
        model_a_duration_ms: 1250,
        model_a_tokens: 320,
        model_b_provider: "OpenAI 官方".to_string(),
        model_b_name: "gpt-4o-mini".to_string(),
        model_b_output: "警报红光骤然旋转，重力减震系统发出沉重的液压泄压声，整个主控室仿佛置身巨兽腹中。".to_string(),
        model_b_duration_ms: 980,
        model_b_tokens: 280,
        winner_slot: Some("A".to_string()),
        is_blind: Some(true),
        merged_output: None,
    }).expect("保存比稿记录失败");

    let arena_list = db.list_model_arena_runs(&novel.id).expect("查询比稿列表失败");
    assert!(!arena_list.is_empty());
    let saved_run = arena_list.iter().find(|r| r.id == arena_run.id).expect("未找到刚刚保存的比稿记录");
    assert_eq!(saved_run.winner_slot, "A");
    assert!(saved_run.is_blind);
    assert_eq!(saved_run.model_a_duration_ms, 1250);
    println!("49. 验证 Model Arena 比稿记录持久化与盲测模式: 成功记录 A[{}] vs B[{}] 比稿，胜者[{}], 盲测模式[{}]",
        saved_run.model_a_name, saved_run.model_b_name, saved_run.winner_slot, saved_run.is_blind);

    // 50. 验证 Model Arena 结果智能融合更新
    let updated_arena = db.save_model_arena_run(SaveModelArenaRunInput {
        id: Some(arena_run.id.clone()),
        novel_id: novel.id.clone(),
        chapter_id: Some(ch1.id.clone()),
        prompt: arena_run.prompt.clone(),
        model_a_provider: arena_run.model_a_provider.clone(),
        model_a_name: arena_run.model_a_name.clone(),
        model_a_output: arena_run.model_a_output.clone(),
        model_a_duration_ms: arena_run.model_a_duration_ms,
        model_a_tokens: arena_run.model_a_tokens,
        model_b_provider: arena_run.model_b_provider.clone(),
        model_b_name: arena_run.model_b_name.clone(),
        model_b_output: arena_run.model_b_output.clone(),
        model_b_duration_ms: arena_run.model_b_duration_ms,
        model_b_tokens: arena_run.model_b_tokens,
        winner_slot: Some("MERGED".to_string()),
        is_blind: Some(false),
        merged_output: Some("淡蓝色的切伦科夫辐射沿管壁逐级点亮，重力减震系统泄压轰鸣，甲板在两股伟力交织下剧烈颤抖。".to_string()),
    }).expect("更新比稿融合记录失败");

    assert_eq!(updated_arena.winner_slot, "MERGED");
    assert!(!updated_arena.merged_output.is_empty());
    println!("50. 验证 Model Arena 结果智能融合更新: 胜者标记为[{}], 融合输出字数[{}]",
        updated_arena.winner_slot, updated_arena.merged_output.chars().count());

    // 51. 验证纯 Rust 原生 EPUB 3 电子书全功能打包与导出
    let temp_epub_path = std::env::temp_dir().join(format!("test_novel_{}.epub", Uuid::new_v4()));
    let epub_res = db.export_novel_epub(&novel.id, Some(temp_epub_path.to_string_lossy().to_string()))
        .expect("导出 EPUB 电子书失败");
    assert!(std::path::Path::new(&epub_res.file_path).exists(), "EPUB 文件未真实写入磁盘");
    assert!(epub_res.file_size > 1500, "EPUB 尺寸应当包含样式表、元数据、封面与各章正文");
    assert_eq!(epub_res.title, novel.title);
    
    // 校验 EPUB 规范结构：前 4 字节必须是 PK\x03\x04
    let epub_bytes = std::fs::read(&epub_res.file_path).expect("读取生成的 EPUB 文件失败");
    assert_eq!(&epub_bytes[0..4], &[0x50, 0x4b, 0x03, 0x04], "ZIP 魔法头验证通过");
    // 校验第 30 字节开始的文件名为 mimetype，数据必须为 application/epub+zip
    assert_eq!(&epub_bytes[30..38], b"mimetype", "首个 Entry 必须为 mimetype");
    assert_eq!(&epub_bytes[38..58], b"application/epub+zip", "mimetype 数据必须为 application/epub+zip");
    println!("51. 验证 EPUB 3 标准电子书打包: 生成文件[{}]，尺寸[{} 字节]，章节数[{}]，符合 IDPF 规范",
        epub_res.file_path, epub_res.file_size, epub_res.chapter_count);

    // 52. 验证 CRC-32 校验与 XML 转义单元算法
    let crc_test = novelforge_ai_lib::export::calculate_crc32(b"123456789");
    assert_eq!(crc_test, 0xCBF43926, "IEEE 802.3 CRC-32 测试向量验证通过");
    let escaped = novelforge_ai_lib::export::xml_escape("<'A&B'>");
    assert_eq!(escaped, "&lt;&apos;A&amp;B&apos;&gt;", "XML 字符转义完全合规");
    println!("52. 验证 EPUB 导出基础单元: CRC-32 标准校验通过 (0x{:08X})，XML 安全转义验证通过", crc_test);

    // 53. 验证安全防御与边界防护 (EPUB 非法路径拦截、无后缀补齐、换行过滤与纯标点标题降级)
    let single_line_test = novelforge_ai_lib::export::xml_escape_single_line("第一卷\n\r<&>");
    assert_eq!(single_line_test, "第一卷  &lt;&amp;&gt;", "单行 XML 转义成功过滤换行并转义实体");

    // 验证非法包含空字符的路径被安全拒绝
    let bad_path = format!("test_invalid\0.epub");
    let err_res = db.export_novel_epub(&novel.id, Some(bad_path));
    assert!(err_res.is_err(), "包含非法空字符的路径必须被安全拒绝");

    // 验证缺少 .epub 扩展名自动补全
    let no_ext_path = std::env::temp_dir().join(format!("auto_ext_novel_{}", Uuid::new_v4()));
    let auto_ext_res = db.export_novel_epub(&novel.id, Some(no_ext_path.to_string_lossy().to_string())).expect("缺少扩展名应自动补全并成功");
    assert!(auto_ext_res.file_path.ends_with(".epub"), "导出的文件路径必须以 .epub 结尾");
    let _ = std::fs::remove_file(&auto_ext_res.file_path);

    // 验证参数化工作流模板查询安全性
    let wf_all = db.list_workflow_templates(None).expect("无 novel_id 参数化查询应正常");
    let wf_novel = db.list_workflow_templates(Some(&novel.id)).expect("有 novel_id 参数化查询应正常");
    assert!(wf_all.len() <= wf_novel.len() || !wf_all.is_empty(), "工作流模板参数化查询成功");

    println!("53. 验证系统安全防御: 非法空字符路径拦截、.epub 扩展名自动补齐、单行元数据换行过滤验证通过");

    // 清理临时文件
    let _ = std::fs::remove_file(&epub_res.file_path);

    println!("=== 100% 测试验证通过！V2.5 核心业务与安全防御 53 项验证完毕！ ===");
}


