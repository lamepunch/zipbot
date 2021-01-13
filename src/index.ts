import { readFile, writeFile } from "fs/promises"
import { Client, Message, MessageEmbed } from "discord.js";

import reactions from "./reactions.js";

let client: Client = new Client();
let count: number = 0;

async function setCount() {
  count += 1;

  try {
    let countString = String(count);
    let countFile = await writeFile("count.txt", countString + "\n");

    return countFile
  } catch (error) {
    console.log("Unable to update command invocation count", error);
  }
}

try {
  let countFile: Buffer = await readFile("count.txt");
  let countNumber: number = Number(countFile.toString());

  count = countNumber;
} catch (error) {
  console.log("Unable to load initial command invocation count", error);
}

client.on("message", (message: Message) => {
  if (message.content.match(/unzip/i) !== null) {
    setCount();

    let randomImage: string =
      reactions[Math.floor(Math.random() * reactions.length)];

    let response: MessageEmbed = new MessageEmbed()
      .setImage(randomImage)
      .setFooter(`${count}`);

    message.reply(response);
  }
});

client.login(process.env.TOKEN);
