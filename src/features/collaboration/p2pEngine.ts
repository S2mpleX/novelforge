/**
 * NovelForge AI V3.5 — 互联网 WebRTC P2P 房间码直连通信引擎
 * 
 * 核心设计：
 * 1. 0 服务器成本：借由全球免费公共 WebRTC 信令与 STUN 服务器（Google/Cloudflare/Twilio），直接在异地两台电脑间建立加密 DataChannel；
 * 2. 6 位数字房间码：简化异地配对；
 * 3. 毫秒级延迟心跳追踪；
 * 4. 强类型分发通道。
 */

import peerPackage, { type DataConnection } from 'peerjs';
const PeerClass: any = (peerPackage as any)?.Peer || (peerPackage as any)?.default?.Peer || peerPackage;
import type {
  CollaborationRole,
  CollaborationConnectionStatus,
  P2pPacket,
  P2pPacketType,
} from './p2pTypes';

export interface P2pEngineOptions {
  onStatusChange?: (status: CollaborationConnectionStatus, errorMsg?: string) => void;
  onPacketReceived?: (packet: P2pPacket) => void;
  onLatencyUpdate?: (latencyMs: number) => void;
}

const PEERJS_PREFIX = 'nf-room-';

export class P2pCollaborationEngine {
  private peer: any = null;
  private conn: DataConnection | null = null;
  private role: CollaborationRole = 'NONE';
  private clientName: string = '创作者';
  private roomCode: string = '';
  private status: CollaborationConnectionStatus = 'DISCONNECTED';
  private pingIntervalTimer: any = null;
  private lastPingSentTime: number = 0;

  private onStatusChange?: (status: CollaborationConnectionStatus, errorMsg?: string) => void;
  private onPacketReceived?: (packet: P2pPacket) => void;
  private onLatencyUpdate?: (latencyMs: number) => void;

  constructor(options: P2pEngineOptions = {}) {
    this.onStatusChange = options.onStatusChange;
    this.onPacketReceived = options.onPacketReceived;
    this.onLatencyUpdate = options.onLatencyUpdate;
  }

  public getStatus(): CollaborationConnectionStatus {
    return this.status;
  }

  public getRole(): CollaborationRole {
    return this.role;
  }

  public getRoomCode(): string {
    return this.roomCode;
  }

