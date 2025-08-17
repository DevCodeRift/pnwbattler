import Pusher from 'pusher-js';

class VercelMultiplayerManager {
  private pusher: Pusher | null = null;
  private callbacks: Map<string, Function[]> = new Map();
  private currentPlayerId: string = '';

  constructor() {
    this.currentPlayerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  connect() {
    if (this.pusher?.connection.state === 'connected') return;

    this.pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    // Subscribe to global events
    const globalChannel = this.pusher.subscribe('global');
    
    globalChannel.bind('lobby-created', (data: any) => {
      this.emit('lobby-created', data);
    });
    
    globalChannel.bind('lobby-updated', (data: any) => {
      this.emit('lobby-updated', data);
    });
    
    globalChannel.bind('battle-created', (data: any) => {
      this.emit('battle-created', data);
    });

    this.pusher.connection.bind('connected', () => {
      console.log('Connected to Pusher');
      this.emit('connected', { playerId: this.currentPlayerId });
    });

    this.pusher.connection.bind('disconnected', () => {
      console.log('Disconnected from Pusher');
      this.emit('disconnected', {});
    });
  }

  disconnect() {
    if (this.pusher) {
      this.pusher.disconnect();
      this.pusher = null;
    }
  }

  // Lobby management
  async createLobby(playerName: string, settings: any) {
    try {
      const response = await fetch('/api/multiplayer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-lobby',
          data: {
            playerId: this.currentPlayerId,
            playerName,
            settings
          }
        })
      });
      
      const result = await response.json();
      if (result.success) {
        // Subscribe to lobby-specific events
        this.subscribeToLobby(result.lobby.id);
        this.emit('lobby-joined', { lobby: result.lobby, role: 'host' });
      } else {
        this.emit('error', { message: result.error });
      }
    } catch (error) {
      this.emit('error', { message: 'Failed to create lobby' });
    }
  }

  async joinLobby(lobbyId: string, playerName: string, asSpectator = false) {
    try {
      const response = await fetch('/api/multiplayer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'join-lobby',
          data: {
            lobbyId,
            playerId: this.currentPlayerId,
            playerName,
            asSpectator
          }
        })
      });
      
      const result = await response.json();
      if (result.success) {
        this.subscribeToLobby(lobbyId);
        this.emit('lobby-joined', { 
          lobby: result.lobby, 
          role: asSpectator ? 'spectator' : 'player' 
        });
      } else {
        this.emit('error', { message: result.error });
      }
    } catch (error) {
      this.emit('error', { message: 'Failed to join lobby' });
    }
  }

  async startBattle(lobbyId: string) {
    try {
      const response = await fetch('/api/multiplayer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start-battle',
          data: {
            lobbyId,
            playerId: this.currentPlayerId
          }
        })
      });
      
      const result = await response.json();
      if (result.success) {
        this.subscribeToBattle(result.battle.id);
        this.emit('battle-started', { battleSession: result.battle });
      } else {
        this.emit('error', { message: result.error });
      }
    } catch (error) {
      this.emit('error', { message: 'Failed to start battle' });
    }
  }

  // Battle actions
  async sendBattleAction(battleId: string, actionType: string, actionData: any) {
    try {
      await fetch('/api/multiplayer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'battle-action',
          data: {
            battleId,
            playerId: this.currentPlayerId,
            actionType,
            actionData
          }
        })
      });
    } catch (error) {
      this.emit('error', { message: 'Failed to send battle action' });
    }
  }

  // Get active games
  async getActiveGames() {
    try {
      const response = await fetch('/api/multiplayer');
      const data = await response.json();
      this.emit('active-games', data);
    } catch (error) {
      this.emit('error', { message: 'Failed to get active games' });
    }
  }

  private subscribeToLobby(lobbyId: string) {
    if (!this.pusher) return;
    
    const lobbyChannel = this.pusher.subscribe(`lobby-${lobbyId}`);
    
    lobbyChannel.bind('player-joined', (data: any) => {
      this.emit('player-joined', data);
    });
    
    lobbyChannel.bind('battle-started', (data: any) => {
      this.emit('battle-started', data);
    });
  }

  private subscribeToBattle(battleId: string) {
    if (!this.pusher) return;
    
    const battleChannel = this.pusher.subscribe(`battle-${battleId}`);
    
    battleChannel.bind('battle-updated', (data: any) => {
      this.emit('battle-updated', data);
    });
  }

  // Event system
  on(event: string, callback: Function) {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, []);
    }
    this.callbacks.get(event)?.push(callback);
  }

  off(event: string, callback: Function) {
    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  get isConnected() {
    return this.pusher?.connection.state === 'connected';
  }

  get playerId() {
    return this.currentPlayerId;
  }
}

// Singleton instance
export const vercelMultiplayerManager = new VercelMultiplayerManager();
export default vercelMultiplayerManager;
