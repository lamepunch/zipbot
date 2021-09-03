import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v8";

import leaderboard from "./commands/leaderboard";

const TOKEN = process.env.TOKEN || "";
const CLIENT_ID = process.env.CLIENT_ID || "";

if (!TOKEN || !CLIENT_ID) {
  throw new Error("Missing token or client ID");
}

let API = new REST({ version: "8" }).setToken(TOKEN);

console.log(leaderboard.data.toJSON());

async () => {
  try {
    let request = await API.put(
      Routes.applicationGuildCommands(CLIENT_ID, "829607606867066911"),
      {
        body: [leaderboard.data.toJSON()],
      }
    );
    console.log(request.data);
  } catch (error) {
    console.error(error);
  }
};
