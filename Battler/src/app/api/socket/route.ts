import { NextRequest } from 'next/server';
import { Server } from 'socket.io';

// Types for multiplayer system
interface Player {
  id: string;
  name: string;
  isHost: boolean;
}

interface Spectator {
  id: string;
  name: string;
}

interface Lobby {
  id: string;
  host: string;
  hostName: string;
  settings: any;
  players: Player[];
  spectators: Spectator[];
  status: 'waiting' | 'in-progress' | 'completed';
  createdAt: string;
  battleId?: string;
}

interface Battle {
  id: string;
  lobbyId: string;
  players: Player[];
  spectators: Spectator[];
  settings: any;
  gameState: any;
  status: string;
  startedAt: string;
}

// Global storage for active battles and lobbies
const activeBattles = new Map<string, Battle>();
const activeLobbies = new Map<string, Lobby>();
const playerSessions = new Map<string, { lobbyId: string; role: string }>();

let io: Server;

export async function GET(req: NextRequest) {
  if (!io) {
    // Initialize Socket.io server
    const httpServer = (globalThis as any).httpServer;
    
    if (!httpServer) {
      // Create a basic HTTP server for Socket.io
      const { createServer } = await import('http');
      const server = createServer();
      (globalThis as any).httpServer = server;
      
      io = new Server(server, {
        cors: {
          origin: process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : false,
          methods: ['GET', 'POST']
        }
      });
      
      server.listen(3001);
    } else {
      io = new Server(httpServer, {
        cors: {
          origin: process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : false,
          methods: ['GET', 'POST']
        }
      });
    }

    // Socket.io event handlers
    io.on('connection', (socket) => {
      console.log('Player connected:', socket.id);

      // Join a lobby
      socket.on('create-lobby', (lobbyData) => {
        const lobbyId = `lobby_${Date.now()}`;
        const lobby: Lobby = {
          id: lobbyId,
          host: socket.id,
          hostName: lobbyData.hostName,
          settings: lobbyData.settings,
          players: [{ id: socket.id, name: lobbyData.hostName, isHost: true }],
          spectators: [],
          status: 'waiting' as const,
          createdAt: new Date().toISOString()
        };
        
        activeLobbies.set(lobbyId, lobby);
        socket.join(lobbyId);
        playerSessions.set(socket.id, { lobbyId, role: 'player' });
        
        // Broadcast lobby creation to all clients
        io.emit('lobby-created', lobby);
        socket.emit('lobby-joined', { lobby, role: 'host' });
      });

      // Join existing lobby
      socket.on('join-lobby', (data) => {
        const { lobbyId, playerName, asSpectator } = data;
        const lobby = activeLobbies.get(lobbyId);
        
        if (!lobby) {
          socket.emit('error', { message: 'Lobby not found' });
          return;
        }

        if (lobby.status !== 'waiting' && !asSpectator) {
          socket.emit('error', { message: 'Battle already in progress' });
          return;
        }

        socket.join(lobbyId);
        
        if (asSpectator || lobby.players.length >= 2) {
          // Join as spectator
          lobby.spectators.push({ id: socket.id, name: playerName });
          playerSessions.set(socket.id, { lobbyId, role: 'spectator' });
          socket.emit('lobby-joined', { lobby, role: 'spectator' });
        } else {
          // Join as player
          lobby.players.push({ id: socket.id, name: playerName, isHost: false });
          playerSessions.set(socket.id, { lobbyId, role: 'player' });
          socket.emit('lobby-joined', { lobby, role: 'player' });
        }
        
        // Update all clients in lobby
        io.to(lobbyId).emit('lobby-updated', lobby);
        // Update home page
        io.emit('lobby-updated', lobby);
      });

      // Start battle
      socket.on('start-battle', (data) => {
        const { lobbyId } = data;
        const lobby = activeLobbies.get(lobbyId);
        
        if (!lobby || lobby.host !== socket.id) {
          socket.emit('error', { message: 'Only host can start battle' });
          return;
        }

        if (lobby.players.length < 2) {
          socket.emit('error', { message: 'Need at least 2 players to start' });
          return;
        }

        // Create battle session
        const battleId = `battle_${Date.now()}`;
        const battleSession: Battle = {
          id: battleId,
          lobbyId: lobbyId,
          players: lobby.players,
          spectators: lobby.spectators,
          settings: lobby.settings,
          gameState: {
            currentTurn: 1,
            turnStartTime: Date.now(),
            activePlayer: lobby.players[0].id,
            nations: {} // Will be populated with actual nation data
          },
          status: 'in-progress',
          startedAt: new Date().toISOString()
        };

        activeBattles.set(battleId, battleSession);
        lobby.status = 'in-progress' as const;
        lobby.battleId = battleId;

        // Move all players and spectators to battle room
        io.to(lobbyId).emit('battle-started', { battleSession });
        io.emit('battle-created', battleSession);
      });

      // Battle actions
      socket.on('battle-action', (data) => {
        const { battleId, action, actionData } = data;
        const battle = activeBattles.get(battleId);
        
        if (!battle) {
          socket.emit('error', { message: 'Battle not found' });
          return;
        }

        // Validate player can make this action
        const player = battle.players.find((p: Player) => p.id === socket.id);
        if (!player && action !== 'spectate') {
          socket.emit('error', { message: 'Not authorized to make battle actions' });
          return;
        }

        // Process the action (purchase units, advance turn, etc.)
        // This would integrate with your existing battle simulation engine
        
        // Broadcast action to all players and spectators
        io.to(battle.lobbyId).emit('battle-updated', {
          battleId,
          action,
          actionData,
          gameState: battle.gameState,
          timestamp: Date.now()
        });
      });

      // Get active battles and lobbies
      socket.on('get-active-games', () => {
        const publicLobbies = Array.from(activeLobbies.values()).map(lobby => ({
          ...lobby,
          playerCount: lobby.players.length,
          spectatorCount: lobby.spectators.length
        }));
        
        const publicBattles = Array.from(activeBattles.values()).map(battle => ({
          id: battle.id,
          playerCount: battle.players.length,
          spectatorCount: battle.spectators.length,
          status: battle.status,
          startedAt: battle.startedAt,
          settings: battle.settings
        }));

        socket.emit('active-games', {
          lobbies: publicLobbies,
          battles: publicBattles
        });
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
        const session = playerSessions.get(socket.id);
        
        if (session) {
          const { lobbyId, role } = session;
          const lobby = activeLobbies.get(lobbyId);
          
          if (lobby) {
            if (role === 'player') {
              lobby.players = lobby.players.filter((p: Player) => p.id !== socket.id);
              
              // If host left, assign new host or close lobby
              if (lobby.host === socket.id && lobby.players.length > 0) {
                lobby.host = lobby.players[0].id;
                lobby.players[0].isHost = true;
              } else if (lobby.players.length === 0) {
                activeLobbies.delete(lobbyId);
                io.emit('lobby-closed', { lobbyId });
              }
            } else {
              lobby.spectators = lobby.spectators.filter((s: Spectator) => s.id !== socket.id);
            }
            
            if (activeLobbies.has(lobbyId)) {
              io.to(lobbyId).emit('lobby-updated', lobby);
              io.emit('lobby-updated', lobby);
            }
          }
          
          playerSessions.delete(socket.id);
        }
      });
    });
  }

  return new Response('Socket.io server initialized', { status: 200 });
}
