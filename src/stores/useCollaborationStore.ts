/**
 * NovelForge AI V3.5 — 协同创作与 P2P 联机状态管理 Store
 */

import { create } from 'zustand';
import { P2pCollaborationEngine } from '@/features/collaboration/p2pEngine';
import type {
  CollaborationRole,
  CollaborationConnectionStatus,
  P2pPacket,
  ChatMessagePayload,
  SandboxSyncPayload,
  SandboxRoundSubmitPayload,
  ProposalDeliveryPayload,
} from '@/features/collaboration/p2pTypes';
import type { DialogueRoundRecord } from '@/types';

export interface ChatMessageItem {
  id: string;
  senderName: string;
  role: CollaborationRole;
  text: string;
  timestamp: number;
}

interface CollaborationState {
  status: CollaborationConnectionStatus;
  errorMessage: string | null;
  role: CollaborationRole;
  roomCode: string;
  myNickname: string;
  peerNickname: string;
  latencyMs: number;
  chatMessages: ChatMessageItem[];

  // 联机演武场专属同步监听
  remoteSandboxRound: DialogueRoundRecord | null;
  remoteSandboxSyncPayload: SandboxSyncPayload | null;
  remoteProposalReceived: ProposalDeliveryPayload | null;

  // 动作
  setMyNickname: (name: string) => void;
  createRoom: (customCode?: string) => Promise<string>;
  joinRoom: (code: string) => Promise<void>;
  leaveRoom: () => void;
  sendChatMessage: (text: string) => boolean;
  sendSandboxSync: (payload: SandboxSyncPayload) => boolean;
  sendSandboxRound: (round: DialogueRoundRecord) => boolean;
  sendProposalDelivery: (payload: ProposalDeliveryPayload) => boolean;
  clearRemoteProposal: () => void;
}

// 模块级单例引擎
let engineInstance: P2pCollaborationEngine | null = null;

const getOrInitEngine = (set: any, get: any): P2pCollaborationEngine => {
  if (!engineInstance) {
    engineInstance = new P2pCollaborationEngine({
      onStatusChange: (status, errorMsg) => {
        set({
          status,
          errorMessage: errorMsg || null,
          role: engineInstance?.getRole() || 'NONE',
          roomCode: engineInstance?.getRoomCode() || '',
        });
      },
      onLatencyUpdate: (latencyMs) => {
        set({ latencyMs });
      },
      onPacketReceived: (packet: P2pPacket) => {
        const state = get();
        switch (packet.type) {
          case 'HANDSHAKE':
          case 'HANDSHAKE_ACK': {
            set({ peerNickname: packet.payload?.client_name || '协作者' });
            if (packet.type === 'HANDSHAKE') {
              engineInstance?.sendPacket('HANDSHAKE_ACK', {
                client_name: state.myNickname,
                app_version: '3.5.0',
              });
            }
            break;
          }
          case 'CHAT_MESSAGE': {
            const chatPayload = packet.payload as ChatMessagePayload;
            set({
              chatMessages: [
                ...state.chatMessages,
                {
                  id: chatPayload.message_id,
                  senderName: packet.sender_name,
                  role: packet.sender_role,
                  text: chatPayload.text,
                  timestamp: packet.timestamp,
                },
              ],
            });
            break;
          }
          case 'SANDBOX_SYNC_INIT': {
            set({ remoteSandboxSyncPayload: packet.payload as SandboxSyncPayload });
            break;
          }
          case 'SANDBOX_ROUND_SUBMIT': {
            const submitPayload = packet.payload as SandboxRoundSubmitPayload;
            set({ remoteSandboxRound: submitPayload.round });
            break;
          }
          case 'PROPOSAL_DELIVERY': {
            set({ remoteProposalReceived: packet.payload as ProposalDeliveryPayload });
            break;
          }
          default:
            break;
        }
      },
    });
  }
  return engineInstance;
};

export const useCollaborationStore = create<CollaborationState>((set, get) => ({
  status: 'DISCONNECTED',
  errorMessage: null,
  role: 'NONE',
  roomCode: '',
  myNickname: '主创作者',
  peerNickname: '',
  latencyMs: 0,
  chatMessages: [],
  remoteSandboxRound: null,
  remoteSandboxSyncPayload: null,
  remoteProposalReceived: null,

  setMyNickname: (name: string) => set({ myNickname: name.trim() || '创作者' }),

  createRoom: async (customCode?: string) => {
    const engine = getOrInitEngine(set, get);
    // 生成 6 位随机数字房间码
    const code = customCode?.trim() || `${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}`;
    const myName = get().myNickname || '主创作者';
    await engine.createRoom(code, myName);
    set({
      role: 'HOST',
      roomCode: code,
      errorMessage: null,
      chatMessages: [
        {
          id: `sys_${Date.now()}`,
          senderName: '系统通知',
          role: 'NONE',
          text: `已创建对戏与协作房间 [${code}]，等待协作者通过房间码加入...`,
          timestamp: Date.now(),
        },
      ],
    });
    return code;
  },

  joinRoom: async (code: string) => {
    const engine = getOrInitEngine(set, get);
    const myName = get().myNickname || '协作者';
    await engine.joinRoom(code, myName);
    set({
      role: 'GUEST',
      roomCode: code,
      errorMessage: null,
      chatMessages: [
        {
          id: `sys_${Date.now()}`,
          senderName: '系统通知',
          role: 'NONE',
          text: `正在连接异地房间 [${code}]，已启用免费 WebRTC P2P 端到端加密隧道...`,
          timestamp: Date.now(),
        },
      ],
    });
  },

  leaveRoom: () => {
    if (engineInstance) {
      engineInstance.destroy();
    }
    set({
      status: 'DISCONNECTED',
      role: 'NONE',
      roomCode: '',
      peerNickname: '',
      latencyMs: 0,
      chatMessages: [],
      remoteSandboxRound: null,
      remoteSandboxSyncPayload: null,
      remoteProposalReceived: null,
      errorMessage: null,
    });
  },

  sendChatMessage: (text: string) => {
    if (!text.trim()) return false;
    const engine = getOrInitEngine(set, get);
    const msgId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const ok = engine.sendPacket<ChatMessagePayload>('CHAT_MESSAGE', {
      message_id: msgId,
      text: text.trim(),
    });
    if (ok) {
      set({
        chatMessages: [
          ...get().chatMessages,
          {
            id: msgId,
            senderName: get().myNickname,
            role: get().role,
            text: text.trim(),
            timestamp: Date.now(),
          },
        ],
      });
    }
    return ok;
  },

  sendSandboxSync: (payload: SandboxSyncPayload) => {
    const engine = getOrInitEngine(set, get);
    return engine.sendPacket<SandboxSyncPayload>('SANDBOX_SYNC_INIT', payload);
  },

  sendSandboxRound: (round: DialogueRoundRecord) => {
    const engine = getOrInitEngine(set, get);
    return engine.sendPacket<SandboxRoundSubmitPayload>('SANDBOX_ROUND_SUBMIT', { round });
  },

  sendProposalDelivery: (payload: ProposalDeliveryPayload) => {
    const engine = getOrInitEngine(set, get);
    return engine.sendPacket<ProposalDeliveryPayload>('PROPOSAL_DELIVERY', payload);
  },

  clearRemoteProposal: () => set({ remoteProposalReceived: null }),
}));
