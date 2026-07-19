# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the code in this repository.

I try to keep it up-to-date as much as possible but you may find some outdated information.

## Project Overview

Zipbot is a Discord bot built with Discord.js v14 that tries to bring joy to its users.

The main features include:
- Responds to messages containing "unzip" with a random reaction image pulled from the database
- Manages a quote database where users can highlight memorable messages
- Tracks user invocations and provides a leaderboard
- Tracks per-guild word occurrences via configurable regex patterns
- Echoes user input back into the channel via a slash command
- Uses Prisma ORM (v7) with PostgreSQL for data persistence

The project runs on the Bun runtime and is written in TypeScript, trying to use the latest language features and libraries available, including ESM modules, even when that's not the easiest way to do something.

## Style Guide

The main guiding principle is to be as simple as possible, don't overcomplicate things, or try to be too clever. Readability and maintainability should be prioritized at all times. Comment your code only when necessary.

Do not rename existing variables when editing code. Preserve the names that are already there, even if they don't match your default convention — only introduce new names for new bindings.

## Development Commands

**Development workflow:**
```bash
bun run start:dev          # Run with hot reload (bun --watch)
bun run build              # Type-check via tsc (noEmit)
bun run start              # Run via bun from src/index.ts
bun run start:prod         # prisma generate + migrate deploy + start
```

**Database management:**
```bash
bun run prisma:generate    # Generate Prisma client after schema changes
bun run prisma:migrate     # Apply migrations (prisma migrate deploy)
bunx prisma migrate dev    # Create and apply migration (development)
bunx prisma studio         # Open database GUI
```

Prisma is configured via `prisma.config.ts` (loads `dotenv`, defines the datasource URL, and sets `bun ./prisma/seed.ts` as the seed command). The generated client is emitted to `src/generated/prisma` as ESM and imported from there.

**Tasks:**
```bash
bun run task:fetcher       # Run the fetcher task (src/tasks/fetcher.ts)
```

**Docker deployment:** the `Dockerfile` and `docker-compose.yml` are unused and mothballed — do not update or rely on them. Production runs Bun directly via `start:prod`.

## Architecture

### Command System

Commands live in `src/commands/` and must implement the `Command<T>` interface from `src/types.d.ts`:

```typescript
interface Command<T> {
  data: ...;                        // Discord REST API command body, conditional on T
  execute: (interaction: T) => Promise<void>;
}
```

`data` is typed against the Discord API registration body: `RESTPostAPIContextMenuApplicationCommandsJSONBody` for context-menu commands, `RESTPostAPIChatInputApplicationCommandsJSONBody` otherwise (context menus must not have a `description`).

**Command Types:**
- `Command<CommandInteraction>` — slash commands (e.g., `quote.ts`, `leaderboard.ts`, `echo.ts`)
- `Command<MessageContextMenuCommandInteraction>` — context menu commands (e.g., `highlight.ts`, `backfill.ts`)

Message-triggered behavior is not a command: it lives in `src/triggers/` (`react.ts`, `words.ts`) as plain functions called by the `MessageCreate` handler.

Commands are registered in a `Map<string, Command<any>>` in `src/commands/index.ts` (default export, imported by event handlers).

### Event Flow

`src/index.ts` is the entry point: it initializes the Discord client with `Guilds`, `GuildMessages`, and `MessageContent` intents, wires up the event handlers, and logs in. Handlers live in `src/events/` (PascalCase file names matching the `Events` enum member):
   - `GuildCreate.ts` — creates a `Guild` record when the bot joins a server
   - `MessageCreate.ts` — calls the `react` trigger when the message contains "unzip", and calls `recordOccurrences` from `src/triggers/words.ts` to record `Occurrence` rows for any active `Word` whose regex matches (active words are cached in-memory per guild with a 5-minute TTL, regexes precompiled at cache fill)
   - `InteractionCreate.ts` — routes chat-input and message context-menu commands to their handlers
   - `ClientReady` — logs successful authentication (kept inline in `src/index.ts`)

All errors from command execution are caught and reported via the logger; slash/context-menu failures also reply ephemerally to the user.

### Logging

`src/logger.ts` exports a singleton `pino` logger. When `NODE_ENV === "development"`, it runs at `debug` level through `pino-pretty`; in production it uses pino defaults. Use `log.debug/info/error` and pass structured objects as the first argument. `src/utils/helpers.ts` provides `formatError` to serialize thrown errors for logging.

