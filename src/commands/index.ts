import type { Command } from "../types.js";

import LeaderboardCommand from "./leaderboard.js";
import QuoteCommand from "./quote.js";
import HighlightCommand from "./highlight.js";
import EchoCommand from "./echo.js";
import BackfillCommand from "./backfill.js";

let commands = new Map<string, Command<any>>();
commands.set("leaderboard", LeaderboardCommand);
commands.set("quote", QuoteCommand);
commands.set("highlight", HighlightCommand);
commands.set("echo", EchoCommand);
commands.set("backfill", BackfillCommand);

export default commands;
