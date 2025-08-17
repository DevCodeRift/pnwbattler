import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { nationId } = await request.json();
    
    if (!nationId) {
      return NextResponse.json(
        { error: 'Nation ID is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.PW_BOT_API_KEY || process.env.NEXT_PUBLIC_PW_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'No API key configured' },
        { status: 500 }
      );
    }

    console.log(`Attempting to send test message to nation ${nationId}`);
    console.log(`Using API key: ${apiKey.substring(0, 8)}...`);

    // Send test message via P&W REST API
    const messageResponse = await fetch('https://politicsandwar.com/api/send-message/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        key: apiKey,
        to: nationId,
        subject: 'PnW Battler - Test Message',
        message: `
          <h3>Test Message from PnW Battler</h3>
          <p>This is a test message to verify that our message sending API is working correctly.</p>
          <p>Sent at: ${new Date().toISOString()}</p>
          <p>From: ${(session.user as any).username || 'Unknown User'}</p>
          <hr>
          <p><em>This is an automated test message.</em></p>
        `.trim()
      }),
    });

    console.log(`Message API response status: ${messageResponse.status}`);

    if (messageResponse.ok) {
      const messageResult = await messageResponse.json();
      console.log('Message API response:', messageResult);
      
      if (messageResult.success) {
        return NextResponse.json({
          success: true,
          message: 'Test message sent successfully!',
          response: messageResult
        });
      } else {
        return NextResponse.json({
          success: false,
          error: 'Message sending failed',
          response: messageResult
        }, { status: 400 });
      }
    } else {
      const errorText = await messageResponse.text();
      console.error('Message API error response:', errorText);
      
      return NextResponse.json({
        success: false,
        error: 'HTTP error from P&W API',
        status: messageResponse.status,
        response: errorText
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in test message API:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