### Database Schema & Patterns

**Core Models** (see `prisma/schema.prisma`):
- `Guild` — Discord server; has channels, invocations, quotes, words, occurrences
- `User` — Discord user (`snowflakeId`, `username`, `displayName`); has invocations, quotes (author + submitter), occurrences
- `Channel` — text channel belonging to a Guild
- `Command` — registered command metadata; referenced by invocations
- `Invocation` — records each command execution, optionally with guild, channel, and reaction image
- `Category` / `Image` — taxonomy + asset records; `Category.objectType` (`ObjectType` enum: `IMAGE` | `WORD`) says what a category classifies, names unique per type (`@@unique([name, objectType])`)
- `Quote` — saved message with author, submitter, channel, guild, and content
- `Word` — per-guild tracked term with a regex, `isActive` flag, and optional `categoryId` (`@@unique([guildId, name])`)
- `Occurrence` — records each match of a `Word` against a message

**Critical Pattern: connectOrCreate**
First-time users/channels are handled with Prisma's `connectOrCreate` keyed on `snowflakeId` to avoid duplicate key errors:
```typescript
user: {
  connectOrCreate: {
    create: {
      snowflakeId: author.id,
      username: author.username,
      displayName: author.displayName,
    },
    where: { snowflakeId: author.id },
  },
}
```

**Word occurrence recording**
Active words for a guild are read from an in-memory cache (5-minute TTL, refilled from the database on miss), each regex is compiled with the `gi` flag, and all matches across all words are written in a single `prisma.$transaction([...])`. Invalid stored regexes are caught per-word and logged without aborting the batch.

### Command Implementations

**triggers/react.ts** (auto-triggered on "unzip"):
- Fetches a random reaction image from the database via `prisma.image.findRandom` (limited to category id 1)
- Creates an `Invocation` record linking user, guild, channel, and the chosen image
- Builds the embed image URL from the image's category and `stem`/`id`
- Displays the invocation id in the embed footer

**highlight.ts** (message context menu):
- Right-click a message to save it as a quote
- Validates: non-bot author, text channel, no duplicate `messageId`
- Creates a `Quote` with author (user), submitter (user), content, channel, and guild
- Adds a ⭐ reaction to the original message

**quote.ts** (slash command):
- Fetches a random quote by selecting a random ID between 1 and `count`
- Displays in an embed with author ("Wisdom Dispenser"), submitter ("Inscriptor of History"), and permalink

**leaderboard.ts** (slash command):
- Fetches the top 5 users by invocation count fresh on every invocation via a TypedSQL query (`getInvocationLeaderboard`)

**echo.ts** (slash command):
- Replies with `<@userId> said: <message>` using the required `message` string option

**backfill.ts** (message context menu):
- Right-click a message to run the word-filter check on it after the fact
- Dedupe is per-word: matched words that already have an `Occurrence` row for the message are skipped, so reruns pick up words created since the last run
- Replies with how many words were newly recorded, that everything was already recorded, or that nothing matched

## Environment Variables

See `.env.example`:
- `TOKEN` — Discord bot token
- `DATABASE_URL` — PostgreSQL connection string
- `NODE_ENV` — `development` enables debug-level pretty logging
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` — Docker PostgreSQL config

## Key Files

- `src/index.ts` — entry point, client setup, event wiring
- `src/events/` — one file per gateway event handler (`GuildCreate`, `MessageCreate`, `InteractionCreate`)
- `src/prisma.ts` — singleton PrismaClient
- `src/logger.ts` — singleton pino logger
- `src/constants.ts` — embed colors and leaderboard emojis. Also holds the legacy `REACTIONS` array, kept for historical reference — reaction images are now sourced from the database, not this array.
- `src/types.d.ts` — `Command<T>` interface and shared type definitions
- `src/commands/` — one file per command (`highlight`, `quote`, `leaderboard`, `echo`, `backfill`) plus `index.ts` exporting the command map
- `src/triggers/` — message-triggered behavior (`react.ts`, `words.ts` with the word cache and `recordOccurrences`)
- `src/utils/` — helpers (`formatError`, fetcher utilities)
- `src/extensions/` — small standalone extensions (e.g., `random.ts`)
- `src/generated/prisma/` — generated Prisma client (ESM output)
- `prisma/schema.prisma` — database schema
- `prisma.config.ts` — Prisma datasource and seed configuration
