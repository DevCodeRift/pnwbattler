<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# PW Battle Simulator - Copilot Instructions

## Project Overview
This is a multiplayer battle simulation app for Politics and War, built with Next.js, TypeScript, and Tailwind CSS.

## Key Features
- Discord authentication for user login
- Politics and War API integration using GraphQL
- Real-time multiplayer battles with WebSocket
- Custom battle simulation with city builds, resources, and military actions
- Match hosting system (private/public matches)
- Account verification system for Politics and War accounts

## Tech Stack
- **Frontend**: Next.js 15 with App Router, TypeScript, Tailwind CSS
- **Authentication**: NextAuth.js with Discord provider
- **API**: GraphQL with Apollo Client for Politics and War API
- **Real-time**: Socket.IO for multiplayer functionality
- **State Management**: Zustand
- **Database**: We'll use Vercel KV for session storage and match data
- **Deployment**: Vercel

## Code Style Guidelines
- Use TypeScript for all new files
- Follow Next.js App Router conventions
- Use Tailwind CSS for styling with component composition
- Implement proper error handling and loading states
- Use server components where possible, client components only when needed
- Follow the Politics and War API GraphQL schema provided in the introspection

## Security Considerations
- Never include API keys or sensitive data in code (use environment variables)
- Implement proper input validation
- Use secure authentication flows
- Validate all Politics and War API responses

## File Structure
- `/src/app` - Next.js App Router pages and layouts
- `/src/components` - Reusable React components
- `/src/lib` - Utility functions, API clients, and configurations
- `/src/types` - TypeScript type definitions
- `/src/hooks` - Custom React hooks
- `/src/stores` - Zustand stores for state management
