import {
  ApplicationCommandOptionData,
  ApplicationCommandOptionType,
  ChannelType,
  Colors,
  CommandInteractionResolvedData,
  EmbedBuilder,
  Guild,
  Role,
} from 'discord.js';

import { makeMentionSettingEmbedFieldData, nonNullable } from '../util';

import { Command } from './command';

const mentionOptions = [...Array(24)].map<ApplicationCommandOptionData>((_, i) => ({
  type: ApplicationCommandOptionType.Mentionable,
  name: `mention${i + 1}`,
  description: 'ボイスチャンネルで通話が始まった際にメンションするロール/ユーザー',
  required: false,
}));

const resolveRoles = (roles: CommandInteractionResolvedData['roles'], guild: Guild): Role[] => {
  return roles?.map((v) => guild.roles.resolve(v?.id ?? '')).filter(nonNullable) ?? [];
};

const setCommand: Command = {
  data: {
    name: 'set',
    description: 'ボイスチャンネルで通話が始まった際にメンションするロール/ユーザーを設定します。',
    options: [
      {
        type: ApplicationCommandOptionType.Channel,
        name: 'channel',
        description: 'このボイスチャンネルで通話が始まった際に通知を行います。',
        required: true,
      },
      ...mentionOptions,
    ],
  },
  exec: (command, dbGuild, prisma) => {
    const channelData = command.options.get('channel', true);
    if (!channelData.channel?.id) {
      throw new Error('チャンネルIDが取得できませんでした');
    }

    const channel = command.guild.channels.resolve(channelData.channel.id);

    if (channel?.type !== ChannelType.GuildVoice) {
      return command.reply({
        content: `${channel} はボイスチャンネルではありません。\`channel\` パラメータにはボイスチャンネルを指定してください。`,
      });
    }

    const roles = resolveRoles(command.options.resolved?.roles, command.guild);
    const users = [...(command.options.resolved?.users?.values() ?? [])];

    return prisma.channel
      .upsert({
        where: { channelId: channel.id },
        create: {
          channelId: channel.id,
          guild: { connect: { id: dbGuild.id } },
          mentionRoles: roles.map((r) => r.id),
          mentionUsers: users.map((u) => u.id),
        },
        update: {
          mentionRoles: roles.map((r) => r.id),
          mentionUsers: users.map((u) => u.id),
        },
      })

      .catch((err) => {
        command.reply({ content: '内部エラーが発生しました。' });
        throw err;
      })

      .then(() => {
        const embed = makeMentionSettingEmbedFieldData(channel, roles, users);

        return command.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle('通知設定を登録しました。')
              .addFields(embed)
              .setTimestamp()
              .setColor(Colors.Green),
          ],
        });
      })

      .catch((err) => {
        console.error(err);
      });
  },
};

export default setCommand;
