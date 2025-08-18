import Pusher from 'pusher-js';

class VercelMultiplayerManager {
  private pusher: Pusher | null = null;
  private callbacks: Map<string, Function[]> = new Map();
  private currentPlayerId: string = '';
  private isConnecting: boolean = false;
  private connectionAttempts: number = 0;
  private maxConnectionAttempts: number = 3;

  constructor() {
    this.currentPlayerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  connect() {
    // Prevent multiple simultaneous connection attempts
    if (this.isConnecting) {
      console.log('VercelMultiplayerManager: Connection already in progress');
      return;
    }

    // Check if already connected
    if (this.pusher?.connection.state === 'connected') {
      console.log('VercelMultiplayerManager: Already connected');
      return;
    }

    // Limit connection attempts to prevent infinite loops
    if (this.connectionAttempts >= this.maxConnectionAttempts) {
      console.warn('VercelMultiplayerManager: Max connection attempts reached');
      return;
    }

    this.isConnecting = true;
    this.connectionAttempts++;

    console.log(`VercelMultiplayerManager: Connecting (attempt ${this.connectionAttempts})`);

    try {
      // Disconnect existing connection if any
      if (this.pusher) {
        this.pusher.disconnect();
        this.pusher = null;
      }

      this.pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
        enabledTransports: ['ws', 'wss'], // Limit to websockets only
        disabledTransports: ['xhr_polling', 'xhr_streaming', 'sockjs'], // Disable polling
      });

      // Subscribe to global events with error handling
      const globalChannel = this.pusher.subscribe('multiplayer');
      
      globalChannel.bind('lobby-created', (data: any) => {
        try {
          this.emit('lobby-created', data);
        } catch (error) {
          console.error('Error handling lobby-created event:', error);
        }
      });
      
      globalChannel.bind('lobby-updated', (data: any) => {
        try {
          this.emit('lobby-updated', data);
        } catch (error) {
          console.error('Error handling lobby-updated event:', error);
        }
      });
      
      globalChannel.bind('lobby-closed', (data: any) => {
        try {
          this.emit('lobby-closed', data);
        } catch (error) {
          console.error('Error handling lobby-closed event:', error);
        }
      });
      
      globalChannel.bind('battle-created', (data: any) => {
        try {
          this.emit('battle-created', data);
        } catch (error) {
          console.error('Error handling battle-created event:', error);
        }
      });

      this.pusher.connection.bind('connected', () => {
        console.log('VercelMultiplayerManager: Connected to Pusher');
        this.isConnecting = false;
        this.connectionAttempts = 0; // Reset on successful connection
        this.emit('connected', { playerId: this.currentPlayerId });
      });

      this.pusher.connection.bind('disconnected', () => {
        console.log('VercelMultiplayerManager: Disconnected from Pusher');
        this.isConnecting = false;
        this.emit('disconnected', {});
      });

      this.pusher.connection.bind('error', (error: any) => {
        console.error('VercelMultiplayerManager: Pusher connection error:', error);
        this.isConnecting = false;
      });

    } catch (error) {
      console.error('VercelMultiplayerManager: Failed to create Pusher connection:', error);
      this.isConnecting = false;
    }
  }

  disconnect() {
    console.log('VercelMultiplayerManager: Disconnecting');
    this.isConnecting = false;
    this.connectionAttempts = 0;
    
    if (this.pusher) {
      // Unbind all event listeners to prevent memory leaks
      this.pusher.connection.unbind_all();
      this.pusher.unsubscribe('multiplayer');
      this.pusher.disconnect();
      this.pusher = null;
    }
    
    // Clear all callbacks to prevent memory leaks
    this.callbacks.clear();
  }

  // Lobby management
  async createLobby(playerName: string, settings: any) {
    try {
      const response = await fetch('/api/multiplayer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-lobby',
          hostName: playerName,
          settings
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      if (result.lobby) {
        // Subscribe to lobby-specific events
        this.subscribeToLobby(result.lobby.id);
        this.emit('lobby-joined', { lobby: result.lobby, role: 'host' });
      } else {
        this.emit('error', { message: result.error || 'Failed to create lobby' });
      }
    } catch (error) {
      console.error('Failed to create lobby:', error);
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
          lobbyId,
          playerName,
          asSpectator
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      if (result.lobby) {
        this.subscribeToLobby(lobbyId);
        this.emit('lobby-joined', { 
          lobby: result.lobby, 
          role: asSpectator ? 'spectator' : 'player' 
        });
      } else {
        this.emit('error', { message: result.error || 'Failed to join lobby' });
      }
    } catch (error) {
      console.error('Failed to join lobby:', error);
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
      const response = await fetch('/api/multiplayer?action=active-games');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      this.emit('active-games', data);
    } catch (error) {
      console.error('Failed to get active games:', error);
      // Emit empty data as fallback
      this.emit('active-games', { lobbies: [], battles: [] });
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
