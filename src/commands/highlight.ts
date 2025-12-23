import {
  ChannelType,
  MessageContextMenuCommandInteraction,
  TextChannel,
  MessageFlags,
} from "discord.js";

import { Command } from "../types.js";
import prisma from "../prisma.js";

const HighlightCommand: Command<MessageContextMenuCommandInteraction> = {
  data: {
    name: "Highlight",
    description: "Add a quote to the database",
    type: 3,
    default_permission: false,
  },

  async execute(interaction) {
    let { guildId, targetId, user } = interaction;
    let channel = interaction.channel as TextChannel;

    // Helper function to reply to the user with an ephemeral message
    let reply = async (content: string) =>
      await interaction.reply({ content, flags: MessageFlags.Ephemeral });

    // TODO: Add multiple error exceptions for each failure
    if (!guildId || !targetId || !channel) {
      throw new Error("Message cannot be retrieved");
    }

    // Retreive the message that was highlighted
    let { author, createdAt, content } = await channel.messages.fetch(targetId);

    // Only allow submissions from text channels and non-bot users
    let isSubmittable: boolean =
      author.bot === false && channel.type === ChannelType.GuildText;

    if (isSubmittable) {
      try {
        // Check to see if an existing quote already exists
        let existingQuote = await prisma.quote.count({
          where: { messageId: targetId },
        });

        if (existingQuote) {
          throw new Error("Quote already exists");
        }

        let newQuote = await prisma.quote.create({
          data: {
            messageId: targetId,
            createdAt,
            user: {
              connectOrCreate: {
                create: {
                  snowflakeId: author.id,
                  username: author.username,
                  displayName: author.displayName,
                },
                where: {
                  snowflakeId: author.id,
                },
              },
            },
            guild: {
              connect: { snowflakeId: guildId },
            },
            channel: {
              connectOrCreate: {
                create: {
                  snowflakeId: channel.id,
                  name: channel.name,
                  guild: { connect: { snowflakeId: guildId } },
                },
                where: {
                  snowflakeId: channel.id,
                },
              },
            },
            submitter: {
              connectOrCreate: {
                create: {
                  snowflakeId: user.id,
                  username: user.username,
                  displayName: user.displayName,
                },
                where: {
                  snowflakeId: user.id,
                },
              },
            },
            content,
          },
        });

        // Add a reaction to notify that this message has been highlighted
        await channel.messages.react(targetId, "⭐");

        // Send a confirmation message to the user
        await reply(`Quote #${newQuote.id} was successfully added!`);
      } catch (error) {
        // Log the error in development
        if (process.env.NODE_ENV === "development") {
          console.error(error);
        }

        let existingQuoteError: boolean =
          error instanceof Error && error.message === "Quote already exists";

        let errorMessage: string = "The quote was unable to be submitted";
        let errorReason: string =
          "due to an unknown error. Please try again later.";

        if (existingQuoteError) {
          errorReason = "as it already exists in the database.";
        }

        await reply(`${errorMessage} ${errorReason}`);
      }
    } else {
      await reply("This quote is not eligible to be submitted.");
    }
  },
};

export default HighlightCommand;
