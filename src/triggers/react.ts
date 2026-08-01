import { Guild, Message, TextChannel } from "discord.js";

import { RESPONSE_COLOR } from "../constants.js";

import prisma from "../prisma.js";
import log from "../logger.js";

// Reply with a random reaction image when a message matches the react criteria
export default async function react(message: Message) {
  let { author } = message;
  let { username, displayName } = author;

  let channel = message.channel as TextChannel;
  let guild = channel.guild as Guild;

  // Get a random image from the database
  let randomImage = await prisma.image.findRandom({
    select: {
      id: true,
      category: true,
      stem: true,
    },
    // Limit results to the default category
    where: {
      category: {
        id: 1,
      },
    },
  });

  // @ts-ignore
  // Not sure why this is complaining...
  let { id, category, stem } = randomImage;

  log.info(randomImage, "Random reaction image retrieved");

  let createInvocation = await prisma.invocation.create({
    data: {
      user: {
        connectOrCreate: {
          create: {
            snowflakeId: author.id,
            username,
            displayName,
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
      reactionImage: { connect: { id } },
    },
  });

  // @TODO: This will need to be changed if command invocations are used for more than just reactions
  let invocationCount = createInvocation.id;

  // Construct the url used in embed
  let stemOrId = stem === null ? id : stem;
  let url = `https://images.lamepunch.com/reactions/${category.name.toLowerCase()}/${stemOrId}.webp`;

  log.debug({ url }, "Embed image URL");

  await message.reply({
    embeds: [
      {
        image: { url },
        footer: { text: "#" + invocationCount },
        color: RESPONSE_COLOR,
      },
    ],
  });
}
