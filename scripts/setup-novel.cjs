const { callTool } = require('./mcp-call.cjs');

async function main() {
  const novelId = 'c20d91ba-d4ac-41d7-8d3e-dfce04c7e20a';

  console.log('--- 1. 更新作品元数据 ---');
  const updateRes = await callTool('novelforge_update_novel', {
    id: novelId,
    title: '问剑长生：执灯夜行',
    description: '天地为炉，众生为铜。边关弃卒陈九川自积雪死人堆中掘出一盏锈迹斑斑的长明青铜油灯，灯芯燃的不是灯油，而是寿元。在这神魔窃道、仙宗圈养凡尘为药田的绝望世道，他握紧一把缺口的生锈柴刀，在漫漫长夜中逆风斩出道途。',
    genre_profile: '东方古典仙侠 / 沉雄正统与凡人逆争',
    writing_style: '沉雄雅致、画面叙事、感官细腻、骨血冷冽'
  });
  console.log('Update Novel:', updateRes);

  console.log('\n--- 2. 更新分卷大纲 ---');
  const volRes = await callTool('novelforge_update_volume', {
    id: '90d041f8-d6a6-4499-a809-97825c1c9fa1',
    title: '第一卷：初入尘世',
    summary: '边境荒驿雪夜，九川掘得青铜长明灯，清虚剑宗巡山使围剿驿站，宿命死局中斩出第一刀。'
  });
  console.log('Update Volume:', volRes);

  console.log('\n--- 3. 录入核心世界观法则 (Canon Rules) ---');
  const rule1 = await callTool('novelforge_create_world_rule', {
    novel_id: novelId,
    title: '太素寿轮与青铜燃寿律',
    rule_content: '天地修士不可凭空得寿，元婴之下皆有寿数大限。青铜长明灯以凡人或修士寿元为引，燃寿一载，可换神识清明一刻或古修剑意一缕。寿尽则魂消魄散，因果不可逆转。',
    authority_level: 'CANON'
  });
  console.log('Rule 1:', rule1);

  const rule2 = await callTool('novelforge_create_world_rule', {
    novel_id: novelId,
    title: '凡胎通灵与肉身负荷律',
    rule_content: '凡胎肉身未通经脉前，强引灵气入体如吞滚油碎瓷。经脉受损不可单靠静坐恢复，凡人之躯强行催动法器，必受内脏移位、筋骨崩裂之后坐力反噬。',
    authority_level: 'CANON'
  });
  console.log('Rule 2:', rule2);

  const rule3 = await callTool('novelforge_create_world_rule', {
    novel_id: novelId,
    title: '仙宗巡山法度与药田禁令',
    rule_content: '清虚剑宗视边荒凡人为自生自灭之药草，巡山使佩青铜星盘巡狩边塞。凡有凡人私藏古修遗物或灵气异动者，立判为劫修盗种，格杀勿论，夷灭三族。',
    authority_level: 'CANON'
  });
  console.log('Rule 3:', rule3);

  console.log('\n--- 4. 录入核心人物档案 (Character Profiles) ---');
  const char1 = await callTool('novelforge_create_character', {
    novel_id: novelId,
    name: '陈九川',
    aliases: '九川、陈小九、关城斥候卒',
    profile: '年方十七，边陲黑石驿守夜斥候。身裹破旧羊皮袄，十指粗粝布满冻疮与刀茧，左眉角有一道雪狼爪划过的浅白疤痕，眸光沉静如古井。',
    personality: '沉毅孤勇，心思机敏如针，绝不轻信仙门幻相，认准死理百折不悔。对身边相依为命的义父怀有深沉的守护执念。',
    background: '生于北荒白灾之年，被死人堆里爬出来的老斥候陈瘸子收养。在黑石关荒驿以捕狼、鞣皮、辨识风雪痕迹为生，习得一手快绝狠戾的柴刀术。',
    motivation: '保全重伤咳血的义父陈瘸子，在这视凡人如草芥的修仙世道中，争一条能直起脊梁活下去的生路。'
  });
  console.log('Char 1:', char1);

  const char2 = await callTool('novelforge_create_character', {
    novel_id: novelId,
    name: '陈瘸子',
    aliases: '老瘸子、老陈头',
    profile: '黑石荒驿残废老斥候，右腿膝盖早年被战马踩碎，常年跛行。整日腰间别着一个磨得发黑油亮的旱烟袋，咳嗽时胸口如拉破风箱。',
    personality: '圆滑世故，表面贪生怕死、嗜酒爱钱，实则老辣深沉，深谙边关与修仙宗门的血腥内幕。',
    background: '三十年前曾任北凉铁骑前锋营斥候长，曾亲眼目睹清虚宗剑仙以万人血魄生祭剑炉，拼死逃回边荒隐姓埋名。',
    motivation: '倾尽残生护佑九川避开仙宗眼线，绝不让九川卷入修真界的吃人漩涡。'
  });
  console.log('Char 2:', char2);

  const char3 = await callTool('novelforge_create_character', {
    novel_id: novelId,
    name: '柳凌霜',
    aliases: '霜剑客、巡山执事行走',
    profile: '清虚剑宗外门巡山执事，年约二十五，身着一袭不染纤尘的月白云纹鹤氅，腰悬七星青霜剑，面容清隽却眼神漠然如看死物。',
    personality: '冷酷严苛，重宗门规条与个人破境，行事雷厉风行，不容许任何差池与拖延。',
    background: '受困于练气九层圆满多年，急需立下大功换取筑基丹。受命追索前代古修散落北荒的太素古灯。',
    motivation: '查获古修异宝上缴宗门丹堂，夺取筑基丹一举破境。'
  });
  console.log('Char 3:', char3);
}

main().catch(err => {
  console.error('Execution error:', err);
  process.exit(1);
});
