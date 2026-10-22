import React, { useState } from 'react';
import { useCollaborationStore } from '@/stores/useCollaborationStore';
import { useNovelStore } from '@/stores/useNovelStore';
import { useToastStore } from '@/stores/useToastStore';
import { api } from '@/utils/tauriBridge';
import {
  Globe,
  Wifi,
  Copy,
  Users,
  Send,
  MessageSquare,
  FileText,
  X,
  Swords,
  Sparkles,
  Share2,
  ShieldCheck,
  ArrowRight,
  Plus,
} from 'lucide-react';

interface CollaborationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSandbox?: () => void;
}

export const CollaborationModal: React.FC<CollaborationModalProps> = ({
  isOpen,
  onClose,
  onOpenSandbox,
}) => {
  const {
    status,
    errorMessage,
    role,
    roomCode,
    myNickname,
    peerNickname,
    latencyMs,
    chatMessages,
    setMyNickname,
    createRoom,
    joinRoom,
    leaveRoom,
    sendChatMessage,
    sendProposalDelivery,
    remoteProposalReceived,
    clearRemoteProposal,
  } = useCollaborationStore();

  const { activeNovel, activeChapter, editorContent } = useNovelStore();
  const { addToast } = useToastStore();
  const showToast = (title: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') =>
    addToast({ title, type });

  const [inputCode, setInputCode] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [activeTab, setActiveTab] = useState<'room' | 'chat' | 'proposal'>('room');
  const [isBusy, setIsBusy] = useState(false);

  // 提案表单
  const [proposalSummary, setProposalSummary] = useState('');
  const [proposalContent, setProposalContent] = useState('');

  if (!isOpen) return null;

  const handleCreateRoom = async () => {
    setIsBusy(true);
    try {
      const code = await createRoom();
      showToast(`房间已创建成功！房间码：${code}`, 'success');
    } catch (err: any) {
      showToast(`创建房间失败: ${err.message || err}`, 'error');
    } finally {
      setIsBusy(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!inputCode.trim()) {
      showToast('请输入 6 位房间码', 'warning');
      return;
    }
    setIsBusy(true);
    try {
      await joinRoom(inputCode.trim());
      showToast(`正在通过 WebRTC P2P 隧道连接房间 ${inputCode}...`, 'info');
    } catch (err: any) {
      showToast(`加入房间失败: ${err.message || err}`, 'error');
    } finally {
      setIsBusy(false);
    }
  };

  const handleCopyInvite = () => {
    const text = `【NovelForge AI 联机创作邀请】\n我的昵称：${myNickname}\n房间码：${roomCode}\n协议：WebRTC P2P 端到端加密直连（免服务器）\n打开软件点击【联机创作】输入房间码即可加入！`;
    navigator.clipboard.writeText(text);
    showToast('邀请信息与房间码已复制至剪贴板！', 'success');
  };

  const handleSendChat = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;
    sendChatMessage(chatInput.trim());
    setChatInput('');
  };

  // 投递正文提案
  const handleSendProposal = () => {
    if (!proposalContent.trim()) {
      showToast('提案正文不能为空', 'warning');
      return;
    }
    const ok = sendProposalDelivery({
      chapter_id: activeChapter?.id,
      chapter_title: activeChapter?.title || '未命名章节',
      summary: proposalSummary.trim() || `【协作者提案】来自 ${myNickname}`,
      content: proposalContent.trim(),
      author_name: myNickname,
    });
    if (ok) {
      showToast('修改提案已通过 P2P 隧道实时投递给房主！', 'success');
      setProposalSummary('');
      setProposalContent('');
      setActiveTab('chat');
    } else {
      showToast('投递失败，请检查 P2P 连接状态', 'error');
    }
  };

  // 采纳接收到的远端提案
  const handleAcceptRemoteProposal = async () => {
    if (!remoteProposalReceived || !activeNovel || !activeChapter) return;
    try {
      await api.createChapterProposal({
        novel_id: activeNovel.id,
        chapter_id: activeChapter.id,
        content: remoteProposalReceived.content,
        proposal_summary: remoteProposalReceived.summary,
        reasoning_trace: `来自协作者【${remoteProposalReceived.author_name}】通过 P2P 实时投递`,
      });
      showToast('已存入本地章节候选提案，可前往版本抽屉一键对比合并！', 'success');
      clearRemoteProposal();
    } catch (err: any) {
      showToast(`采纳提案失败: ${err.message || err}`, 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden border border-[#ded5c2] dark:border-[#38322c] bg-[#fdfbf7] dark:bg-[#181614] flex flex-col font-sans">
        {/* 顶栏 */}
        <div className="px-5 py-3.5 border-b border-[#e6decc] dark:border-[#2d2824] bg-[#f7f2e7]/90 dark:bg-[#201c19]/90 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/10 text-blue-700 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-sm">互联网 P2P 联机创作中心</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-mono">
                  免服务器 · 端到端加密
                </span>
              </div>
              <p className="text-[11px] text-[#8a7f73] dark:text-[#9e9284]">
                通过 6 位房间码异地直连 · 演武场真人对抗 · 实时章节提案投递
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {status === 'CONNECTED' && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-700 dark:text-emerald-400 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>已直连 {latencyMs > 0 ? `${latencyMs}ms` : ''}</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[#857767]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 收到协作者提案时的高光横幅 */}
        {remoteProposalReceived && (
          <div className="p-3 bg-amber-500/15 border-b border-amber-500/30 flex items-center justify-between px-5 text-xs animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-600" />
              <span>
                收到来自 <strong>{remoteProposalReceived.author_name}</strong> 的修改提案：
                <em>{remoteProposalReceived.summary}</em>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAcceptRemoteProposal}
                className="px-2.5 py-1 rounded bg-amber-700 text-white font-medium hover:bg-amber-800"
              >
                存为章节提案
              </button>
              <button
                onClick={clearRemoteProposal}
                className="p-1 text-[#8a7f73] hover:text-black dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* 标签栏 */}
        <div className="px-5 pt-2 border-b border-[#e6decc] dark:border-[#2d2824] flex items-center gap-4 bg-[#fbf8f0] dark:bg-[#1c1916]">
          <button
            onClick={() => setActiveTab('room')}
            className={`pb-2.5 text-xs font-serif font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'room'
                ? 'border-amber-700 text-amber-800 dark:text-amber-400'
                : 'border-transparent text-[#8a7f73] hover:text-[#4a4036]'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> 房间配对
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            disabled={status !== 'CONNECTED'}
            className={`pb-2.5 text-xs font-serif font-bold border-b-2 flex items-center gap-1.5 disabled:opacity-40 transition-colors ${
              activeTab === 'chat'
                ? 'border-amber-700 text-amber-800 dark:text-amber-400'
                : 'border-transparent text-[#8a7f73] hover:text-[#4a4036]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" /> 协作闲聊 ({chatMessages.length})
          </button>
          <button
            onClick={() => {
              if (!proposalContent && editorContent) {
                setProposalContent(editorContent.slice(0, 500) + '...');
              }
              setActiveTab('proposal');
            }}
            disabled={status !== 'CONNECTED'}
            className={`pb-2.5 text-xs font-serif font-bold border-b-2 flex items-center gap-1.5 disabled:opacity-40 transition-colors ${
              activeTab === 'proposal'
                ? 'border-amber-700 text-amber-800 dark:text-amber-400'
                : 'border-transparent text-[#8a7f73] hover:text-[#4a4036]'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" /> 投递章节提案
          </button>
        </div>

        {/* 主内容区 */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs">
              ⚠️ {errorMessage}
            </div>
          )}
          {activeTab === 'room' && (
            <div className="space-y-4">
              {/* 我的昵称 */}
              <div className="p-3.5 rounded-xl bg-white/70 dark:bg-[#1f1b17] border border-[#e8e0ce] dark:border-[#322c27] flex items-center justify-between gap-4">
                <div>
                  <label className="text-[11px] text-[#8a7f73] block mb-0.5 font-medium">我的对戏昵称</label>
                  <p className="text-xs text-[#5c5044] dark:text-[#a89d91]">该名字将在联机对白与聊天中显示</p>
                </div>
                <input
                  type="text"
                  value={myNickname}
                  disabled={status === 'CONNECTED'}
                  onChange={(e) => setMyNickname(e.target.value)}
                  className="w-44 text-xs px-2.5 py-1.5 rounded-lg border border-[#ded5c2] dark:border-[#38322c] bg-white dark:bg-[#141210] outline-none text-right font-bold"
                />
              </div>

              {status === 'CONNECTED' ? (
                /* 已连接状态卡片 */
                <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                    <Wifi className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-base text-emerald-900 dark:text-emerald-300">
                      P2P 端到端数据隧道已建立
                    </h4>
                    <p className="text-xs text-[#6e6357] dark:text-[#a89d91] mt-1">
                      身份：{role === 'HOST' ? '【房主】' : '【协作者】'} · 对端：
                      <strong>{peerNickname || '远端作者'}</strong> · 延迟：{latencyMs}ms
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-2 p-2 px-4 rounded-xl bg-white dark:bg-[#141210] border border-emerald-500/40">
                    <span className="text-xs text-[#8a7f73]">房间码:</span>
                    <span className="font-mono font-bold text-lg tracking-widest text-emerald-700 dark:text-emerald-400">
                      {roomCode}
                    </span>
                    <button
                      onClick={handleCopyInvite}
                      className="p-1 hover:text-emerald-600 transition-colors ml-1"
                      title="复制邀请信息"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-2">
                    {onOpenSandbox && (
                      <button
                        onClick={() => {
                          onOpenSandbox();
                          onClose();
                        }}
                        className="px-4 py-2 text-xs rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-medium flex items-center gap-1.5 shadow-sm"
                      >
                        <Swords className="w-4 h-4" /> 前往演武场联机对戏
                      </button>
                    )}
                    <button
                      onClick={leaveRoom}
                      className="px-4 py-2 text-xs rounded-xl border border-rose-500/40 text-rose-700 dark:text-rose-400 hover:bg-rose-50 font-medium"
                    >
                      断开退出房间
                    </button>
                  </div>
                </div>
              ) : (
                /* 未连接状态：创建 vs 加入 */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 创建房间 (房主) */}
                  <div className="p-5 rounded-2xl bg-white/80 dark:bg-[#1f1b17] border border-[#e8e0ce] dark:border-[#322c27] flex flex-col justify-between space-y-4 shadow-2xs">
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-amber-600/10 text-amber-700 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 mb-3">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <h4 className="font-serif font-bold text-sm text-[#2c2621] dark:text-[#e8e2d8]">
                        创建联机房间 (我是房主)
                      </h4>
                      <p className="text-xs text-[#8a7f73] dark:text-[#9e9284] mt-1 leading-relaxed">
                        系统将随机生成 6 位房间码，您可以将房间码发送给好友，双方即可零配置异地直连！
                      </p>
                    </div>

                    <button
                      onClick={handleCreateRoom}
                      disabled={isBusy}
                      className="w-full py-2.5 text-xs rounded-xl bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white font-medium flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{isBusy ? '正在初始化 P2P 隧道...' : '一键创建房间'}</span>
                    </button>
                  </div>

                  {/* 加入房间 (协作者) */}
                  <div className="p-5 rounded-2xl bg-white/80 dark:bg-[#1f1b17] border border-[#e8e0ce] dark:border-[#322c27] flex flex-col justify-between space-y-4 shadow-2xs">
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-700 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 mb-3">
                        <Globe className="w-5 h-5" />
                      </div>
                      <h4 className="font-serif font-bold text-sm text-[#2c2621] dark:text-[#e8e2d8]">
                        输入房间码加入
                      </h4>
                      <p className="text-xs text-[#8a7f73] dark:text-[#9e9284] mt-1 leading-relaxed">
                        输入对方发送给您的 6 位数字房间码，一键穿透连接到对方的工作台。
                      </p>
                    </div>

                    <div className="space-y-2">
                      <input
                        type="text"
                        value={inputCode}
                        onChange={(e) => setInputCode(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                        placeholder="例如：839-204"
                        className="w-full text-center tracking-widest font-mono text-sm px-3 py-2 rounded-lg border border-[#ded5c2] dark:border-[#38322c] bg-white dark:bg-[#141210] outline-none"
                      />
                      <button
                        onClick={handleJoinRoom}
                        disabled={isBusy || !inputCode.trim()}
                        className="w-full py-2.5 text-xs rounded-xl bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-medium flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                      >
                        <ArrowRight className="w-4 h-4" />
                        <span>{isBusy ? '正在穿透连接中...' : '加入对戏房间'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 协议与隐私保障 */}
              <div className="p-3 rounded-xl bg-stone-100/70 dark:bg-black/20 border border-stone-200 dark:border-stone-800 text-[11px] text-[#8a7f73] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  采用 WebRTC P2P 直连，小说正文与思考链不经服务器留存，仅保存在双方本地 SQLite。
                </span>
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="h-96 flex flex-col justify-between space-y-3">
              <div className="flex-1 overflow-y-auto space-y-2 p-2 rounded-xl bg-white/60 dark:bg-[#141210]/60 border border-[#e8e0ce] dark:border-[#322c27]">
                {chatMessages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-[#8a7f73]">
                    暂无对端聊天消息，打个招呼吧
                  </div>
                ) : (
                  chatMessages.map((msg) => {
                    const isMe = msg.senderName === myNickname;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] ${
                          isMe ? 'ml-auto' : 'mr-auto'
                        }`}
                      >
                        <span className="text-[10px] text-[#8a7f73] mb-0.5 px-1">{msg.senderName}</span>
                        <div
                          className={`p-2.5 rounded-xl text-xs leading-relaxed ${
                            isMe
                              ? 'bg-amber-700 text-white'
                              : 'bg-white dark:bg-[#201c19] border border-[#ded5c2] dark:border-[#38322c]'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <form onSubmit={handleSendChat} className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="给对端协作者发消息..."
                  className="flex-1 text-xs px-3 py-2 rounded-xl border border-[#ded5c2] dark:border-[#38322c] bg-white dark:bg-[#141210] outline-none"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="px-4 py-2 text-xs rounded-xl bg-amber-700 hover:bg-amber-800 disabled:opacity-40 text-white font-medium flex items-center gap-1 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" /> 发送
                </button>
              </form>
            </div>
          )}

          {activeTab === 'proposal' && (
            <div className="space-y-3">
              <p className="text-xs text-[#8a7f73] leading-relaxed">
                撰写一段修改提案并投递给房主，房主收到后可一键在【历史版本抽屉】中进行 Diff 差异比对并合并。
              </p>

              <div>
                <label className="text-[11px] text-[#8a7f73] block mb-1">提案摘要与意图</label>
                <input
                  type="text"
                  value={proposalSummary}
                  onChange={(e) => setProposalSummary(e.target.value)}
                  placeholder="例如：修改第三章打戏细节，增强伏笔张力"
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-[#ded5c2] dark:border-[#38322c] bg-white dark:bg-[#141210] outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#8a7f73] block mb-1">提案正文段落</label>
                <textarea
                  rows={8}
                  value={proposalContent}
                  onChange={(e) => setProposalContent(e.target.value)}
                  placeholder="粘贴或编写正文内容..."
                  className="w-full text-xs p-3 rounded-lg border border-[#ded5c2] dark:border-[#38322c] bg-white dark:bg-[#141210] outline-none font-serif leading-relaxed"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={handleSendProposal}
                  disabled={!proposalContent.trim()}
                  className="px-5 py-2 text-xs rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white font-medium flex items-center gap-1.5 shadow-sm"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>实时投递提案给房主</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
