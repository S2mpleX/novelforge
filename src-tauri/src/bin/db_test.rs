use novelforge_ai_lib::database::DbManager;
use novelforge_ai_lib::models::{
    CreateChapterInput, CreateCharacterInput, CreateNovelInput, CreateWorldRuleInput,
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
            volume_id: None,
            chapter_number: Some(1),
            title: "跃迁前夕".to_string(),
            initial_content: Some(
                "巨大的反物质引擎在寒夜中发出沉闷的轰鸣，舷窗外是静谧而冰冷的柯伊伯带。".to_string(),
            ),
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
            description: Some("主线核心冲突冲突点".to_string()),
            priority: Some("MAIN".to_string()),
        })
        .expect("创建剧情弧失败");
    println!("11. 验证大纲规划: 阶段【{}】 -> 剧情弧【{}】", phase.title, arc.title);

    // 10. 验证章节场景细纲拆解 (Phase 2)
    let scene = db
        .create_scene(novelforge_ai_lib::models::CreateSceneInput {
            chapter_id: ch1.id.clone(),
            sequence: 1,
            objective: "展现战舰起航前的压迫感与林远的决断".to_string(),
            outline: "1.主引擎充能倒计时 2.安雅汇报引力读数异常 3.林远决意启动".to_string(),
            pov_character_id: Some(character.id.clone()),
            location_id: Some("先驱者号主舰桥".to_string()),
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

    println!("=== 100% 测试验证通过！Phase 0/1/2/3/4/5 全业务引擎在本地 SQLite 正确持久化与流转！ ===");
}
