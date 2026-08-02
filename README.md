# Zipbot

A Discord bot that tries to bring joy to its users. It reacts to messages containing "unzip" with a random image, keeps a database of memorable quotes, and tracks command invocations on a leaderboard. Extra commands and message triggers can be dropped into `extensions/` and are loaded at startup.

Built with Discord.js v14 and Prisma on the Bun runtime.

## Setup

Requires [Bun](https://bun.com) and a PostgreSQL database.

```bash
bun install
cp .env.example .env
```

Fill in `TOKEN` with your bot token and point `DATABASE_URL`/`DIRECT_URL` at your database, then set up the schema and start the bot:

```bash
bun run prisma:generate
bun run prisma:migrate
bunx prisma db seed
bun run start:dev
```

## Commands

```bash
bun run start:dev      # run with hot reload
bun run start          # run once
bun run build          # type-check
bun run task:register  # register an application command, e.g. task:register echo
```
