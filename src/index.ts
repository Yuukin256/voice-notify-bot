import { PrismaClient } from '@prisma/client';
import { Client, Intents } from 'discord.js';

import CommandHandler from './commandHandler';
import { voiceEnd, voiceStart } from './voiceNotify';

const prisma = new PrismaClient();

const client = new Client({
  intents: Intents.FLAGS.GUILDS | Intents.FLAGS.GUILD_MESSAGES | Intents.FLAGS.GUILD_VOICE_STATES,
});

const commandHandler = new CommandHandler(prisma);

client.once('ready', () => {
  console.log('ready!');
});

// サーバー参加時
client.on('guildCreate', (guild) => {
  // サーバーの設定を DB に作成
  prisma.guild.upsert({
    where: { guildId: guild.id },
    create: { guildId: guild.id },
    update: {},
  });

  // Discord サーバーにコマンドを登録
  commandHandler.setCommandsToGuild(guild);
});

client.on('interactionCreate', async (interaction) => {
  if (interaction.isCommand()) commandHandler.execCommand(interaction);
});

client.on('voiceStateUpdate', async (oldState, newState) => {
  // 通話開始
  if (
    newState.channel &&
    newState.channelId &&
    newState.member &&
    oldState.channelId !== newState.channelId && // 変化前と変化後のチャンネルが異なる
    newState.channelId !== newState.guild.afkChannelId && // AFK 隔離部屋でない
    newState.channel?.members.size === 1 // 変化後のチャンネルにいるメンバーが1人
  ) {
    voiceStart(newState.channel, prisma);
  }

  // 通話終了
  if (
    oldState.channelId &&
    oldState.channel &&
    oldState.channelId !== newState.channelId && // 変化前と変化後のチャンネルが異なる
    oldState.channel?.members.size === 0 // 変化前のチャンネルにいるメンバーが0人
  ) {
    voiceEnd(oldState.channel, prisma);
  }
});

client
  .login()
  .catch((e) => {
    console.error(e);
  })
  .finally(() => {
    prisma.$disconnect();
  });
