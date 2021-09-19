import { Command } from './command';

const notifyChannelCommand: Command = {
  data: {
    name: 'notifychannel',
    description: '通話開始時に通知メッセージを送信するテキストチャンネルを確認/設定します。',
    options: [
      {
        type: 'SUB_COMMAND',
        name: 'show',
        description: '通話開始時に通知メッセージを送信するテキストチャンネルを返します。',
      },
      {
        type: 'SUB_COMMAND',
        name: 'set',
        description: '通話開始時に通知メッセージを送信するテキストチャンネルを設定します。',
        options: [
          {
            type: 'CHANNEL',
            name: 'channel',
            description:
              '通話開始時に通知メッセージを送信するテキストチャンネル。入力しなかった場合は現在の設定を削除します。',
            required: false,
          },
        ],
      },
    ],
  },
  exec: async (command, dbGuild, prisma) => {
    const subCommand = command.options.getSubcommand();

    // 通知するチャンネルを確認するとき
    if (subCommand === 'show') {
      // データベースに通知するチャンネルが記録されていなかったとき
      if (!dbGuild.notifyChannelId) {
        command.reply({
          content:
            '通話開始時に通知メッセージを送信するテキストチャンネルは設定されていません。`/channel set` コマンドで設定可能です。',
        });
        return;
      }

      // Discord 上の Channel を取得
      const currentChannel = await command.guild?.channels.fetch(dbGuild.notifyChannelId ?? '');

      // 通知するチャンネルがデータベースにはあるが、Discord 上には存在しないとき
      if (!currentChannel) {
        await prisma.guild.update({ where: { id: dbGuild.id }, data: { notifyChannelId: null } });
        command.reply({
          content:
            '通話開始時に通知メッセージを送信するテキストチャンネルは設定されていません。`/channel set` コマンドで設定可能です。',
        });
        return;
      }

      // 通知するチャンネルが存在するとき
      command.reply({ content: `通話開始時に通知メッセージを送信するテキストチャンネルは ${currentChannel} です。` });
      return;
    }

    if (subCommand === 'set') {
      const inputChannel = command.options.getChannel('channel', false);

      // 通知するチャンネルの設定を削除するとき
      if (!inputChannel) {
        await prisma.guild.update({ where: { id: dbGuild.id }, data: { notifyChannelId: null } });
        command.reply(`通話開始時に通知メッセージを送信するテキストチャンネルの設定を削除しました。`);
        return;
      }

      // テキストチャンネルまたはニュースチャンネル以外が指定された場合
      if (inputChannel.type !== 'GUILD_TEXT' && inputChannel.type !== 'GUILD_NEWS') {
        command.reply({
          content: `${inputChannel} に通知を行うことはできません。テキストチャンネルまたはニュースチャンネルを指定してください。`,
        });
        return;
      }

      // 通知するチャンネルを設定するとき
      await prisma.guild.update({ where: { id: dbGuild.id }, data: { notifyChannelId: inputChannel.id } });
      command.reply(`通話開始時に通知メッセージを送信するテキストチャンネルを ${inputChannel} に設定しました。`);
      return;
    }
  },
};

export default notifyChannelCommand;
