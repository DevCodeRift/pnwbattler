import { io, Socket } from 'socket.io-client';

class MultiplayerManager {
  private socket: Socket | null = null;
  private callbacks: Map<string, Function[]> = new Map();

  connect() {
    if (this.socket?.connected) return;

    this.socket = io(process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : '', {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Connected to multiplayer server');
      this.emit('connected', { socketId: this.socket?.id });
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from multiplayer server');
      this.emit('disconnected', {});
    });

    // Set up event forwarding
    const events = [
      'lobby-created',
      'lobby-joined',
      'lobby-updated',
      'lobby-closed',
      'battle-started',
      'battle-created',
      'battle-updated',
      'active-games',
      'error'
    ];

    events.forEach(event => {
      this.socket?.on(event, (data) => {
        this.emit(event, data);
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Lobby management
  createLobby(hostName: string, settings: any) {
    this.socket?.emit('create-lobby', { hostName, settings });
  }

  joinLobby(lobbyId: string, playerName: string, asSpectator = false) {
    this.socket?.emit('join-lobby', { lobbyId, playerName, asSpectator });
  }

  startBattle(lobbyId: string) {
    this.socket?.emit('start-battle', { lobbyId });
  }

  // Battle actions
  sendBattleAction(battleId: string, action: string, actionData: any) {
    this.socket?.emit('battle-action', { battleId, action, actionData });
  }

  // Get active games
  getActiveGames() {
    this.socket?.emit('get-active-games');
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
    return this.socket?.connected || false;
  }

  get socketId() {
    return this.socket?.id;
  }
}

// Singleton instance
export const multiplayerManager = new MultiplayerManager();
export default multiplayerManager;
