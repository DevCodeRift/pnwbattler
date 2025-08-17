# Automatic Lobby Cleanup System

## Overview
The multiplayer battle system now includes automatic lobby cleanup to prevent abandoned lobbies from cluttering the interface. Lobbies that remain inactive for 5 minutes are automatically closed and removed from the system.

## How It Works

### 1. Activity Tracking
- **Lobby Creation**: When a lobby is created, its `createdAt` and `updatedAt` timestamps are set
- **Player Actions**: The following actions update the lobby's `updatedAt` timestamp:
  - Player joins lobby
  - Player leaves lobby
  - Battle is started
  - Any lobby interaction

### 2. Cleanup Criteria
A lobby is considered **inactive** and eligible for cleanup when:
- Status is `WAITING` (not in-progress battles)
- `updatedAt` timestamp is older than 5 minutes
- No recent player activity

### 3. Cleanup Process
- **Automatic**: Runs every time the active games list is requested
- **Manual**: Can be triggered via the `/api/lobby-cleanup` endpoint
- **Periodic**: Frontend triggers cleanup every 2 minutes
- **Real-time**: Cleanup notifications sent via Pusher

### 4. Cleanup Actions
When a lobby is cleaned up:
1. Lobby is deleted from database (cascade deletes players/spectators)
2. Real-time notification sent to `multiplayer` channel
3. Notification sent to lobby-specific channel if players are present
4. Cleanup details logged to console

## API Endpoints

### GET /api/lobby-cleanup
Check for inactive lobbies without cleaning them up.

**Response:**
```json
{
  "inactiveLobbies": [
    {
      "id": "lobby_id",
      "hostName": "TestHost",
      "playerCount": 1,
      "createdAt": "2025-08-17T10:00:00Z",
      "lastActivity": "2025-08-17T10:02:00Z",
      "inactiveMinutes": 8
    }
  ],
  "count": 1,
  "message": "Found 1 inactive lobbies ready for cleanup"
}
```

### POST /api/lobby-cleanup
Perform cleanup of inactive lobbies.

**Response:**
```json
{
  "success": true,
  "message": "Cleanup completed. Removed 2 inactive lobbies.",
  "details": {
    "cleanedLobbies": 2,
    "totalFound": 2,
    "lobbies": [
      {
        "id": "lobby_id",
        "hostName": "TestHost",
        "playerCount": 0,
        "inactiveFor": 7
      }
    ]
  }
}
```

## Real-time Notifications

### Global Notifications (multiplayer channel)
```javascript
pusher.subscribe('multiplayer').bind('lobby-closed', (data) => {
  // data.lobbyId - ID of closed lobby
  // data.reason - 'inactive'
  // data.message - Explanation message
});
```

### Lobby-specific Notifications
```javascript
pusher.subscribe(`lobby-${lobbyId}`).bind('lobby-closed', (data) => {
  // Sent to players in the lobby when it's closed
  // data.reason - 'inactive'
  // data.message - User-friendly explanation
});
```

## Frontend Integration

### Automatic Cleanup
- Triggered every time active games are loaded
- Periodic cleanup every 2 minutes
- No user intervention required

### Activity Updates
The system automatically tracks activity when:
- Loading the multiplayer page
- Joining/leaving lobbies
- Starting battles
- Any multiplayer API calls

## Testing

### Run Tests
```bash
# Test cleanup functionality
node test-cleanup.js

# Demo the cleanup system
node demo-cleanup.js
```

### Manual Testing
1. Create lobbies via the interface
2. Wait 5+ minutes without any activity
3. Refresh the page or wait for automatic cleanup
4. Verify lobbies are removed

### API Testing
```bash
# Check for inactive lobbies
curl http://localhost:3000/api/lobby-cleanup

# Trigger cleanup
curl -X POST http://localhost:3000/api/lobby-cleanup
```

## Configuration

### Cleanup Timing
- **Inactivity Threshold**: 5 minutes (configurable in `lobby-cleanup.ts`)
- **Cleanup Frequency**: Every API call + every 2 minutes from frontend
- **Grace Period**: None (exactly 5 minutes of inactivity)

### Customization
To change the inactivity threshold, modify the constant in `src/lib/lobby-cleanup.ts`:

```typescript
// Change from 5 minutes to desired time
const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
```

## Benefits

1. **Clean Interface**: No abandoned lobbies cluttering the lobby list
2. **Resource Management**: Prevents database bloat from unused lobbies  
3. **User Experience**: Players see only active, available lobbies
4. **Automatic**: No manual intervention required
5. **Real-time**: Players notified immediately when lobbies close
6. **Configurable**: Easy to adjust timing and behavior

## Monitoring

The system logs cleanup activities:
- Number of lobbies cleaned
- Details of each cleaned lobby
- Cleanup timing and frequency
- Any errors during cleanup

Check the server console or logs for cleanup activity information.
