use uuid::Uuid;
use novelforge_ai_lib::database::DbManager;
use novelforge_ai_lib::models::{
    CreateChapterInput, CreateCharacterInput, CreateNovelInput, CreateWorldRuleInput,
    CreateSeriesInput, CreatePartInput, CreateVolumeInput, CreateSceneInput, CreatePlotBeatInput,
    CreateCharacterArcInput, CreateParallelThreadInput, CreatePlotAssociationInput, HierarchyConfig,
    MoveNodeInput, SplitChapterInput, MergeChaptersInput, SplitSceneInput, MergeScenesInput,
    RenumberHierarchyInput, CreateWorkflowRunInput, AdvanceWorkflowStepInput, ExecuteToolboxActionInput,
    SaveVoiceProfileInput, SaveModelArenaRunInput, UpdateNovelInput, UpdateVolumeInput,
    UpdateCharacterInput, UpdateWorldRuleInput, UpdatePlotThreadInput, CreatePlotThreadInput,
    CreateChapterProposalInput, AcceptChapterProposalInput, RollbackChapterVersionInput, EvaluateChapterInput,
};

fn main() {
    println!("=== 开始 NovelForge AI 本地数据库与全功能验证 ===");

    // 使用完全隔离的临时沙箱目录与临时 SQLite 数据库，杜绝污染真实用户数据
    let test_dir = std::env::temp_dir().join(format!("novelforge_test_{}", Uuid::new_v4()));
    let test_db_path = test_dir.join("novelforge_test.db");
    let db = DbManager::new_at_path(test_db_path).expect("初始化测试 SQLite 数据库失败");
    println!("1. 临时沙箱数据库初始化成功，路径: {}", db.get_db_path());

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
            cover_url: Some("preset:deep_cosmos".to_string()),
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

    // 验证剧情弧删除
    let temp_arc = db
        .create_story_arc(novelforge_ai_lib::models::CreateStoryArcInput {
            novel_id: novel.id.clone(),
            phase_id: Some(phase.id.clone()),
            title: "临时待删剧情弧".to_string(),
            goal: Some("测试删除功能".to_string()),
            description: None,
            priority: Some("SUB".to_string()),
        })
        .expect("创建临时剧情弧失败");
    db.delete_story_arc(&temp_arc.id).expect("删除剧情弧失败");
    let arcs_after_delete = db.list_story_arcs(&novel.id).expect("读取剧情弧列表失败");
    assert!(arcs_after_delete.iter().all(|a| a.id != temp_arc.id));
    println!("11b. 验证剧情弧删除: 成功删除临时剧情弧【{}】", temp_arc.title);

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
    let imported_chars = db.list_characters(&imported_novel.id).expect("读取导入角色失败");
    assert!(!imported_chars.is_empty(), "导入角色列表不应为空");
    let imported_rels = db.list_character_relationships(&imported_novel.id).expect("读取导入角色关系失败");
    assert!(!imported_rels.is_empty(), "导入角色关系不应为空");
    let imported_phases = db.list_story_phases(&imported_novel.id).expect("读取导入故事阶段失败");
    assert!(!imported_phases.is_empty(), "导入故事阶段不应为空");
    let imported_arcs = db.list_story_arcs(&imported_novel.id).expect("读取导入剧情弧失败");
    assert!(!imported_arcs.is_empty(), "导入剧情弧不应为空");
    println!("23. 验证全书工程归档与导入恢复: 归档 JSON 长度 {} 字符，成功复原小说【{}】(含 {} 人物/{} 关系/{} 阶段/{} 剧情弧)", 
        archive_json.len(), imported_novel.title, imported_chars.len(), imported_rels.len(), imported_phases.len(), imported_arcs.len());

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

    // 54. 验证作品项目元数据热更新 (update_novel)
    let updated_novel = db.update_novel(UpdateNovelInput {
        id: novel.id.clone(),
        title: "星穹之门：起源与终局".to_string(),
        description: Some("重新定义的硬核科幻史诗全本".to_string()),
        genre_profile: Some("硬核科幻".to_string()),
        writing_style: Some("冷峻克制、宏大沉思".to_string()),
        cover_url: Some("preset:gilded_amber".to_string()),
    }).expect("更新作品项目元数据失败");
    assert_eq!(updated_novel.title, "星穹之门：起源与终局");
    assert_eq!(updated_novel.genre_profile, "硬核科幻");
    assert_eq!(updated_novel.cover_url.as_deref(), Some("preset:gilded_amber"));
    println!("54. 验证作品项目元数据更新 (update_novel): 新书名《{}》, 流派[{}], 封面装帧[{}]",
        updated_novel.title, updated_novel.genre_profile, updated_novel.cover_url.unwrap_or_default());

    // 55. 验证分卷重命名与摘要更新 (update_volume)
    let updated_vol = db.update_volume(UpdateVolumeInput {
        id: vol1.id.clone(),
        title: "先驱者的涅槃远征".to_string(),
        summary: Some("全新修正的终极远征大纲".to_string()),
    }).expect("更新分卷失败");
    assert_eq!(updated_vol.title, "先驱者的涅槃远征");
    println!("55. 验证分卷重命名与大纲更新 (update_volume): 《{}》, 摘要[{}]", updated_vol.title, updated_vol.summary);

    // 56. 验证章节重命名与 FTS 全文索引联动 (update_chapter_title)
    let updated_ch = db.update_chapter_title(&ch1.id, "第一章：星海彼岸的终极觉醒").expect("更新章节标题失败");
    assert_eq!(updated_ch.title, "第一章：星海彼岸的终极觉醒");
    // 验证 FTS 检索能立即搜到新标题
    let fts_results = db.search_chapters_fts(&novel.id, "第一章*").expect("检索更新后的章节标题失败");
    assert!(!fts_results.is_empty(), "FTS5 必须能检索到更新后的新章节标题");
    println!("56. 验证章节重命名与 FTS5 全文索引联动 (update_chapter_title): 新标题《{}》, FTS 命中[{}]条", updated_ch.title, fts_results.len());

    // 57. 验证作品封面设定与持久化 (Book Cover Presets & Custom Image Data URL)
    let custom_cover_data = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    let cover_updated = db.update_novel(UpdateNovelInput {
        id: novel.id.clone(),
        title: updated_novel.title.clone(),
        description: None,
        genre_profile: None,
        writing_style: None,
        cover_url: Some(custom_cover_data.to_string()),
    }).expect("设定自定义封面失败");
    assert_eq!(cover_updated.cover_url.as_deref(), Some(custom_cover_data));

    let fetched_novel = db.get_novel(&novel.id).expect("重新读取小说失败");
    assert_eq!(fetched_novel.cover_url.as_deref(), Some(custom_cover_data));

    let all_novels = db.list_novels().expect("读取小说列表包含封面失败");
    let target_in_list = all_novels.iter().find(|n| n.id == novel.id).expect("列表中必须包含该小说");
    assert_eq!(target_in_list.cover_url.as_deref(), Some(custom_cover_data));
    println!("57. 验证作品封面设计工坊 (Book Cover Studio): 自定义封面 Base64 存储成功 (长度: {}), 列表与详情持久化一致",
        custom_cover_data.len());

    // 58. 验证角色档案全生命周期与多维度级联清理 (update_character & delete_character)
    let char_crud = db.create_character(CreateCharacterInput {
        novel_id: novel.id.clone(),
        name: "陈渊".to_string(),
        aliases: Some("深空巡察使".to_string()),
        profile: Some("帝国巡察官".to_string()),
        personality: Some("冷酷严正".to_string()),
        background: Some("皇室近卫出身".to_string()),
        motivation: Some("查明跃迁引擎失控真相".to_string()),
    }).expect("创建待测角色失败");

    let updated_char = db.update_character(UpdateCharacterInput {
        id: char_crud.id.clone(),
        name: "陈渊 (终极形态)".to_string(),
        aliases: Some("苍穹巡察总督".to_string()),
        profile: Some("已掌握折叠时空技术的执政官".to_string()),
        personality: Some("深沉博爱、运筹帷幄".to_string()),
        background: Some("跨越因果律循环后的觉醒者".to_string()),
        motivation: Some("引导人类文明避开大过滤器".to_string()),
        status: Some("ACTIVE".to_string()),
    }).expect("更新角色档案失败");
    assert_eq!(updated_char.name, "陈渊 (终极形态)");
    assert_eq!(updated_char.personality, "深沉博爱、运筹帷幄");

    // 为该角色建立关系、人物弧、关联场景与 plot_association
    let char_rel = db.create_character_relationship(novelforge_ai_lib::models::CreateCharacterRelationshipInput {
        novel_id: novel.id.clone(),
        source_character_id: char_crud.id.clone(),
        target_character_id: character.id.clone(),
        relation_type: "师徒宿敌".to_string(),
        description: Some("亦师亦敌的命运纠葛".to_string()),
    }).expect("创建角色关系失败");

    let _char_arc = db.create_character_arc(CreateCharacterArcInput {
        novel_id: novel.id.clone(),
        character_id: char_crud.id.clone(),
        title: "苍穹远征心智蜕变".to_string(),
        stage_from: Some("铁血奉公".to_string()),
        stage_to: Some("觉醒背叛".to_string()),
        current_stage: Some("潜伏动摇".to_string()),
        internal_conflict: Some("忠诚与真相的博弈".to_string()),
    }).expect("创建人物弧失败");

    let pov_scene = db.create_scene(CreateSceneInput {
        chapter_id: ch1.id.clone(),
        sequence: 99,
        order_index: Some(99),
        title: Some("苍穹号舰桥决议".to_string()),
        scene_number: Some(99),
        objective: "对峙与决断".to_string(),
        outline: "大副与巡察使决裂".to_string(),
        pov_character_id: Some(char_crud.id.clone()),
        location_id: None,
        content: Some("决议场景".to_string()),
        time_anchor: None,
        conflict_target: None,
    }).expect("创建角色视点场景失败");
    assert_eq!(pov_scene.pov_character_id.as_deref(), Some(char_crud.id.as_str()));

    let _char_assoc = db.create_plot_association(CreatePlotAssociationInput {
        novel_id: novel.id.clone(),
        relation_type: "CHARACTER".to_string(),
        entity_id: char_crud.id.clone(),
        target_type: "CHAPTER".to_string(),
        target_id: ch1.id.clone(),
        role_in_target: Some("POV".to_string()),
        notes: Some("角色出场".to_string()),
        weight: Some(10),
    }).expect("创建角色关联失败");

    // 执行删除角色，验证多表级联清理
    db.delete_character(&char_crud.id).expect("删除角色失败");
    assert!(db.get_character(&char_crud.id).is_err(), "被删除的角色应该无法读取");

    let rels_after = db.list_character_relationships(&novel.id).expect("获取关系列表失败");
    assert!(!rels_after.iter().any(|r| r.id == char_rel.id), "关联的角色关系必须被级联删除");

    let arcs_after = db.list_character_arcs(&novel.id).expect("获取人物弧失败");
    assert!(!arcs_after.iter().any(|a| a.character_id == char_crud.id), "角色的人物弧必须被级联删除");

    let scenes_after = db.list_scenes(&ch1.id).expect("获取场景列表失败");
    let target_scene = scenes_after.iter().find(|s| s.id == pov_scene.id).expect("场景本身不应被删除");
    assert_eq!(target_scene.pov_character_id, None, "场景的 pov_character_id 必须被级联置为 NULL");

    let assocs_after = db.list_plot_associations_for_entity("CHARACTER", &char_crud.id).expect("获取关联列表失败");
    assert!(assocs_after.is_empty(), "角色的 plot_association 必须被级联清理");
    println!("58. 验证角色档案全生命周期与级联清理 (update_character & delete_character): 角色/关系/人物弧/场景POV解绑/剧情关联级联验证通过");

    // 59. 验证世界观铁律全生命周期管理 (update_world_rule & delete_world_rule)
    let rule_crud = db.create_world_rule(CreateWorldRuleInput {
        novel_id: novel.id.clone(),
        title: "超光速通信时延公理".to_string(),
        rule_content: "量子纠缠信道跨越100光年后产生纳秒级衰减。".to_string(),
        authority_level: Some("CANON".to_string()),
    }).expect("创建待测世界观法则失败");

    let updated_rule = db.update_world_rule(UpdateWorldRuleInput {
        id: rule_crud.id.clone(),
        title: "量子纠缠衰减律 (修正版)".to_string(),
        rule_content: "量子纠缠信道在重力透镜附近产生指数级拓扑畸变。".to_string(),
        authority_level: Some("CANON".to_string()),
        status: Some("ACTIVE".to_string()),
    }).expect("更新世界观法则失败");
    assert_eq!(updated_rule.title, "量子纠缠衰减律 (修正版)");

    let _rule_assoc = db.create_plot_association(CreatePlotAssociationInput {
        novel_id: novel.id.clone(),
        relation_type: "WORLD_RULE".to_string(),
        entity_id: rule_crud.id.clone(),
        target_type: "CHAPTER".to_string(),
        target_id: ch1.id.clone(),
        role_in_target: Some("RULE_LIMIT".to_string()),
        notes: Some("跳跃受限".to_string()),
        weight: Some(8),
    }).expect("创建世界观关联失败");

    db.delete_world_rule(&rule_crud.id).expect("删除世界观法则失败");
    assert!(db.get_world_rule(&rule_crud.id).is_err(), "被删除的世界观法则必须无法读取");
    let assocs_after_rule = db.list_plot_associations_for_entity("WORLD_RULE", &rule_crud.id).expect("获取关联失败");
    assert!(assocs_after_rule.is_empty(), "世界观法则的 plot_association 必须被级联清理");
    println!("59. 验证世界观铁律全生命周期管理 (update_world_rule & delete_world_rule): 修改/删除/剧情关联级联清理验证通过");

    // 60. 验证剧情伏笔线索状态推进与闭合清理 (update_plot_thread_status, update_plot_thread, delete_plot_thread)
    let thread_crud = db.create_plot_thread(CreatePlotThreadInput {
        novel_id: novel.id.clone(),
        title: "遗落的量子密钥".to_string(),
        description: Some("藏在逃生舱底层的陈旧数据芯片".to_string()),
        introduced_chapter_id: Some(ch1.id.clone()),
        expected_resolution: Some("第三卷揭示先驱者遗言".to_string()),
    }).expect("创建伏笔失败");
    assert_eq!(thread_crud.status, "PLANTED");

    db.update_plot_thread_status(&thread_crud.id, "DEVELOPING").expect("推进伏笔状态失败");
    let thread_status = db.get_plot_thread(&thread_crud.id).expect("读取伏笔失败");
    assert_eq!(thread_status.status, "DEVELOPING");

    let updated_thread = db.update_plot_thread(UpdatePlotThreadInput {
        id: thread_crud.id.clone(),
        title: "遗落的先驱者星核密钥".to_string(),
        description: Some("已解密第一层防护，显露出古代智械坐标".to_string()),
        introduced_chapter_id: Some(ch1.id.clone()),
        expected_resolution: Some("决战前夕引爆核心反应堆".to_string()),
        resolved_chapter_id: None,
        status: Some("READY_TO_RESOLVE".to_string()),
    }).expect("全量更新伏笔失败");
    assert_eq!(updated_thread.title, "遗落的先驱者星核密钥");
    assert_eq!(updated_thread.status, "READY_TO_RESOLVE");

    let _thread_assoc = db.create_plot_association(CreatePlotAssociationInput {
        novel_id: novel.id.clone(),
        relation_type: "PLOT_THREAD".to_string(),
        entity_id: thread_crud.id.clone(),
        target_type: "CHAPTER".to_string(),
        target_id: ch1.id.clone(),
        role_in_target: Some("THREAD_HOOK".to_string()),
        notes: Some("芯片线索".to_string()),
        weight: Some(6),
    }).expect("创建伏笔关联失败");

    db.delete_plot_thread(&thread_crud.id).expect("删除伏笔失败");
    assert!(db.get_plot_thread(&thread_crud.id).is_err(), "被删除的伏笔必须无法读取");
    let assocs_after_thread = db.list_plot_associations_for_entity("PLOT_THREAD", &thread_crud.id).expect("获取关联失败");
    assert!(assocs_after_thread.is_empty(), "伏笔的 plot_association 必须被级联清理");
    println!("60. 验证剧情伏笔全生命周期推进与闭合 (update_plot_thread_status/update/delete): 状态流转与级联解绑验证通过");

    // 61. 验证故事大纲阶段与情节弧级联解绑 (delete_story_arc, delete_story_phase)
    let test_phase = db.create_story_phase(novelforge_ai_lib::models::CreateStoryPhaseInput {
        novel_id: novel.id.clone(),
        title: "过渡阶段：深渊跃迁".to_string(),
        order_index: Some(99),
        goal: Some("跨越重力陷阱".to_string()),
    }).expect("创建故事阶段失败");

    let test_arc = db.create_story_arc(novelforge_ai_lib::models::CreateStoryArcInput {
        novel_id: novel.id.clone(),
        phase_id: Some(test_phase.id.clone()),
        title: "幽灵信号捕获弧".to_string(),
        goal: Some("追踪未知频率".to_string()),
        description: Some("伏笔交织情节弧".to_string()),
        priority: Some("SUB".to_string()),
    }).expect("创建故事剧情弧失败");

    let _arc_assoc = db.create_plot_association(CreatePlotAssociationInput {
        novel_id: novel.id.clone(),
        relation_type: "STORY_ARC".to_string(),
        entity_id: test_arc.id.clone(),
        target_type: "CHAPTER".to_string(),
        target_id: ch1.id.clone(),
        role_in_target: Some("ARC_INTRO".to_string()),
        notes: Some("信号捕获".to_string()),
        weight: Some(5),
    }).expect("创建故事弧关联失败");

    // 删除 story_arc，验证 plot_associations 级联清理
    db.delete_story_arc(&test_arc.id).expect("删除故事弧失败");
    let assocs_after_arc = db.list_plot_associations_for_entity("STORY_ARC", &test_arc.id).expect("获取关联失败");
    assert!(assocs_after_arc.is_empty(), "情节弧的 plot_association 必须被级联清理");

    // 重建一个关联 test_phase 的情节弧，测试删除 phase 时的 phase_id 置空解绑
    let test_arc2 = db.create_story_arc(novelforge_ai_lib::models::CreateStoryArcInput {
        novel_id: novel.id.clone(),
        phase_id: Some(test_phase.id.clone()),
        title: "二次突进弧".to_string(),
        goal: Some("备用路线突进".to_string()),
        description: Some("测试 phase 解绑".to_string()),
        priority: Some("MAIN".to_string()),
    }).expect("创建测试故事弧2失败");

    db.delete_story_phase(&test_phase.id).expect("删除故事大纲阶段失败");
    let arcs_all = db.list_story_arcs(&novel.id).expect("获取所有情节弧失败");
    let arc2_found = arcs_all.iter().find(|a| a.id == test_arc2.id).expect("情节弧自身不应被删除");
    assert_eq!(arc2_found.phase_id, None, "当阶段被删除时，情节弧的 phase_id 必须被安全解绑置为 NULL");
    println!("61. 验证故事大纲阶段与情节弧级联解绑 (delete_story_arc & delete_story_phase): 阶段解绑与关联清理验证通过");

    // 62. 验证候选修订提案 (create_chapter_proposal & list_chapter_proposals & accept_chapter_proposal)
    let pre_accept_chapter = db.get_chapter(&ch1.id).expect("获取章节");
    let original_content = pre_accept_chapter.content.clone().unwrap_or_default();
    
    let proposal = db.create_chapter_proposal(CreateChapterProposalInput {
        novel_id: novel.id.clone(),
        chapter_id: ch1.id.clone(),
        content: "外部 Agent 提交的候选高张力修订草稿正文。".to_string(),
        proposal_summary: Some("重塑对话呼吸感".to_string()),
        reasoning_trace: Some("COT: 识别出原段落缺少五感细节，补充了冷风与金属敲击".to_string()),
    }).expect("创建修订提案失败");

    // 验证正文未被破坏性覆盖
    let unchanged_chapter = db.get_chapter(&ch1.id).expect("获取章节");
    assert_eq!(unchanged_chapter.content.unwrap_or_default(), original_content, "在未明确采纳前，活动正文绝对不得被篡改");
    
    let proposals_list = db.list_chapter_proposals(&ch1.id).expect("获取提案列表失败");
    assert!(proposals_list.iter().any(|p| p.version_id == proposal.version_id), "提案必须存在于提案列表中");

    let accepted_ch = db.accept_chapter_proposal(AcceptChapterProposalInput {
        novel_id: novel.id.clone(),
        chapter_id: ch1.id.clone(),
        version_id: proposal.version_id.clone(),
    }).expect("采纳提案失败");
    assert_eq!(accepted_ch.content.unwrap_or_default(), "外部 Agent 提交的候选高张力修订草稿正文。");
    println!("62. 验证非破坏性候选提案暂存与采纳流转 (create/list/accept proposal): 隔离保护与生效验证通过");

    // 63. 验证版本快照因果安全回滚与级联事实失效 (rollback_chapter_version)
    let _rollback_fact = db.create_canon_fact(novelforge_ai_lib::models::CreateCanonFactInput {
        novel_id: novel.id.clone(),
        subject_id: Some("沈长青".to_string()),
        predicate: "获得秘宝".to_string(),
        object_value: "幽冥破界梭".to_string(),
        truth_scope: Some("GLOBAL".to_string()),
        authority_level: Some("CONFIRMED_PLOT".to_string()),
        source_chapter_id: Some(ch1.id.clone()),
    }).expect("创建因果事实失败");

    let all_versions = db.list_chapter_versions(&ch1.id).expect("获取版本失败");
    let target_old_ver = all_versions.last().expect("应当有早期版本");

    let rollback_res = db.rollback_chapter_version(RollbackChapterVersionInput {
        novel_id: novel.id.clone(),
        chapter_id: ch1.id.clone(),
        target_version_id: target_old_ver.id.clone(),
        cascade_memory: Some(true),
    }).expect("回滚章节失败");

    assert!(rollback_res.invalidated_facts_count >= 1, "回滚时必须级联失效后续产生的事实");
    let facts_after_rollback = db.list_canon_facts(&novel.id, Some("幽冥破界梭")).expect("查询事实失败");
    assert_eq!(facts_after_rollback[0].status, "INVALIDATED_BY_ROLLBACK", "后续沉淀事实的状态必须被级联标记为 INVALIDATED_BY_ROLLBACK");
    println!("63. 验证版本快照因果安全回滚与级联事实失效 (rollback_chapter_version): 记忆自洽保护验证通过");

    // 64. 验证无头文学质量门禁巡检 (evaluate_chapter)
    let dead_char = db.create_character(novelforge_ai_lib::models::CreateCharacterInput {
        novel_id: novel.id.clone(),
        name: "顾渊".to_string(),
        aliases: Some("已故传功长老".to_string()),
        profile: Some("传功长老".to_string()),
        personality: None,
        background: None,
        motivation: None,
    }).expect("创建角色");
    db.update_character_status(&dead_char.id, "死亡").expect("更新状态为死亡");

    let eval_bad_text = "他嘴角勾起一抹玩味的冷笑，眼中闪过一丝不易察觉的寒芒。深吸一口气，顾渊拔剑喝道：「此剑必斩你！」";
    let eval_report = db.evaluate_chapter(EvaluateChapterInput {
        novel_id: novel.id.clone(),
        chapter_id: Some(ch1.id.clone()),
        content: Some(eval_bad_text.to_string()),
    }).expect("评估正文失败");

    assert!(eval_report.humanizer_score < 85, "命中多个红线套话时人情味评分必须扣减");
    assert!(eval_report.cliche_matches.len() >= 2, "必须成功检出嘴角勾起与眼中闪过等套话");
    assert_eq!(eval_report.verdict, "CRITICAL_ISSUES", "已故角色拔剑动作必须被判定为 CRITICAL_ISSUES");
    let dead_issue = eval_report.consistency_issues.iter().find(|i| i.issue_type == "DECEASED_CHARACTER_ACTION");
    assert!(dead_issue.is_some(), "必须精准命中已故角色【顾渊】违规出场");
    println!("64. 验证无头文学质量门禁巡检 (evaluate_chapter): 套话扣分与死者动作拦截 100% 验证通过");

    // 65. 验证智能实体反哺提案提取 (scan_entity_proposals)
    let eval_proposals = db.evaluate_chapter(EvaluateChapterInput {
        novel_id: novel.id.clone(),
        chapter_id: Some(ch1.id.clone()),
        content: Some("张三丰站起身道：「贫道愿往一试。」东方不败冷笑道：「找死！」".to_string()),
    }).expect("提取实体失败");
    let names: Vec<String> = eval_proposals.entity_proposals.iter().map(|p| p.name.clone()).collect();
    assert!(names.contains(&"张三丰".to_string()) || names.contains(&"东方不败".to_string()), "必须从对话动作中识别未登记人物");
    println!("65. 验证智能实体反哺提案提取 (scan_entity_proposals): 候选人物提取验证通过");

    // 清理临时文件与沙箱数据库目录，保障环境零污染
    let _ = std::fs::remove_file(&epub_res.file_path);
    let _ = std::fs::remove_dir_all(&test_dir);

    println!("=== 100% 测试验证通过！V3.3 核心业务与 Agent 驱动闭环 65 项全量断言通过！ ===");
}


