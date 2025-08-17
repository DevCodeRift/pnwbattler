import { NextRequest, NextResponse } from 'next/server';
import { BattleSimulationEngine } from '@/lib/battle-simulation-engine';
import { SimulationSettings, BattleMode, EconomyMode, MilitarizationLevel } from '@/types/simulation';

const battleEngine = new BattleSimulationEngine();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'create_session':
        return handleCreateSession(data);
      case 'join_session':
        return handleJoinSession(data);
      case 'start_session':
        return handleStartSession(data);
      case 'get_session':
        return handleGetSession(data);
      case 'get_open_lobbies':
        return handleGetOpenLobbies();
      case 'execute_action':
        return handleExecuteAction(data);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Battle simulation API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleCreateSession(data: any) {
  const {
    battleMode,
    turnCooldown = 60,
    turnsUntilRecruitment = 1,
    militarizationLevel = MilitarizationLevel.PARTIAL,
    customMilitary,
    economyMode = EconomyMode.LIMITED,
    customResources,
    spyOperationsEnabled = true,
    isPrivate = false,
    inviteNationId,
    inviteMessage,
    hostNation
  } = data;

  const settings: SimulationSettings = {
    battleMode: battleMode || BattleMode.AI,
    turnCooldown,
    turnsUntilRecruitment,
    militarizationLevel,
    customMilitary,
    economySettings: {
      mode: economyMode,
      resources: customResources || {}
    },
    spyOperationsEnabled,
    isPrivate,
    inviteNationId,
    inviteMessage
  };

  const session = battleEngine.createSession(settings, hostNation || {});

  // If it's an AI battle, add an AI opponent
  if (battleMode === BattleMode.AI) {
    battleEngine.joinSession(session.id, {
      id: 'ai_opponent',
      nation_name: 'AI Opponent',
      leader_name: 'AI Leader'
    });
  }

  // If it's a private invite, send invitation message
  if (battleMode === BattleMode.PRIVATE_INVITE && inviteNationId) {
    await sendInvitationMessage(inviteNationId, session.id, inviteMessage);
  }

  return NextResponse.json({ 
    success: true, 
    session: {
      id: session.id,
      mode: session.mode,
      participants: session.participants.length,
      isActive: session.isActive,
      settings: session.settings
    }
  });
}

async function handleJoinSession(data: any) {
  const { sessionId, nation } = data;
  
  const success = battleEngine.joinSession(sessionId, nation);
  
  if (!success) {
    return NextResponse.json({ error: 'Failed to join session' }, { status: 400 });
  }

  const session = battleEngine.getSession(sessionId);
  return NextResponse.json({ 
    success: true, 
    session: {
      id: session?.id,
      participants: session?.participants.length,
      isActive: session?.isActive
    }
  });
}

async function handleStartSession(data: any) {
  const { sessionId } = data;
  
  const success = battleEngine.startSession(sessionId);
  
  if (!success) {
    return NextResponse.json({ error: 'Failed to start session' }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

async function handleGetSession(data: any) {
  const { sessionId } = data;
  
  const session = battleEngine.getSession(sessionId);
  
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  return NextResponse.json({ session });
}

async function handleGetOpenLobbies() {
  const lobbies = battleEngine.getOpenLobbies();
  
  return NextResponse.json({ 
    lobbies: lobbies.map(lobby => ({
      id: lobby.id,
      mode: lobby.mode,
      participants: lobby.participants.length,
      settings: {
        turnCooldown: lobby.settings.turnCooldown,
        economyMode: lobby.settings.economySettings.mode,
        militarizationLevel: lobby.settings.militarizationLevel,
        spyOperationsEnabled: lobby.settings.spyOperationsEnabled
      },
      created_at: lobby.created_at
    }))
  });
}

async function handleExecuteAction(data: any) {
  const { sessionId, nationId, battleAction } = data;
  
  const success = battleEngine.executeBattleAction(sessionId, nationId, battleAction);
  
  if (!success) {
    return NextResponse.json({ error: 'Failed to execute action' }, { status: 400 });
  }

  const session = battleEngine.getSession(sessionId);
  return NextResponse.json({ success: true, session });
}

async function sendInvitationMessage(nationId: string, sessionId: string, customMessage?: string) {
  // This would integrate with the Politics & War API to send an in-game message
  // For now, we'll just log it
  const message = customMessage || 
    `You've been invited to a battle simulation on PNW Battler! Join at https://www.pnwbattler.com/battle/join/${sessionId}`;
  
  console.log(`Sending invitation to nation ${nationId}: ${message}`);
  
  // TODO: Implement actual Politics & War API integration
  // This would require the PnW API endpoint for sending messages
}
