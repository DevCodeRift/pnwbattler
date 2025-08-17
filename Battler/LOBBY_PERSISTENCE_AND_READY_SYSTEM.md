# Session-Based Lobby Persistence & Ready System

## Overview
The multiplayer lobby system now includes session-based persistence and a ready system to ensure smooth gameplay experience and prevent accidental battle starts.

## New Features

### 1. Session-Based Lobby Persistence
Players can now navigate away from lobbies and return without losing their spot.

#### How It Works:
- **Discord ID Tracking**: Players are linked to lobbies via their Discord ID from authentication
- **Automatic Rejoining**: When players return to the multiplayer page, they automatically rejoin their active lobby
- **Persistent Access**: Lobby access is maintained even if the browser is refreshed or closed temporarily
- **Session Validation**: Only authenticated users with valid sessions can join/rejoin lobbies

#### Benefits:
- ✅ No more losing lobby access when navigating away
- ✅ Players can return to lobbies even after browser refresh
- ✅ Seamless experience across browser sessions
- ✅ Prevents accidental lobby exits

### 2. Ready System
Both players must confirm they're ready before a battle can start.

#### How It Works:
- **Individual Ready Status**: Each player has an independent ready/not ready status
- **Visual Indicators**: Clear UI showing which players are ready vs not ready
- **Ready Toggle**: Players can toggle their ready status with a single button
- **Host Control**: Only the host can start battles, and only when all players are ready
- **Real-time Updates**: Ready status changes are broadcast instantly to all lobby members

#### Benefits:
- ✅ Prevents accidental battle starts
- ✅ Ensures both players are prepared
- ✅ Clear communication of player readiness
- ✅ Host has full control over battle initiation

## API Endpoints

### New Actions in `/api/multiplayer`

#### `get-my-lobby`
Checks if the current user is in any active lobby.

**Request:**
```javascript
{
  "action": "get-my-lobby"
}
```

**Response:**
```javascript
{
  "lobby": {
    "id": "lobby_id",
    "hostName": "HostName",
    "playerCount": 2,
    "status": "WAITING",
    "players": [
      {
        "id": "player_id",
        "name": "PlayerName",
        "isHost": true,
        "isReady": false
      }
    ]
  },
  "rejoined": true
}
```

#### `toggle-ready`
Toggles the current player's ready status.

**Request:**
```javascript
{
  "action": "toggle-ready",
  "lobbyId": "lobby_id"
}
```

**Response:**
```javascript
{
  "lobby": {/* updated lobby data */},
  "isReady": true
}
```

## Database Schema Changes

### Player Model Updates
```prisma
model Player {
  id        String   @id @default(cuid())
  name      String
  discordId String?  // NEW: Links player to Discord session
  isHost    Boolean  @default(false)
  isReady   Boolean  @default(false)  // NEW: Ready status
  lobbyId   String
  createdAt DateTime @default(now())
  lobby     Lobby    @relation(fields: [lobbyId], references: [id], onDelete: Cascade)
}
```

## Real-time Events

### New Pusher Events

#### `player-ready-changed`
Sent when a player toggles their ready status.

```javascript
pusher.subscribe(`lobby-${lobbyId}`).bind('player-ready-changed', (data) => {
  // data.playerId - Player who changed status
  // data.playerName - Player's name
  // data.isReady - New ready status
  // data.lobby - Updated lobby state
});
```

#### `lobby-closed`
Enhanced to include inactivity and other closure reasons.

```javascript
pusher.subscribe(`lobby-${lobbyId}`).bind('lobby-closed', (data) => {
  // data.reason - Reason for closure ('inactive', 'manual', etc.)
  // data.message - User-friendly message
});
```

## Frontend Features

### Automatic Lobby Rejoining
- Checks for existing lobby on page load
- Automatically subscribes to lobby events
- Restores lobby state and UI

