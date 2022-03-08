import { PrismaClient } from '@prisma/client';
import dayjs from 'dayjs';
import { MessageEmbed, VoiceBasedChannel } from 'discord.js';
import { nonNullable } from './util';

export const voiceStart = async (voiceChannel: VoiceBasedChannel, prisma: PrismaClient) => {
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
      const roleMentions = voiceChannelOnPrisma.mentionRoles.map((roleId) => voiceChannel.guild.roles.resolve(roleId));
      const userMentions = voiceChannelOnPrisma.mentionUsers.map((userId) =>
        voiceChannel.guild.members.resolve(userId)
      );
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
    }
  }
};

export const voiceEnd = async (voiceChannel: VoiceBasedChannel, prisma: PrismaClient) => {
  // DB上のチャンネルのデータ
  const voiceChannelOnPrisma = await prisma.channel.findUnique({
    where: { channelId: voiceChannel.id },
    include: { guild: true },
  });

  // DBに設定が存在するか
  if (voiceChannelOnPrisma && voiceChannelOnPrisma.guild.notifyChannelId && voiceChannelOnPrisma.notifyMessageId) {
    const notifyChannel = voiceChannel.guild.channels.resolve(voiceChannelOnPrisma.guild.notifyChannelId);

    // お知らせチャンネルが存在するか
    if (notifyChannel?.isText()) {
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
    }

    await prisma.channel.update({
      where: { id: voiceChannelOnPrisma.id },
      data: { notifyMessageId: null },
    });
  }
};
