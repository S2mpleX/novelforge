const { callTool } = require('./mcp-call.cjs');

async function main() {
  const novelId = 'c20d91ba-d4ac-41d7-8d3e-dfce04c7e20a';
  const volumeId = '90d041f8-d6a6-4499-a809-97825c1c9fa1';

  console.log('--- 1. 创建第一章章节 ---');
  const chapterRes = await callTool('novelforge_create_chapter', {
    novel_id: novelId,
    volume_id: volumeId,
    title: '第一章：雪夜燃灯',
    chapter_goal: '黑石荒驿暴雪夜，九川从冻骨坑搜得一盏无芯无油的青铜古灯；清虚宗巡山使循着星盘死咬荒驿，九川为护重伤咳血的义父，在生死边缘以寿元为引点燃古灯，斩出撼动仙宗的第一刀。'
  });
  console.log('Chapter Created:', chapterRes);

  const chapter = JSON.parse(chapterRes);
  const chapterId = chapter.id;

  console.log('\n--- 2. 装配 L0~L4 五层长期记忆上下文 ---');
  const contextPack = await callTool('novelforge_assemble_context', {
    novel_id: novelId,
    chapter_id: chapterId,
    prompt_intent: '北荒暴雪之夜，黑石荒驿，陈九川与陈瘸子面临清虚剑宗巡山使上门盘查的危机，描写寒冷真实的生理细节、破败驿站的物象互动与点灯生死抉择。'
  });
  console.log('Context Pack Assembled Length:', contextPack.length);
  console.log('--- Context Pack Preview ---');
  console.log(contextPack);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
