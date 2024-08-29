import { Channel, Guild, PrismaClient } from '.prisma/client';
import { ApplicationCommandData, ChatInputCommandInteraction } from 'discord.js';

export type CommandInteractionWithGuild = ChatInputCommandInteraction & { guild: Guild; guildId: string };

export interface Command {
  data: ApplicationCommandData;
  exec: (
    command: CommandInteractionWithGuild,
    dbGuild: Guild & { channels: Channel[] },
    prisma: PrismaClient,
  ) => unknown;
}
