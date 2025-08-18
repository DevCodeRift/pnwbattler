import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('DB-CHECK: Starting database connectivity test');

    // Test 1: Basic connection
    const startTime = Date.now();
    
    // Test 2: Check if tables exist by trying to count records
    const tests: any = {};
    
    try {
      tests.users = await prisma.user.count();
      console.log('DB-CHECK: Users table exists, count:', tests.users);
    } catch (e) {
      tests.users = { error: e instanceof Error ? e.message : 'Unknown error' };
      console.log('DB-CHECK: Users table error:', tests.users);
    }

    try {
      tests.lobbies = await prisma.lobby.count();
      console.log('DB-CHECK: Lobbies table exists, count:', tests.lobbies);
    } catch (e) {
      tests.lobbies = { error: e instanceof Error ? e.message : 'Unknown error' };
      console.log('DB-CHECK: Lobbies table error:', tests.lobbies);
    }

    try {
      tests.onlineUsers = await prisma.onlineUser.count();
      console.log('DB-CHECK: OnlineUsers table exists, count:', tests.onlineUsers);
    } catch (e) {
      tests.onlineUsers = { error: e instanceof Error ? e.message : 'Unknown error' };
      console.log('DB-CHECK: OnlineUsers table error:', tests.onlineUsers);
    }

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log('DB-CHECK: All tests completed in', responseTime, 'ms');

    return NextResponse.json({
      status: 'success',
      message: 'Database connection test completed',
      responseTime: `${responseTime}ms`,
      tableTests: tests,
      databaseUrl: process.env.DATABASE_URL ? 'configured' : 'missing',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('DB-CHECK: Connection test failed:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : null,
      databaseUrl: process.env.DATABASE_URL ? 'configured' : 'missing',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
