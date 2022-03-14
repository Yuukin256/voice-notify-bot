import { PrismaClient } from '@prisma/client';
import dayjs from 'dayjs';
import { MessageEmbed, VoiceBasedChannel } from 'discord.js';
import { nonNullable } from './util';

// 通話開始時処理
export const voiceStart = async (voiceChannel: VoiceBasedChannel, prisma: PrismaClient) => {
  // DB上のチャンネルとサーバーのデータ
  const voiceChannelOnPrisma = await prisma.channel.findUnique({
    where: { channelId: voiceChannel.id },
    include: { guild: true },
  });

  // DBに設定が存在するか
  if (voiceChannelOnPrisma?.guild.notifyChannelId) {
    const notifyChannel = voiceChannel.guild.channels.resolve(voiceChannelOnPrisma.guild.notifyChannelId);

    // お知らせチャンネルが存在するテキストチャンネルであるか
    if (notifyChannel?.isText()) {
      const roleMentions = voiceChannelOnPrisma.mentionRoles.map((roleId) => voiceChannel.guild.roles.resolve(roleId));
      const userMentions = voiceChannelOnPrisma.mentionUsers.map((userId) =>
        voiceChannel.guild.members.resolve(userId)
      );
      const mentions = [...roleMentions, ...userMentions].filter(nonNullable);
      const member = voiceChannel.members.first();
      const clientUser = voiceChannel.client.user;

      // 送信する内容
      const content = `${mentions.join(' ')} ${member?.displayName}が${voiceChannel.name}で通話を開始しました！`;
      const embed = new MessageEmbed()
        .setTitle(`${voiceChannel.name}で通話中です`)
        .setAuthor({
          name: `${member?.displayName ?? '????'} (${member?.user.tag} ?? '#????)`,
          iconURL: member?.user.displayAvatarURL(),
        })
        .setColor('GREEN')
        .addField('通話開始', dayjs().format('YYYY/MM/DD HH:mm:ss'))
        .setFooter({
          text: `${voiceChannel.guild.me?.displayName ?? '????'} (${clientUser?.tag} ?? '#????)`,
          iconURL: clientUser?.displayAvatarURL(),
        })
        .setTimestamp();

      const sentMessage = await notifyChannel.send({ content, embeds: [embed] });

      // チャンネルへのリンクに変更する
      sentMessage.edit({
        content: `${mentions.join(' ')} ${member?.displayName}が${voiceChannel}で通話を開始しました！`,
      });

      // DB に反映
      await prisma.channel.update({
        where: { id: voiceChannelOnPrisma.id },
        data: { notifyMessageId: sentMessage.id },
      });
    }
  }
};

// 通話終了時処理
export const voiceEnd = async (voiceChannel: VoiceBasedChannel, prisma: PrismaClient) => {
  // DB上のチャンネルとサーバーのデータ
  const voiceChannelOnPrisma = await prisma.channel.findUnique({
    where: { channelId: voiceChannel.id },
    include: { guild: true },
  });

  // DBに設定が存在するか
  if (voiceChannelOnPrisma?.guild?.notifyChannelId && voiceChannelOnPrisma.notifyMessageId) {
    const notifyChannel = voiceChannel.guild.channels.resolve(voiceChannelOnPrisma.guild.notifyChannelId);

    // お知らせチャンネルが存在するテキストチャンネルであるか
    if (notifyChannel?.isText()) {
      const notifyMessage = notifyChannel.messages.resolve(voiceChannelOnPrisma.notifyMessageId);

      // お知らせメッセージが存在するか
      if (notifyMessage?.embeds[0]) {
        // 編集するメッセージの内容
        const content = `${voiceChannel}の通話は終了しました！`;
        const embed = notifyMessage.embeds[0]
          .setTitle('')
          .addField('通話終了', dayjs().format('YYYY/MM/DD HH:mm:ss'))
          .setColor('DARK_GREY')
          .setTimestamp();

        // 通話終了時の内容に編集
        notifyMessage.edit({ content, embeds: [embed] });
      }
    }

    // DB に反映
    await prisma.channel.update({
      where: { id: voiceChannelOnPrisma.id },
      data: { notifyMessageId: null },
    });
  }
};
