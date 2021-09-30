import { ContextMenuInteraction, TextChannel } from "discord.js";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";

import { Command } from "../types";
import prisma from "../prisma";

const HighlightCommand: Command<ContextMenuInteraction> = {
  data: {
    name: "Highlight",
    description: "Add a quote to the database",
    type: 3,
    default_permission: false,
  },

  async execute(response) {
    let { guildId, targetId } = response;
    let channel = response.channel as TextChannel;

    if (!guildId || !targetId || !channel) {
      throw new Error("Message cannot be retrieved");
    }

    let { author, createdAt, content } = await channel.messages.fetch(targetId);
    let isSubmittable: boolean =
      author.bot === false && channel.type === "GUILD_TEXT";

    if (isSubmittable) {
      try {
        let newQuote = await prisma.quote.create({
          data: {
            messageId: targetId,
            createdAt,
            user: {
              connectOrCreate: {
                create: {
                  id: author.id,
                  name: author.username,
                },
                where: {
                  id: author.id,
                },
              },
            },
            guild: {
              connect: { id: guildId },
            },
            channel: {
              connectOrCreate: {
                create: {
                  id: channel.id,
                  name: channel.name,
                  guild: { connect: { id: guildId } },
                },
                where: {
                  id: channel.id,
                },
              },
            },
            submitter: {
              connectOrCreate: {
                create: {
                  id: response.user.id,
                  name: response.user.username,
                },
                where: {
                  id: response.user.id,
                },
              },
            },
            content,
          },
        });

        await response.reply({
          content: `Quote #${newQuote.id} was successfully added!`,
          ephemeral: true,
        });
      } catch (error) {
        // Log the error in development
        if (process.env.NODE_ENV === "development") {
          console.error(error);
        }

        let errorMessage: string = "The quote was unable to be submitted";
        let errorReason: string =
          "due to an unknown error. Please try again later.";

        // Check to see if this is a Prisma error
        if (error instanceof PrismaClientKnownRequestError) {
          // Unique constraint failed, quote already exists
          if (error.code === "P2002") {
            errorReason = "as it already exists in the database.";
          }
        }

        await response.reply({
          content: `${errorMessage}, ${errorReason}`,
          ephemeral: true,
        });
      }
    } else {
      await response.reply({
        content: "This quote is not eligible to be submitted",
        ephemeral: true,
      });
    }
  },
};

export default HighlightCommand;
