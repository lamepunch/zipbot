import { REST, Routes } from "discord.js";

import type { APIApplication, APIApplicationCommand } from "discord.js";

import commands from "../commands/index.js";
import log from "../logger.js";
import loadExtensions from "../loader.js";

await loadExtensions();

let args = process.argv.slice(2);

if (args.length === 0) {
  log.error(
    { available: [...commands.keys()] },
    "Provide the name of a command to register",
  );
  process.exit(1);
}

let name = args[0];
let command = commands.get(name.toLowerCase());

if (!command) {
  log.error({ name, available: [...commands.keys()] }, "Unknown command name");
  process.exit(1);
}

let rest = new REST().setToken(process.env.TOKEN!);

let application = (await rest.get(
  Routes.currentApplication(),
)) as APIApplication;

let registered = (await rest.post(Routes.applicationCommands(application.id), {
  body: command.data,
})) as APIApplicationCommand;

log.info(registered, `Registered ${registered.name} command`);