### Enhanced Lobby UI
```javascript
// Player status display
{currentLobby.players?.map(player => (
  <div key={player.id}>
    <span>{player.name}</span>
    {player.isHost && <span>HOST</span>}
    {player.isReady ? (
      <span className="bg-green-600">✓ Ready</span>
    ) : (
      <span className="bg-red-600">Not Ready</span>
    )}
  </div>
))}

// Ready toggle button
<button onClick={toggleReady}>
  {isCurrentPlayerReady ? 'Cancel Ready' : 'Ready Up!'}
</button>

// Start battle (host only, all players ready)
<button 
  onClick={startBattle}
  disabled={!allPlayersReady || !isHost}
>
  Start Battle
</button>
```

### Status Messages
- **Waiting for players**: "Need at least 2 players to start the battle"
- **Waiting for ready**: "Waiting for all players to ready up: PlayerName"
- **All ready**: "✓ All players ready! Host can start the battle."

## User Flow

### Joining a Lobby
1. **Authentication Check**: User must be logged in with Discord
2. **Existing Lobby Check**: System checks if user is already in a lobby
3. **Auto-rejoin**: If found, user is automatically returned to their lobby
4. **New Join**: If not in a lobby, user can join available lobbies
5. **Session Linking**: User's Discord ID is stored with player record

### Ready Process
1. **Initial State**: All players start as "Not Ready"
2. **Ready Toggle**: Players click "Ready Up!" to confirm readiness
3. **Visual Update**: UI updates immediately with ready status
4. **Real-time Sync**: Other players see the status change instantly
5. **Battle Start**: Host can start battle only when all players are ready

### Leaving and Rejoining
1. **Navigation Away**: Player navigates to another page or closes browser
2. **Session Persistence**: Player's lobby membership remains in database
3. **Return Visit**: Player returns to multiplayer page
4. **Automatic Detection**: System finds player's active lobby
5. **Seamless Rejoin**: Player is returned to lobby with current state

## Error Handling

### Session Issues
- **No Authentication**: Users must log in to access multiplayer features
- **Invalid Session**: Expired sessions require re-authentication
- **Discord ID Missing**: Fallback to username-based identification

### Lobby Access
- **Lobby Not Found**: Handle deleted/expired lobbies gracefully
- **Full Lobby**: Prevent joining when lobby is at capacity
- **Battle In Progress**: Block new joins when battle has started

### Ready System
- **Non-player Ready**: Only actual lobby players can toggle ready status
- **Host Requirements**: Only host can start battles
- **Ready Validation**: All players must be ready before battle start

## Testing

### Manual Test Cases

1. **Lobby Persistence**:
   - Join a lobby
   - Navigate away from the page
   - Return to multiplayer page
   - Verify automatic lobby rejoin

2. **Ready System**:
   - Create/join a 2-player lobby
   - Toggle ready status
   - Verify other player sees status change
   - Try to start battle without all players ready (should fail)
   - Ready up both players and start battle (should succeed)

3. **Session Handling**:
   - Join a lobby
   - Close browser completely
   - Reopen and return to site
   - Verify lobby rejoin after re-authentication

### API Testing
```bash
# Check for existing lobby
curl -X POST http://localhost:3000/api/multiplayer \
  -H "Content-Type: application/json" \
  -d '{"action": "get-my-lobby"}'

# Toggle ready status
curl -X POST http://localhost:3000/api/multiplayer \
  -H "Content-Type: application/json" \
  -d '{"action": "toggle-ready", "lobbyId": "lobby_id"}'
```

## Configuration

### Environment Variables
No new environment variables required. Uses existing Discord OAuth and database configuration.

### Database Migration
Run to apply the new Player model fields:
```bash
npx prisma db push
```

## Benefits Summary

1. **Improved User Experience**: Players don't lose lobby access when navigating
2. **Better Battle Control**: Ready system prevents accidental starts
3. **Enhanced Reliability**: Session-based persistence is more robust
4. **Real-time Coordination**: Players can see each other's ready status instantly
5. **Host Authority**: Clear host controls for battle management

This system ensures a much smoother multiplayer experience with proper session handling and coordinated battle starts.
