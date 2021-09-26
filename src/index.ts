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

client.on('messageCreate', (message) => {
  if (!message.guild || !message.guildId) return;

  prisma.guild.upsert({
    where: { guildId: message.guildId },
    create: { guildId: message.guildId },
    update: {},
  });

  if (message.author.bot || !client.user) return;

  if (message.mentions.has(client.user) && message.content.includes('init')) {
    commandHandler
      .setCommandsToGuild(message.guild)
      .catch(() => {
        message.reply({ content: 'エラーが発生しました。再度お試しください。' });
      })
      .then(() => {
        message.reply({ content: 'このサーバーにコマンドを登録しました。' });
      });
  }
});

client.on('interactionCreate', async (interaction) => {
  if (interaction.isCommand()) commandHandler.execCommand(interaction);
});

client
  .login(process.env.DISCORD_TOKEN ?? '')
  .catch((e) => {
    console.error(e);
  })
  .finally(() => {
    prisma.$disconnect();
  });
