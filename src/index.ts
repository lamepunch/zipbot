import { Client, Message, MessageAttachment, MessageEmbed } from "discord.js";
import reactions from "./reactions.js";

let client: Client = new Client();
let count: number = 0;

client.on("message", (msg: Message) => {
  if (msg.content.includes("unzip") || msg.content.includes("UNZIP")) {
    count += 1;

    let randomImage: string =
      reactions[Math.floor(Math.random() * reactions.length)];

    let response: MessageEmbed = new MessageEmbed()
      .setImage(randomImage)
      .setFooter(`${count}`);

    msg.reply(response);
  }
});

client.login(process.env.TOKEN);
