import { Client, Message, MessageEmbed } from "discord.js";
import reactions from "./reactions.js";

let client: Client = new Client();
let count: number = 0;

client.on("message", (message: Message) => {
  if (message.content.match(/unzip/i) !== null) {
    count += 1;

    let randomImage: string =
      reactions[Math.floor(Math.random() * reactions.length)];

    let response: MessageEmbed = new MessageEmbed()
      .setImage(randomImage)
      .setFooter(`${count}`);

    message.reply(response);
  }
});

client.login(process.env.TOKEN);
