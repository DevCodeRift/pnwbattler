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

    // Validate nation ID is numeric
    if (!/^\d+$/.test(nationId.toString())) {
      return NextResponse.json(
        { error: 'Nation ID must be a number' },
        { status: 400 }
      );
    }

    const apiKey = process.env.PW_BOT_API_KEY || process.env.NEXT_PUBLIC_PW_API_KEY;
    
    console.log('Environment check:');
    console.log('- PW_BOT_API_KEY exists:', !!process.env.PW_BOT_API_KEY);
    console.log('- NEXT_PUBLIC_PW_API_KEY exists:', !!process.env.NEXT_PUBLIC_PW_API_KEY);
    console.log('- Using API key:', apiKey ? `${apiKey.substring(0, 8)}...` : 'NONE');
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'No API key configured - check PW_BOT_API_KEY environment variable' },
        { status: 500 }
      );
    }

    console.log(`Attempting to send test message to nation ${nationId}`);
    console.log(`Using API key: ${apiKey.substring(0, 8)}...`);

    const messageParams = {
      key: apiKey,
      to: nationId,
      subject: 'PnW Battler Test Message',
      message: 'This is a test message from PnW Battler to verify our message API is working. If you receive this, the integration is successful!'
    };

    console.log('Request parameters:', {
      ...messageParams,
      key: `${apiKey.substring(0, 8)}...`
    });

    // Send test message via P&W V2 REST API (send-message is still on V2)
    const messageResponse = await fetch('https://politicsandwar.com/api/v2/send-message/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(messageParams),
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
      
      // Try to parse as JSON first
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { raw: errorText };
      }
      
      return NextResponse.json({
        success: false,
        error: 'HTTP error from P&W API',
        status: messageResponse.status,
        statusText: messageResponse.statusText,
        response: errorData
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
