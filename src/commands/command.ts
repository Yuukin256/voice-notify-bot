import { ApplicationCommandData, CommandInteraction } from 'discord.js';

import { Channel, Guild, PrismaClient } from '.prisma/client';

export type CommandInteractionWithGuild = CommandInteraction & { guild: Guild; guildId: string };

export interface Command {
  data: ApplicationCommandData;
  exec: (
    command: CommandInteractionWithGuild,
    dbGuild: Guild & { channels: Channel[] },
    prisma: PrismaClient
  ) => unknown;
}
