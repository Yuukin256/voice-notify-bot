import { Channel, Guild, PrismaClient } from '@prisma/client';
import dayjs from 'dayjs';
import { MessageEmbed, NewsChannel, TextChannel, ThreadChannel, VoiceBasedChannel } from 'discord.js';
import { nonNullable } from './util';

type PrepareReturn = Promise<{
  notifyChannel: TextChannel | NewsChannel | ThreadChannel;
  voiceChannelOnPrisma: Channel & {
    guild: Guild;
  };
} | void>;

// DB 情報と必要なチャンネルを準備する
const prepare = async (voiceChannel: VoiceBasedChannel, prisma: PrismaClient): PrepareReturn => {
  // DB上のチャンネルのデータ
  const voiceChannelOnPrisma = await prisma.channel.findUnique({
    where: { channelId: voiceChannel.id },
    include: { guild: true },
  });

  // DBに設定が存在するか
  if (voiceChannelOnPrisma && voiceChannelOnPrisma.guild.notifyChannelId) {
    const notifyChannel = voiceChannel.guild.channels.resolve(voiceChannelOnPrisma.guild.notifyChannelId);

    // お知らせチャンネルが存在し、テキストチャンネルであるか
    if (notifyChannel?.isText()) {
      return { notifyChannel, voiceChannelOnPrisma };
    }
  }
};

export const voiceStart = async (voiceChannel: VoiceBasedChannel, prisma: PrismaClient) => {
  const prepared = await prepare(voiceChannel, prisma);

  // データがない場合は即時 return
  if (!prepared) {
    return;
  }

  const { voiceChannelOnPrisma, notifyChannel } = prepared;

  const roleMentions = voiceChannelOnPrisma.mentionRoles.map((roleId) => voiceChannel.guild.roles.resolve(roleId));
  const userMentions = voiceChannelOnPrisma.mentionUsers.map((userId) => voiceChannel.guild.members.resolve(userId));
  const mentions = [...roleMentions, ...userMentions].filter(nonNullable);
  const member = voiceChannel.members.first();
  const clientUser = voiceChannel.client.user;

  const content = `${mentions.join(' ')} ${member?.displayName}が${voiceChannel}で通話を開始しました！`;
  const embed = new MessageEmbed()
    .setTitle(`${voiceChannel.name}で通話中です`)
    .setAuthor({ name: `${member?.displayName} (${member?.user.tag})`, iconURL: member?.user.displayAvatarURL() })
    .setColor('GREEN')
    .addField('通話開始', dayjs().format('YYYY/MM/DD HH:mm:ss'))
    .setFooter({
      text: `${voiceChannel.guild.me?.displayName} (${clientUser?.tag})`,
      iconURL: clientUser?.displayAvatarURL(),
    })
    .setTimestamp();

  const sentMessage = await notifyChannel.send({ content, embeds: [embed] });

  await prisma.channel.update({
    where: { id: voiceChannelOnPrisma.id },
    data: { notifyMessageId: sentMessage.id },
  });
};

export const voiceEnd = async (voiceChannel: VoiceBasedChannel, prisma: PrismaClient) => {
  const prepared = await prepare(voiceChannel, prisma);

  // データがない場合は即時 return
  if (!prepared) {
    return;
  }

  const { voiceChannelOnPrisma, notifyChannel } = prepared;

  // データがない場合は即時 return
  if (!voiceChannelOnPrisma.notifyMessageId) {
    return;
  }

  const notifyMessage = notifyChannel.messages.resolve(voiceChannelOnPrisma.notifyMessageId);

  // お知らせメッセージが存在するか
  if (notifyMessage && notifyMessage.embeds[0]) {
    const embed = notifyMessage.embeds[0]
      .setTitle('')
      .addField('通話終了', dayjs().format('YYYY/MM/DD HH:mm:ss'))
      .setColor('DARK_GREY')
      .setTimestamp();

    notifyMessage.edit({ content: `${voiceChannel}の通話は終了しました！`, embeds: [embed] });
  }

  await prisma.channel.update({
    where: { id: voiceChannelOnPrisma.id },
    data: { notifyMessageId: null },
  });
};
