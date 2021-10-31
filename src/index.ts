import { PrismaClient } from '@prisma/client';
import { Client, Intents } from 'discord.js';

import CommandHandler from './commandHandler';

const prisma = new PrismaClient();

const client = new Client({
  intents: Intents.FLAGS.GUILDS | Intents.FLAGS.GUILD_MESSAGES,
});

const commandHandler = new CommandHandler(prisma);

client.once('ready', () => {
  console.log('ready!');
});

client.on('guildCreate', (guild) => {
  prisma.guild.upsert({
    where: { guildId: guild.id },
    create: { guildId: guild.id },
    update: {},
  });

  commandHandler.setCommandsToGuild(guild);
});

client.on('interactionCreate', async (interaction) => {
  if (interaction.isCommand()) commandHandler.execCommand(interaction);
});

client
  .login()
  .catch((e) => {
    console.error(e);
  })
  .finally(() => {
    prisma.$disconnect();
  });