  /**
   * 房主：创建 6 位房间码并等待协作者加入
   */
  public async createRoom(roomCode: string, hostName: string): Promise<string> {
    this.destroy();
    this.role = 'HOST';
    this.clientName = hostName;
    this.roomCode = roomCode.replace(/-/g, '').trim();
    const peerId = `${PEERJS_PREFIX}${this.roomCode}`;

    this.setStatus('CONNECTING');

    return new Promise((resolve, reject) => {
      try {
        this.peer = new PeerClass(peerId, {
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun.cloudflare.com:3478' },
              { urls: 'stun:global.stun.twilio.com:3478' },
            ],
          },
        });

        this.peer.on('open', () => {
          this.setStatus('CONNECTING'); // 等待对端加入
          resolve(this.roomCode);
        });

        this.peer.on('connection', (connection: DataConnection) => {
          this.setupConnection(connection);
        });

        this.peer.on('error', (err: any) => {
          console.error('[P2P Host Error]', err);
          this.setStatus('ERROR', err.message || '房间创建或穿透失败');
          reject(err);
        });
      } catch (err: any) {
        this.setStatus('ERROR', err.message);
        reject(err);
      }
    });
  }

  /**
   * 协作者：输入 6 位房间码加入对戏房间
   */
  public async joinRoom(roomCode: string, guestName: string): Promise<void> {
    this.destroy();
    this.role = 'GUEST';
    this.clientName = guestName;
    this.roomCode = roomCode.replace(/-/g, '').trim();
    const targetPeerId = `${PEERJS_PREFIX}${this.roomCode}`;

    this.setStatus('CONNECTING');

    return new Promise((resolve, reject) => {
      try {
        // 协作者使用随机 Peer ID
        const randomGuestId = `nf-guest-${Math.random().toString(36).slice(2, 9)}`;
        this.peer = new PeerClass(randomGuestId, {
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun.cloudflare.com:3478' },
              { urls: 'stun:global.stun.twilio.com:3478' },
            ],
          },
        });

        this.peer.on('open', () => {
          if (!this.peer) return;
          const connection = this.peer.connect(targetPeerId, {
            reliable: true,
          });
          this.setupConnection(connection);
          resolve();
        });

        this.peer.on('error', (err: any) => {
          console.error('[P2P Guest Error]', err);
          this.setStatus('ERROR', err.message || '未能连接到指定房间码，请核对房间号是否开启');
          reject(err);
        });
      } catch (err: any) {
        this.setStatus('ERROR', err.message);
        reject(err);
      }
    });
  }

  /**
   * 统一绑定 DataChannel 事件
   */
  private setupConnection(connection: DataConnection) {
    this.conn = connection;

    this.conn.on('open', () => {
      this.setStatus('CONNECTED');
      this.startHeartbeat();

      // 发送握手包
      this.sendPacket('HANDSHAKE', {
        client_name: this.clientName,
        app_version: '3.5.0',
      });
    });

    this.conn.on('data', (data: any) => {
      this.handleIncomingData(data);
    });

    this.conn.on('close', () => {
      this.setStatus('DISCONNECTED', '对端协作者已退出房间');
      this.stopHeartbeat();
    });

    this.conn.on('error', (err) => {
      console.error('[P2P DataChannel Error]', err);
      this.setStatus('ERROR', '数据隧道发生异常');
    });
  }

  /**
   * 数据包发送
   */
  public sendPacket<T = any>(type: P2pPacketType, payload: T): boolean {
    if (!this.conn || this.status !== 'CONNECTED') {
      return false;
    }
    const packet: P2pPacket<T> = {
      id: `pkt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type,
      sender_role: this.role,
      sender_name: this.clientName,
      timestamp: Date.now(),
      payload,
    };
    try {
      this.conn.send(packet);
      return true;
    } catch (err) {
      console.error('发送 P2P 数据包失败:', err);
      return false;
    }
  }

  /**
   * 解析接收到的数据
   */
  private handleIncomingData(data: any) {
    if (!data || typeof data !== 'object') return;
    const packet = data as P2pPacket;

    // 内部心跳响应
    if (packet.type === 'PING') {
      this.sendPacket('PONG', { originalTimestamp: packet.timestamp });
      return;
    } else if (packet.type === 'PONG') {
      const now = Date.now();
      const latency = Math.max(1, now - (packet.payload?.originalTimestamp || this.lastPingSentTime));
      if (this.onLatencyUpdate) {
        this.onLatencyUpdate(latency);
      }
      return;
    }

    if (this.onPacketReceived) {
      this.onPacketReceived(packet);
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.pingIntervalTimer = setInterval(() => {
      if (this.status === 'CONNECTED' && this.conn) {
        this.lastPingSentTime = Date.now();
        this.sendPacket('PING', { timestamp: this.lastPingSentTime });
      }
    }, 4000);
  }

  private stopHeartbeat() {
    if (this.pingIntervalTimer) {
      clearInterval(this.pingIntervalTimer);
      this.pingIntervalTimer = null;
    }
  }

  private setStatus(status: CollaborationConnectionStatus, errorMsg?: string) {
    this.status = status;
    if (this.onStatusChange) {
      this.onStatusChange(status, errorMsg);
    }
  }

  /**
   * 彻底清理与断开连接
   */
  public destroy() {
    this.stopHeartbeat();
    if (this.conn) {
      try {
        this.conn.close();
      } catch {}
      this.conn = null;
    }
    if (this.peer) {
      try {
        this.peer.destroy();
      } catch {}
      this.peer = null;
    }
    this.setStatus('DISCONNECTED');
    this.role = 'NONE';
    this.roomCode = '';
  }
}
