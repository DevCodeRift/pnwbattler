import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { EnhancedMultiplayerManager, type EnhancedBattleAction } from '../../../lib/enhanced-multiplayer-manager';
import { EnhancedBattleAnalyzer } from '../../../lib/enhanced-battle-analyzer';
import { AttackType } from '../../../types/simulation';

// Global manager instance (in production, this would be managed differently)
const multiplayerManager = new EnhancedMultiplayerManager();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { action, sessionId, ...actionData } = await request.json();

    const userId = (session.user as any).discordId || (session.user as any).id || 'unknown';

    switch (action) {
      case 'create_session':
        return handleCreateSession(actionData, userId);
      
      case 'get_analysis':
        return handleGetAnalysis(actionData, sessionId);
      
      case 'execute_action':
        return handleExecuteAction(actionData, sessionId, userId);
      
      case 'get_session':
        return handleGetSession(sessionId);
      
      case 'get_analytics':
        return handleGetAnalytics(sessionId);
      
      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Enhanced multiplayer API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function handleCreateSession(data: any, userId: string) {
  try {
    const { settings, hostNation, multiplayerSettings } = data;
    
    const session = multiplayerManager.createEnhancedSession(
      `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      settings,
      { ...hostNation, id: userId },
      multiplayerSettings
    );

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        participants: session.participants,
        settings: session.settings,
        battleAnalytics: session.battleAnalytics,
        isActive: session.isActive,
        currentTurn: session.currentTurn
      }
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create session', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function handleGetAnalysis(data: any, sessionId: string) {
  try {
    const { attackerId, targetId, attackType } = data;
    
    const analysis = multiplayerManager.getPreBattleAnalysis(
      sessionId,
      attackerId,
      targetId,
      attackType as AttackType
    );

    if (!analysis) {
      return NextResponse.json(
        { error: 'Unable to generate analysis' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      analysis
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get analysis', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function handleExecuteAction(data: any, sessionId: string, userId: string) {
  try {
    const action: EnhancedBattleAction = data;
    
    const result = await multiplayerManager.executeEnhancedBattleAction(
      sessionId,
      userId,
      action
    );

    return NextResponse.json({
      success: result.success,
      result: result.result,
      error: result.error,
      session: result.updatedSession ? {
        id: result.updatedSession.id,
        participants: result.updatedSession.participants,
        battleAnalytics: result.updatedSession.battleAnalytics,
        isActive: result.updatedSession.isActive,
        currentTurn: result.updatedSession.currentTurn
      } : undefined
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to execute action', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function handleGetSession(sessionId: string) {
  try {
    const session = multiplayerManager.getEnhancedSession(sessionId);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        participants: session.participants,
        settings: session.settings,
        battleAnalytics: session.battleAnalytics,
        isActive: session.isActive,
        currentTurn: session.currentTurn,
        battleHistory: session.battleHistory || []
      }
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get session', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function handleGetAnalytics(sessionId: string) {
  try {
    const analytics = multiplayerManager.getBattleAnalytics(sessionId);
    
    if (!analytics) {
      return NextResponse.json(
        { error: 'Analytics not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      analytics
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get analytics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const action = searchParams.get('action');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    if (action === 'analytics') {
      return handleGetAnalytics(sessionId);
    } else {
      return handleGetSession(sessionId);
    }

  } catch (error) {
    console.error('Enhanced multiplayer GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
