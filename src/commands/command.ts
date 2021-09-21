import { ApplicationCommandData, CommandInteraction } from 'discord.js';
import { Channel, Guild, PrismaClient } from '.prisma/client';

export interface Command {
  data: ApplicationCommandData;
  exec: (command: CommandInteraction, dbGuild: Guild & { channels: Channel[] }, prisma: PrismaClient) => unknown;
}
