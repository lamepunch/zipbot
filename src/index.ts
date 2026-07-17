import { Client, Events, GatewayIntentBits } from "discord.js";

import log from "./logger.js";

import guildCreate from "./events/GuildCreate.js";
import messageCreate from "./events/MessageCreate.js";
import interactionCreate from "./events/InteractionCreate.js";

let client: Client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.on(Events.GuildCreate, guildCreate);
client.on(Events.MessageCreate, messageCreate);
client.on(Events.InteractionCreate, interactionCreate);

client.on(Events.ClientReady, async (client) => {
  log.debug("clientReady event fired");

  log.info(
    client.user,
    `Successfully authenticated as ${client.user.displayName}`,
  );
});

try {
  await client.login(process.env.TOKEN);
} catch (error) {
  log.error(error, "Discord client error during login");
}
