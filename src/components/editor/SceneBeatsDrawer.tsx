import React, { useState } from 'react';
import {
  Clapperboard,
  Plus,
  Sparkles,
  Trash2,
  Edit3,
  Save,
  X,
  ChevronUp,
  ChevronDown,
  MapPin,
  User,
  FileText,
  Target,
} from 'lucide-react';
import { useNovelStore } from '../../stores/useNovelStore';
import { toast } from '../../stores/useToastStore';
import { api } from '../../utils/tauriBridge';
import { confirmDialog } from '../../utils/dialog';
import type { Scene, CreateSceneInput, UpdateSceneInput, Character } from '../../types';

interface SceneBeatsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  characters: Character[];
  onInsertScaffoldToEditor: (scaffoldHtml: string) => void;
  onFocusSceneInEditor?: (sceneNumber: number, title?: string) => void;
}

export const SceneBeatsDrawer: React.FC<SceneBeatsDrawerProps> = ({
  isOpen,
  onClose,
  characters,
  onInsertScaffoldToEditor,
  onFocusSceneInEditor,
}) => {
  const {
    activeChapter,
    scenes,
    loadScenesForChapter,
  } = useNovelStore();

  const [isPlanning, setIsPlanning] = useState(false);
  const [planningGoal, setPlanningGoal] = useState('');
  const [showPlanningDialog, setShowPlanningDialog] = useState(false);

  // 编辑中场景状态
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Scene>>({});

  if (!isOpen) return null;

  // 1. AI 智能规划节拍
  const handleStartAiPlanning = async () => {
    if (!activeChapter) return;
    const goal = planningGoal.trim() || '推进本章主线冲突，打造波澜起伏的情节节拍与章末悬念';
    setIsPlanning(true);
    try {
      toast.info('AI 编剧中', '正在深度推演本章起承转合场景节拍...');

      const result = await api.runScenePlanning(activeChapter.id, goal);
      await loadScenesForChapter(activeChapter.id);

      toast.success(
        '节拍规划成功',
        `成功为《${activeChapter.title}》拆解出 ${result.length} 个结构化场景节拍！`
      );
      setShowPlanningDialog(false);
      setPlanningGoal('');
    } catch (err: any) {
      console.error('场景节拍规划失败:', err);
      toast.error('规划失败', String(err.message || err));
    } finally {
      setIsPlanning(false);
    }
  };

  // 2. 手动创建场景
  const handleCreateScene = async () => {
    if (!activeChapter) return;
    try {
      const nextSeq = scenes.length > 0 ? Math.max(...scenes.map((s) => s.sequence)) + 1 : 1;
      const input: CreateSceneInput = {
        chapter_id: activeChapter.id,
        sequence: nextSeq,
        scene_number: nextSeq,
        title: `场景 ${nextSeq}`,
        objective: '新场景核心行动目标',
        outline: '1. 引入起因\n2. 发生冲突\n3. 达成结果',
        location_id: '',
      };
      const created = await api.createScene(input);
      await loadScenesForChapter(activeChapter.id);
      toast.success('新增成功', `已新增第 ${nextSeq} 场景节拍卡片`);

      // 自动进入编辑态
      setEditingId(created.id);
      setEditForm(created);
    } catch (err: any) {
      console.error('创建场景失败:', err);
      toast.error('创建场景失败', String(err.message || err));
    }
  };

  // 3. 开始编辑
  const handleStartEdit = (scene: Scene) => {
    setEditingId(scene.id);
    setEditForm({ ...scene });
  };

  // 4. 保存编辑
  const handleSaveEdit = async () => {
    if (!editingId || !activeChapter) return;
    try {
      const input: UpdateSceneInput = {
        id: editingId,
        title: editForm.title,
        sequence: editForm.sequence,
        objective: editForm.objective,
        outline: editForm.outline,
        pov_character_id: editForm.pov_character_id,
        location_id: editForm.location_id,
        conflict_target: editForm.conflict_target,
        status: editForm.status,
      };
      await api.updateScene(input);
      await loadScenesForChapter(activeChapter.id);
      setEditingId(null);
      setEditForm({});
      toast.success('保存成功', '场景细纲节拍已更新');
    } catch (err: any) {
      console.error('更新场景失败:', err);
      toast.error('保存失败', String(err.message || err));
    }
  };

  // 5. 删除场景
  const handleDeleteScene = async (sceneId: string, title?: string) => {
    if (!activeChapter) return;
    const confirmed = await confirmDialog({
      title: '删除场景节拍',
      message: `确定要移除场景「${title || '未命名场景'}」吗？该场景设定的目标与节拍将被清理。`,
      confirmText: '确认删除',
      tone: 'danger',
    });
    if (!confirmed) return;

    try {
      await api.deleteScene(sceneId);
      await loadScenesForChapter(activeChapter.id);
      if (editingId === sceneId) {
        setEditingId(null);
        setEditForm({});
      }
      toast.info('已移除', '场景节拍已删除');
    } catch (err: any) {
      console.error('删除场景失败:', err);
      toast.error('删除失败', String(err.message || err));
    }
  };

  // 6. 状态流转快捷切换
  const handleStatusChange = async (scene: Scene, newStatus: string) => {
    if (!activeChapter) return;
    try {
      await api.updateSceneStatus(scene.id, newStatus);
      await loadScenesForChapter(activeChapter.id);
    } catch (err: any) {
      console.error('修改状态失败:', err);
      toast.error('修改状态失败', String(err.message || err));
    }
  };

  // 7. 上下调序
  const handleMoveOrder = async (index: number, direction: 'UP' | 'DOWN') => {
    if (!activeChapter) return;
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= scenes.length) return;

    const curr = scenes[index];
    const other = scenes[targetIndex];

    try {
      // 交换 sequence
      await api.updateScene({ id: curr.id, sequence: other.sequence });
      await api.updateScene({ id: other.id, sequence: curr.sequence });
      await loadScenesForChapter(activeChapter.id);
    } catch (err: any) {
      console.error('调整顺序失败:', err);
    }
  };

  // 8. 装配至正文提纲
  const handleAssembleToDraft = () => {
    if (scenes.length === 0) {
      toast.warning('提示', '当前章节尚无场景节拍，请先添加或通过 AI 规划。');
      return;
    }

    const htmlBlocks = scenes.map((s, idx) => {
      const povChar = characters.find((c: Character) => c.id === s.pov_character_id);
      const povName = povChar ? povChar.name : '主视角';
      const locText = s.location_id ? ` ｜ 地点：${s.location_id}` : '';
      const conflictText = s.conflict_target ? ` ｜ 冲突：${s.conflict_target}` : '';
      const outlineLines = s.outline
        ? s.outline
            .split('\n')
            .filter((l) => l.trim().length > 0)
            .map((l) => `<p><em>· ${l.trim()}</em></p>`)
            .join('')
        : '';

      return (
        `<h3>【场景 ${idx + 1}：${s.title || '节拍推进'}】</h3>` +
        `<p style="color: #78716c; font-size: 0.9em;"><em>（视角：${povName}${locText}${conflictText} ｜ 核心目标：${s.objective}）</em></p>` +
        (outlineLines ? outlineLines : '') +
        `<p></p>`
      );
    });

    const fullScaffold = htmlBlocks.join('\n');
    onInsertScaffoldToEditor(fullScaffold);

    toast.success('装配成功', `已将 ${scenes.length} 个场景节拍结构化装配至当前正文！`);
    onClose();
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-xl bg-[#fdfbf7] dark:bg-[#1a1714] text-[#2c241c] dark:text-[#dfdbd0] shadow-2xl border-l border-[#e7e1d5] dark:border-[#38332c] flex flex-col font-serif transition-transform duration-200">
      {/* 顶栏 Header */}
      <div className="h-14 px-5 border-b border-[#e7e1d5] dark:border-[#38332c] flex items-center justify-between bg-[#f7f2e7]/80 dark:bg-[#231f1a]/80 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-400 flex items-center justify-center">
            <Clapperboard className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#2c241c] dark:text-[#efe9dc]">
                章节场景与细纲节拍
              </h3>
              <span className="px-1.5 py-0.5 text-[11px] font-sans rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-medium">
                {scenes.length} 节拍
              </span>
            </div>
            <p className="text-[11px] text-[#8c8275] dark:text-[#9e9587] truncate max-w-xs font-sans">
              《{activeChapter?.title || '未命名章节'}》· 起承转合可视化故事板
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-stone-200 dark:hover:bg-stone-800 text-[#8c8275] transition-colors cursor-pointer"
            title="关闭 (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 快捷操作区 */}
      <div className="px-5 py-2.5 border-b border-[#e7e1d5] dark:border-[#38332c] bg-[#faf6ee] dark:bg-[#201c18] flex items-center justify-between shrink-0 gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPlanningDialog(!showPlanningDialog)}
            className="px-2.5 py-1 text-xs font-sans rounded-md bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white shadow-xs flex items-center gap-1.5 transition-all cursor-pointer font-medium"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI 智能规划节拍
          </button>

          <button
            onClick={handleCreateScene}
            className="px-2.5 py-1 text-xs font-sans rounded-md bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-[#443c33] dark:text-[#dfdbd0] border border-[#dcd4c5] dark:border-[#443e37] flex items-center gap-1 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            手动添加
          </button>
        </div>

        {scenes.length > 0 && (
          <button
            onClick={handleAssembleToDraft}
            className="px-2.5 py-1 text-xs font-sans rounded-md bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-800 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5 transition-all cursor-pointer font-medium"
            title="将当前全部场景节拍格式化嵌入当前正文编辑器中"
          >
            <FileText className="w-3.5 h-3.5" />
            装配至正文提纲
          </button>
        )}
      </div>

      {/* AI 规划配置抽屉层 */}
      {showPlanningDialog && (
        <div className="p-4 bg-amber-50/60 dark:bg-amber-950/20 border-b border-amber-200/60 dark:border-amber-800/40 shrink-0">
          <div className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            AI 场景编剧 Agent 规划配置
          </div>
          <p className="text-[11px] text-amber-800/80 dark:text-amber-400/80 font-sans mb-2.5">
            结合全书大纲、世界法则与登场人物，为本章自动拆解 3~4 个环环相扣的高张力场景节拍。
          </p>

          <textarea
            value={planningGoal}
            onChange={(e) => setPlanningGoal(e.target.value)}
            placeholder="输入本章创作意图或目标（例如：主角潜入藏书阁寻找残卷，遭遇守阁长老言语试探，最后留下巨大悬念）..."
            rows={2}
            className="w-full text-xs p-2 rounded-md bg-white dark:bg-stone-900 border border-amber-300 dark:border-amber-700/60 text-[#2c241c] dark:text-[#dfdbd0] placeholder-[#8c8275] focus:outline-none focus:ring-1 focus:ring-amber-500 font-sans resize-none"
          />

          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => setShowPlanningDialog(false)}
              className="px-2.5 py-1 text-xs font-sans text-stone-600 dark:text-stone-400 hover:text-stone-800 cursor-pointer"
            >
              取消
            </button>
            <button
              onClick={handleStartAiPlanning}
              disabled={isPlanning}
              className="px-3 py-1 text-xs font-sans rounded bg-amber-600 hover:bg-amber-700 text-white font-medium flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {isPlanning ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  编剧中...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  开始推演生成
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 场景节拍卡片列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {scenes.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 mx-auto flex items-center justify-center mb-3">
              <Clapperboard className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-[#2c241c] dark:text-[#efe9dc] mb-1">
              暂无场景细纲节拍
            </h4>
            <p className="text-xs text-[#8c8275] dark:text-[#9e9587] max-w-sm mx-auto mb-4 font-sans leading-relaxed">
              长篇小说单章通常由 3~4 个起承转合的场景节拍构成。让 AI 场景编剧依据本章目标一键自动规划，或手动添加。
            </p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setShowPlanningDialog(true)}
                className="px-3 py-1.5 text-xs font-sans rounded-md bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5 font-medium cursor-pointer shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                AI 一键智能规划
              </button>
              <button
                onClick={handleCreateScene}
                className="px-3 py-1.5 text-xs font-sans rounded-md bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-[#443c33] dark:text-[#dfdbd0] border border-[#dcd4c5] dark:border-[#443e37] flex items-center gap-1 font-medium cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                手动规划第一个场景
              </button>
            </div>
          </div>
        ) : (
          scenes.map((scene, idx) => {
            const isEditing = editingId === scene.id;
            const povChar = characters.find((c: Character) => c.id === scene.pov_character_id);

            return (
              <div
                key={scene.id}
                className={`rounded-lg border transition-all ${
                  isEditing
                    ? 'border-amber-500/60 bg-amber-50/20 dark:bg-amber-950/10 shadow-md ring-1 ring-amber-500/20'
                    : 'border-[#e7e1d5] dark:border-[#38332c] bg-white/70 dark:bg-[#1f1b17]/70 hover:border-amber-400/50 hover:shadow-xs'
                }`}
              >
                {/* 卡片顶栏 */}
                <div className="px-3.5 py-2.5 border-b border-[#f0eae0] dark:border-[#2d2822] flex items-center justify-between bg-[#fbf8f2]/60 dark:bg-[#25201b]/60">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-600 text-white text-[11px] font-sans font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>

                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.title || ''}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        placeholder="场景标题（例如：藏经阁潜入）"
                        className="text-xs font-bold font-serif bg-white dark:bg-stone-900 border border-amber-300 dark:border-amber-700/60 rounded px-1.5 py-0.5 text-[#2c241c] dark:text-[#efe9dc] focus:outline-none focus:ring-1 focus:ring-amber-500 w-44"
                      />
                    ) : (
                      <span className="text-xs font-bold text-[#2c241c] dark:text-[#efe9dc]">
                        {scene.title || `场景 ${idx + 1}`}
                      </span>
                    )}

                    {/* 状态选择器 */}
                    <select
                      value={isEditing ? editForm.status : scene.status}
                      onChange={(e) => {
                        if (isEditing) {
                          setEditForm({ ...editForm, status: e.target.value });
                        } else {
                          handleStatusChange(scene, e.target.value);
                        }
                      }}
                      className="text-[11px] font-sans px-1.5 py-0.5 rounded border border-[#dcd4c5] dark:border-[#443e37] bg-white dark:bg-stone-900 text-[#554e44] dark:text-[#c4bdb2] focus:outline-none"
                    >
                      <option value="PLANNED">📝 规划中</option>
                      <option value="IN_PROGRESS">⚡ 创作中</option>
                      <option value="COMPLETED">✅ 已成稿</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* 调序按钮 */}
                    <button
                      onClick={() => handleMoveOrder(idx, 'UP')}
                      disabled={idx === 0}
                      className="p-1 rounded text-[#8c8275] hover:bg-stone-200 dark:hover:bg-stone-800 disabled:opacity-30 cursor-pointer"
                      title="上移节拍"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMoveOrder(idx, 'DOWN')}
                      disabled={idx === scenes.length - 1}
                      className="p-1 rounded text-[#8c8275] hover:bg-stone-200 dark:hover:bg-stone-800 disabled:opacity-30 cursor-pointer"
                      title="下移节拍"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>

                    {/* 编辑/保存切换 */}
                    {isEditing ? (
                      <button
                        onClick={handleSaveEdit}
                        className="px-2 py-0.5 text-[11px] font-sans rounded bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1 font-medium cursor-pointer"
                      >
                        <Save className="w-3 h-3" />
                        保存
                      </button>
                    ) : (
                      <>
                        {onFocusSceneInEditor && (
                          <button
                            onClick={() => onFocusSceneInEditor(idx + 1, scene.title || '')}
                            className="px-1.5 py-0.5 rounded text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 cursor-pointer flex items-center gap-1 text-[11px] font-sans font-medium transition-colors"
                            title="在正文编辑器中聚焦并滚动定位到此场景"
                          >
                            <Target className="w-3 h-3" />
                            <span>定位</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleStartEdit(scene)}
                          className="p-1 rounded text-[#8c8275] hover:bg-stone-200 dark:hover:bg-stone-800 cursor-pointer"
                          title="编辑细纲"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => handleDeleteScene(scene.id, scene.title)}
                      className="p-1 rounded text-rose-500/80 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                      title="删除场景"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 卡片内容区 */}
                <div className="p-3.5 space-y-2.5 text-xs font-sans">
                  {/* 核心行动目标 */}
                  <div>
                    <label className="text-[11px] font-medium text-[#7c7265] dark:text-[#9e9587] flex items-center gap-1 mb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      核心行动目标 (Objective)
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.objective || ''}
                        onChange={(e) => setEditForm({ ...editForm, objective: e.target.value })}
                        placeholder="此场景人物的核心意图或目标..."
                        className="w-full text-xs p-1.5 rounded bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-[#2c241c] dark:text-[#efe9dc] focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    ) : (
                      <p className="text-xs text-[#2c241c] dark:text-[#efe9dc] font-serif font-medium bg-[#f9f6f0] dark:bg-[#1a1714] p-1.5 rounded border border-[#ebe5da] dark:border-[#2d2822]">
                        {scene.objective || '（未设定具体目标）'}
                      </p>
                    )}
                  </div>

                  {/* 细纲节拍要点 */}
                  <div>
                    <label className="text-[11px] font-medium text-[#7c7265] dark:text-[#9e9587] flex items-center gap-1 mb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                      行动节拍与戏剧推演 (Beat Outline)
                    </label>
                    {isEditing ? (
                      <textarea
                        value={editForm.outline || ''}
                        onChange={(e) => setEditForm({ ...editForm, outline: e.target.value })}
                        placeholder="节拍要点：1. 切入点 2. 突发阻碍 3. 结果代价..."
                        rows={3}
                        className="w-full text-xs p-1.5 rounded bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-[#2c241c] dark:text-[#efe9dc] focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
                      />
                    ) : (
                      <div className="text-xs text-[#443c33] dark:text-[#d5cfc4] leading-relaxed whitespace-pre-wrap bg-[#f9f6f0] dark:bg-[#1a1714] p-2 rounded border border-[#ebe5da] dark:border-[#2d2822]">
                        {scene.outline || '（暂无节拍说明）'}
                      </div>
                    )}
                  </div>

                  {/* 属性元数据栏 (POV + 地点 + 冲突焦点) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-[#f0eae0] dark:border-[#2d2822]">
                    {/* POV 视角角色 */}
                    <div>
                      <span className="text-[10px] text-[#8c8275] dark:text-[#9e9587] flex items-center gap-1 mb-0.5">
                        <User className="w-3 h-3 text-amber-600" />
                        视角角色 (POV)
                      </span>
                      {isEditing ? (
                        <select
                          value={editForm.pov_character_id || ''}
                          onChange={(e) =>
                            setEditForm({ ...editForm, pov_character_id: e.target.value || undefined })
                          }
                          className="w-full text-xs p-1 rounded bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-[#2c241c] dark:text-[#efe9dc]"
                        >
                          <option value="">-- 全知 / 旁白视角 --</option>
                          {characters.map((c: Character) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="text-xs text-[#2c241c] dark:text-[#efe9dc] flex items-center gap-1.5 font-medium">
                          {povChar?.avatar_url ? (
                            <img
                              src={povChar.avatar_url}
                              alt=""
                              className="w-4 h-4 rounded-full object-cover border border-amber-500/30"
                            />
                          ) : (
                            <span className="w-4 h-4 rounded-full bg-amber-100 dark:bg-amber-900/50 text-[10px] text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold">
                              {povChar ? povChar.name[0] : '全'}
                            </span>
                          )}
                          <span>{povChar ? povChar.name : '全知视角 / 旁白'}</span>
                        </div>
                      )}
                    </div>

                    {/* 场景地点 */}
                    <div>
                      <span className="text-[10px] text-[#8c8275] dark:text-[#9e9587] flex items-center gap-1 mb-0.5">
                        <MapPin className="w-3 h-3 text-emerald-600" />
                        发生地点 (Location)
                      </span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.location_id || ''}
                          onChange={(e) => setEditForm({ ...editForm, location_id: e.target.value })}
                          placeholder="例如：藏经阁第七层"
                          className="w-full text-xs p-1 rounded bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-[#2c241c] dark:text-[#efe9dc]"
                        />
                      ) : (
                        <span className="text-xs text-[#554e44] dark:text-[#c4bdb2]">
                          {scene.location_id || '（未明确）'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 底部信息与快捷装配 */}
      <div className="p-3 border-t border-[#e7e1d5] dark:border-[#38332c] bg-[#f7f2e7]/80 dark:bg-[#231f1a]/80 shrink-0 flex items-center justify-between text-xs font-sans">
        <span className="text-[11px] text-[#8c8275] dark:text-[#9e9587]">
          💡 场景节拍将作为正文写作与五层记忆 L0 层的核心指引
        </span>
        <button
          onClick={onClose}
          className="px-3 py-1 text-xs rounded bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-[#2c241c] dark:text-[#efe9dc] transition-colors cursor-pointer"
        >
          完成
        </button>
      </div>
    </div>
  );
};
