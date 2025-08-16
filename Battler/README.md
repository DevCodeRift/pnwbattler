# PW Battle Simulator

A multiplayer battle simulation app for Politics and War, built with Next.js and TypeScript.

## Features

- **Discord Authentication**: Login with Discord to access multiplayer features
- **Politics & War Integration**: Link your P&W account and import nation data via GraphQL API
- **Real-time Battles**: Turn-based combat with action points and realistic damage calculations
- **Custom Nations**: Create custom builds with preferred city layouts and military compositions
- **Multiplayer Matches**: Host private tournaments or join public battles
- **Account Verification**: Secure P&W account linking with in-game verification codes

## Tech Stack

- **Frontend**: Next.js 15 with App Router, TypeScript, Tailwind CSS
- **Authentication**: NextAuth.js with Discord provider
- **API**: GraphQL with Apollo Client for Politics and War API
- **Real-time**: Socket.IO for multiplayer functionality
- **State Management**: Zustand
- **Database**: Vercel KV for session storage and match data
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Discord application for OAuth
- Politics and War API key
- Politics and War bot account for verification

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Battler
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```

4. Configure environment variables in `.env.local`:
   - Set up Discord OAuth application and get client ID/secret
   - Get Politics and War API key from [P&W API](https://politicsandwar.com/api/)
   - Generate NextAuth secret: `openssl rand -base64 32`
   - Set up Vercel KV database for production

### Discord OAuth Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to OAuth2 settings
4. Add redirect URI: `http://localhost:3000/api/auth/callback/discord`
5. Copy Client ID and Client Secret to `.env.local`

### Politics and War API Setup

1. Go to [Politics and War API](https://politicsandwar.com/api/)
2. Generate an API key
3. Add the API key to `.env.local`
4. For verification features, set up a bot nation account

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

## Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Set up environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production

Make sure to set all environment variables from `.env.example` in your Vercel dashboard.

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # React components
├── lib/                # Utility functions and configurations
├── stores/             # Zustand state management
├── types/              # TypeScript type definitions
└── hooks/              # Custom React hooks
```

## API Routes

- `/api/auth/[...nextauth]` - NextAuth.js authentication
- `/api/pw/verify` - Politics and War account verification
- `/api/battles` - Battle management endpoints
- `/api/nations` - Nation data endpoints

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Security Note

Never commit sensitive information like API keys or secrets to the repository. Always use environment variables and keep `.env.local` in `.gitignore`.

## Support

For questions or issues, please open a GitHub issue or contact the development team.
