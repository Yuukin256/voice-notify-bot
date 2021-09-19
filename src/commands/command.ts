import { Guild, PrismaClient } from '.prisma/client';
import { ApplicationCommandData, CommandInteraction } from 'discord.js';

export interface Command {
  data: ApplicationCommandData;
  exec: (command: CommandInteraction, dbGuild: Guild, prisma: PrismaClient) => unknown;
}
