const { callTool } = require('./mcp-call.cjs');

async function run() {
  // Chapter 4
  const ch4 = await callTool('novelforge_read_chapter', { chapter_id: 'f82c0848-e196-4e18-93da-ef5357c969ea' });
  const data4 = typeof ch4 === 'string' ? JSON.parse(ch4) : ch4;
  let text4 = data4.content;
  text4 = text4.replace('两台如同史前重甲巨兽般的深绿色柴油发电机组', '两台沉重浑厚的深绿色十二缸柴油发电机组');
  text4 = text4.replace('他走到控制台前，深吸了一口气，将预热电门扳向“预热”档位。', '他走到控制台前，手腕果断下压，将预热电门扳向“预热”档位。');
  await callTool('novelforge_write_chapter', {
    chapter_id: 'f82c0848-e196-4e18-93da-ef5357c969ea',
    content: text4,
    source_type: 'AI_HUMANIZER_POLISH'
  });
  console.log('Chapter 4 polished!');

  // Chapter 5
  const ch5 = await callTool('novelforge_read_chapter', { chapter_id: '7b48ab50-3541-46dd-9ec2-8c3d522fcde1' });
  const data5 = typeof ch5 === 'string' ? JSON.parse(ch5) : ch5;
  let text5 = data5.content;
  text5 = text5.replace('极高浓度的深蚀微粒如同倾盆暴雨般砸落地面。', '极高浓度的深蚀微粒裹挟着尖锐石屑，暴烈地轰砸在冻土上。');
  await callTool('novelforge_write_chapter', {
    chapter_id: '7b48ab50-3541-46dd-9ec2-8c3d522fcde1',
    content: text5,
    source_type: 'AI_HUMANIZER_POLISH'
  });
  console.log('Chapter 5 polished!');
}

run().catch(console.error);
