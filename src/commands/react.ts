import random from "random";
import { Guild, Message, TextChannel } from "discord.js";

import { Command } from "../types";
import { REACTIONS, RESPONSE_COLOR } from "../constants";
import prisma from "../prisma";

const ReactCommand: Command<Message> = {
  data: {
    name: "react",
    description: "React to a message with a random image.",
  },

  async execute(response) {
    let channel = response.channel as TextChannel;
    let guild = channel.guild as Guild;

    let createInvocation = await prisma.invocation.create({
      data: {
        user: {
          connectOrCreate: {
            create: {
              name: response.author.username,
              id: response.author.id,
            },
            where: {
              id: response.author.id,
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
      let randomImage: string = REACTIONS[random.int(0, REACTIONS.length - 1)];

      response.reply({
        embeds: [
          {
            image: { url: randomImage },
            footer: { text: "#" + invocationCount },
            color: RESPONSE_COLOR,
          },
        ],
      });
    }
  },
};

export default ReactCommand;
