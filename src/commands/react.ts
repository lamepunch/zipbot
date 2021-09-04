import { Guild, Message, MessageOptions, TextChannel } from "discord.js";

import { RESPONSE_COLOR } from "../constants";
import reactions from "../reactions";
import prisma from "../prisma";

export default async function ReactCommand(message: Message) {
  let channel = message.channel as TextChannel;
  let guild = channel.guild as Guild;

  let createInvocation = await prisma.invocation.create({
    data: {
      user: {
        connectOrCreate: {
          create: {
            name: message.author.username,
            id: message.author.id,
          },
          where: {
            id: message.author.id,
          },
        },
      },
      server: {
        connect: { id: guild.id },
      },
      channel: {
        connectOrCreate: {
          create: {
            id: channel.id,
            name: channel.name,
            server: { connect: { id: guild.id } },
          },
          where: {
            id: channel.id,
          },
        },
      },
    },
  });

  let invocationCount = createInvocation.id;

  if (createInvocation) {
    let randomImage: string =
      reactions[Math.floor(Math.random() * reactions.length)];

    let response: MessageOptions = {
      embeds: [
        {
          image: { url: randomImage },
          footer: { text: "#" + invocationCount },
          color: RESPONSE_COLOR,
        },
      ],
    };

    message.reply(response);
  }
}
