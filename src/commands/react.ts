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

  async execute(interaction) {
    let { author } = interaction;
    let channel = interaction.channel as TextChannel;
    let guild = channel.guild as Guild;

    let createInvocation = await prisma.invocation.create({
      data: {
        user: {
          connectOrCreate: {
            create: {
              name: author.username,
              snowflakeId: author.id,
            },
            where: {
              snowflakeId: author.id,
            },
          },
        },
        guild: {
          connect: { snowflakeId: guild.id },
        },
        channel: {
          connectOrCreate: {
            create: {
              snowflakeId: channel.id,
              name: channel.name,
              guild: { connect: { snowflakeId: guild.id } },
            },
            where: {
              snowflakeId: channel.id,
            },
          },
        },
      },
    });

    let invocationCount = createInvocation.id;

    if (createInvocation) {
      let randomImage: string = REACTIONS[random.int(0, REACTIONS.length - 1)];

      interaction.reply({
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
