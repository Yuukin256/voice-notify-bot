import { Command } from './command';

const pingCommand: Command = {
  data: {
    name: 'clear',
    description: 'ボイスチャンネルで通話が始まった際の通知設定を削除します。',
    options: [
      {
        type: 'CHANNEL',
        name: 'channel',
        description: 'このボイスチャンネルで通話が始まった際の通知設定を削除します。',
        required: true,
      },
    ],
  },
  exec: (command, dbGuild, prisma) => {
    const channelData = command.options.getChannel('channel', true);
    const channel = command.guild.channels.resolve(channelData.id);

    if (!channel?.isVoice()) {
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

export default pingCommand;
