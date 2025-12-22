import { Guild, Message, TextChannel } from "discord.js";

import { Command } from "../types.js";
import { RESPONSE_COLOR } from "../constants.js";
import prisma from "../prisma.js";

const ReactCommand: Command<Message> = {
  data: {
    name: "react",
    description: "React to a message with a random image.",
  },

  async execute(interaction) {
    let { author } = interaction;
    let channel = interaction.channel as TextChannel;
    let guild = channel.guild as Guild;

    // Get a random image from the database
    let randomImage = await prisma.image.findRandom({
      select: {
        id: true,
        url: true,
      },
    });

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
        // @TODO: Change this or move createInvocation to index.ts that
        // happens on every messageCreate/interactionCreate event
        command: { connect: { name: "react" } },
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
        reactionImage: { connect: { id: randomImage!.id } },
      },
    });

    // @TODO: This will need to be changed if command invocations are used for more than just reactions
    let invocationCount = createInvocation.id;

    interaction.reply({
      embeds: [
        {
          image: { url: randomImage!.url },
          footer: { text: "#" + invocationCount },
          color: RESPONSE_COLOR,
        },
      ],
    });
  },
};

export default ReactCommand;
