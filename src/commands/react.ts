import { Guild, Message, MessageOptions, TextChannel } from "discord.js";

import { REACTIONS, RESPONSE_COLOR } from "../constants";
import prisma from "../prisma";

export default {
  data: {
    name: "react",
    description: "React to a message with a random image.",
  },

  async execute(message: Message) {
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
        guild: {
          connect: { id: guild.id },
        },
        channel: {
          connectOrCreate: {
            create: {
              id: channel.id,
              name: channel.name,
              guild: { connect: { id: guild.id } },
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
        REACTIONS[Math.floor(Math.random() * REACTIONS.length)];

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
  },
};
