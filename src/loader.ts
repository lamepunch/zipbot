import { access, readdir } from "node:fs/promises";
import { join } from "node:path";
import { Message } from "discord.js";

import type { Extension } from "./types.js";

import { formatError } from "./utils/helpers.js";

import log from "./logger.js";
import commands from "./commands/index.js";

const DIR = join(import.meta.dir, "../extensions");

let triggers: ((message: Message) => Promise<unknown>)[] = [];

// Load every extension: a top-level .ts file or a folder with an index.ts
export default async function loadExtensions() {
  let entries;
  try {
    entries = await readdir(DIR, { withFileTypes: true });
  } catch {
    log.info("No extensions directory found");
    return;
  }

  for (let entry of entries) {
    let path: string;
    if (entry.isDirectory() && !entry.name.startsWith(".")) {
      path = join(DIR, entry.name, "index.ts");
      try {
        await access(path);
      } catch {
        continue;
      }
    } else if (entry.isFile() && entry.name.endsWith(".ts")) {
      path = join(DIR, entry.name);
    } else {
      continue;
    }

    try {
      let extension: Extension = (await import(path)).default;

      for (let command of extension.commands ?? []) {
        commands.set(command.data.name.toLowerCase(), command);
      }
      triggers.push(...(extension.triggers ?? []));

      log.info(
        {
          commands: extension.commands?.length ?? 0,
          triggers: extension.triggers?.length ?? 0,
        },
        `Loaded ${entry.name} extension`,
      );
    } catch (error) {
      log.error({ error: formatError(error), path }, "Error loading extension");
    }
  }
}

export { triggers };
