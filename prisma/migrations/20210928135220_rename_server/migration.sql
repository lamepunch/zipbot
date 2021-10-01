-- AlterTable
ALTER TABLE "Channel" RENAME COLUMN "serverId" TO "guildId";

-- AlterTable
ALTER TABLE "Invocation" RENAME COLUMN "serverId" TO "guildId";

-- AlterTable
ALTER TABLE "Server" RENAME TO "Guild";

-- AlterTable
ALTER TABLE "Channel" RENAME CONSTRAINT "Channel_serverId_fkey" TO "Channel_guildId_fkey";

-- AlterTable
ALTER TABLE "Invocation" RENAME CONSTRAINT "Invocation_serverId_fkey" TO "Invocation_guildId_fkey";

-- AlterTable
ALTER TABLE "Guild" RENAME CONSTRAINT "Server_pkey" TO "Guild_pkey";
