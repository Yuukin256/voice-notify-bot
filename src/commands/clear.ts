import { ApplicationCommandOptionType, ChannelType } from 'discord.js';
import { Command } from './command';

const clearCommand: Command = {
  data: {
    name: 'clear',
    description: 'ボイスチャンネルで通話が始まった際の通知設定を削除します。',
    options: [
      {
        type: ApplicationCommandOptionType.Channel,
        name: 'channel',
        description: 'このボイスチャンネルで通話が始まった際の通知設定を削除します。',
        required: true,
      },
    ],
  },
  exec: (command, dbGuild, prisma) => {
    const channelData = command.options.get('channel', true);

    if (!channelData.channel?.id) {
      throw new Error('チャンネルIDが取得できませんでした');
    }

    const channel = command.guild.channels.resolve(channelData.channel?.id);

    if (channel?.type !== ChannelType.GuildVoice) {
      return command.reply({
        content: `${channel} はボイスチャンネルではありません。\`channel\` パラメータにはボイスチャンネルを指定してください。`,
      });
    }

    const channelOnPrisma = dbGuild.channels.find((ch) => ch.channelId === channel.id);

    if (!channelOnPrisma) {
      return command.reply({
        content: `${channel} の通知設定はありません。\`channel\` パラメータには、通知設定を行っているボイスチャンネルを指定してください。\`set\` コマンドで通知設定を登録できます。`,
      });
    }

    return prisma.channel
      .delete({ where: { id: channelOnPrisma.id } })
      .catch((err) => {
        command.reply({ content: '内部エラーが発生しました。' });
        throw err;
      })
      .then(() => {
        return command.reply({ content: `${channel} の通知設定を削除しました。` });
      })
      .catch((err) => {
        console.error(err);
      });
  },
};

export default clearCommand;
