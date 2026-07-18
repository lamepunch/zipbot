import { ChannelType, Message } from "discord.js";

import { formatError } from "../utils/helpers.js";

import log from "../logger.js";
import react from "../triggers/react.js";
import recordOccurrences from "../triggers/words.js";

export default async function messageCreate(message: Message) {
  let { content, author, channel, guild } = message;

  log.debug(
    {
      id: message.id,
      author: author.username,
      channel: channel.id,
      content: { body: content, embeds: message.embeds },
    },
    "messageCreate event fired",
  );

  let isZippable: boolean =
    content.match(/unzip/i) !== null &&
    !author.bot &&
    channel.type === ChannelType.GuildText &&
    guild !== null;

  if (isZippable) {
    log.info("Message content matched react criteria");

    try {
      await react(message);
    } catch (error) {
      log.error({ error: formatError(error) }, "Error executing react command");
    }
  }

  // Check to see if message content matches any active tracked words
  if (!author.bot && channel.type === ChannelType.GuildText && guild !== null) {
    await recordOccurrences(message);
  }
}
