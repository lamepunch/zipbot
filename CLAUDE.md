# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Zipbot is a Discord bot built with Discord.js v13 that:
- Responds to messages containing "unzip" with random reaction images
- Manages a quote database where users can highlight memorable messages
- Tracks user invocations and provides a leaderboard
- Uses Prisma ORM with PostgreSQL for data persistence

## Development Commands

**Development workflow:**
```bash
npm run start:dev          # Run with hot reload (ts-node-dev)
npm run build              # Compile TypeScript to dist/
npm start                  # Run compiled JavaScript from dist/
```

**Database management:**
```bash
npm run prisma:generate    # Generate Prisma client after schema changes
npm run prisma:migrate     # Apply migrations (production)
npx prisma migrate dev     # Create and apply migration (development)
npx prisma studio          # Open database GUI
```

**Docker deployment:**
```bash
docker-compose up          # Start app with PostgreSQL
```

## Architecture

### Command System

Commands are registered in a Collection in `src/index.ts` and must implement the `Command<T>` interface:

```typescript
interface Command<T> {
  data: any;                        // Command metadata (name, description, type)
  execute: (interaction: T) => Promise<void>;
}
```

**Command Types:**
- `Command<Message>` - Message-based commands (e.g., react.ts)
- `Command<CommandInteraction>` - Slash commands (e.g., quote.ts, leaderboard.ts)
- `Command<ContextMenuInteraction>` - Context menu commands (e.g., highlight.ts)

### Event Flow

**src/index.ts** is the entry point that:
1. Initializes Discord client with GUILDS and GUILD_MESSAGES intents
2. Registers command handlers in a Collection
3. Handles three events:
   - `guildCreate` - Creates Guild record when bot joins a server
   - `messageCreate` - Triggers react command when message contains "unzip"
   - `interactionCreate` - Routes slash/context menu commands to handlers

### Database Schema & Patterns

**Core Models:**
- `Guild` - Discord server (1:many with channels, invocations, quotes)
- `User` - Discord user (1:many with invocations, quotes as author/submitter)
- `Channel` - Text channel (belongs to Guild)
- `Invocation` - Tracks each "unzip" reaction event
- `Quote` - Saved message with author, submitter, and metadata

**Critical Pattern: connectOrCreate**
All commands use Prisma's `connectOrCreate` to handle first-time users/channels:
```typescript
user: {
  connectOrCreate: {
    create: { id: author.id, name: author.username },
    where: { id: author.id }
  }
}
```
This prevents duplicate key errors when a user/channel is encountered for the first time.

### Command Implementations

**react.ts** (auto-triggered on "unzip"):
- Creates Invocation record linking user, guild, channel
- Returns random image from REACTIONS array
- Displays invocation count in footer

**highlight.ts** (context menu):
- Right-click command to save quotes
- Validates: non-bot author, text channel, no duplicate messageId
- Creates Quote with author (user), submitter (user), and content
- Adds ⭐ reaction to original message

**quote.ts** (slash command):
- Fetches random quote by selecting random ID between 1 and count
- Displays in embed with author ("Wisdom Dispenser"), submitter ("Inscriptor of History"), and permalink

**leaderboard.ts** (slash command):
- Caches top 5 users by invocation count for 30 minutes
- Cache invalidation logic in `determineCacheState()`

## Environment Variables

See `.env.example`:
- `TOKEN` - Discord bot token
- `DATABASE_URL` - PostgreSQL connection string
- `NODE_ENV` - Controls Prisma logging (development shows queries)
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` - Docker PostgreSQL config

## Key Files

- `src/index.ts` - Main entry point, event handlers, command registration
- `src/prisma.ts` - Singleton PrismaClient with conditional logging
- `src/constants.ts` - REACTIONS array, embed colors, leaderboard emojis
- `src/types.d.ts` - Command interface and type definitions
- `prisma/schema.prisma` - Database schema
