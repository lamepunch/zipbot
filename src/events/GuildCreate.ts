import { Guild } from "discord.js";

import type { Guild as Server } from "../generated/prisma/client.js";

import prisma from "../prisma.js";
import log from "../logger.js";

export default async function guildCreate(guild: Guild) {
  log.debug("guildCreate event fired");

  // Whenever Zipbot joins a new guild, create a new Guild entry in the database
  let { id, name } = guild;
  // @TODO: Make this an upsert instead of a create
  let createGuild: Server = await prisma.guild.create({
    data: {
      snowflakeId: id,
      name,
    },
  });
  // @TODO: Add a check to see if the guild was created, if not inform the bot administrator
}
