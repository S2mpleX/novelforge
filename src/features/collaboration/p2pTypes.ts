/**
 * NovelForge AI V3.5 — 互联网 P2P 房间码直连协同创作协议类型定义
 */

import type { DialogueRoundRecord, CharacterActorConfig, SandboxBranch } from '@/types';

export type CollaborationRole = 'HOST' | 'GUEST' | 'NONE';

export type CollaborationConnectionStatus =
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'RECONNECTING'
  | 'ERROR';

export type P2pPacketType =
  | 'HANDSHAKE'              // 握手问候 (包含昵称与角色)
  | 'HANDSHAKE_ACK'          // 握手确认
  | 'PING'                   // 心跳测速
  | 'PONG'                   // 心跳回执
  | 'CHAT_MESSAGE'           // 侧边栏协作者实时文字聊天
  | 'SANDBOX_SYNC_INIT'      // 房主向协作者全量同步演武场设定、角色与历史
  | 'SANDBOX_ROUND_SUBMIT'   // 任一方提交一轮亲演对白
  | 'SANDBOX_TYPING'         // 对方正在输入对白微表情
  | 'PROPOSAL_DELIVERY'      // 协作者投递小说章节候选提案
  | 'PROPOSAL_ACK';          // 房主接收确认

export interface P2pPacket<T = any> {
  id: string;
  type: P2pPacketType;
  sender_role: CollaborationRole;
  sender_name: string;
  timestamp: number;
  payload: T;
}

export interface HandshakePayload {
  client_name: string;
  novel_title?: string;
  app_version: string;
}

export interface ChatMessagePayload {
  message_id: string;
  text: string;
}

export interface SandboxSyncPayload {
  session_title: string;
  scene_setting: string;
  scene_goal: string;
  actors: CharacterActorConfig[];
  dialogue_history: DialogueRoundRecord[];
  branches?: SandboxBranch[];
  active_branch_id?: string;
}

export interface SandboxRoundSubmitPayload {
  round: DialogueRoundRecord;
}

export interface ProposalDeliveryPayload {
  chapter_id?: string;
  chapter_title?: string;
  summary: string;
  content: string;
  author_name: string;
}
