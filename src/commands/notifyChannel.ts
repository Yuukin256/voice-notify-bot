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
    const handlePrismaError = (err: Error) => {
      command.reply({ content: '内部エラーが発生しました。' });
      throw err;
    };

    const consoleError = (err: Error) => {
      console.error(err);
    };

    const subCommand = command.options.getSubcommand(true);

    // 通知するチャンネルを確認するとき
    if (subCommand === 'show') {
      // データベースに通知するチャンネルが記録されていなかったとき
      if (!dbGuild.notifyChannelId) {
        return command.reply({
          content:
            '通話開始時に通知メッセージを送信するテキストチャンネルは設定されていません。`/channel set` コマンドで設定可能です。',
        });
      }

      // Discord 上の Channel を取得
      const currentChannel = await command.guild?.channels.fetch(dbGuild.notifyChannelId ?? '');

      // 通知するチャンネルがデータベースにはあるが、Discord 上には存在しないとき
      if (!currentChannel) {
        prisma.guild
          .update({ where: { id: dbGuild.id }, data: { notifyChannelId: null } })
          .catch(handlePrismaError)
          .then(() => {
            return command.reply({
              content:
                '通話開始時に通知メッセージを送信するテキストチャンネルは設定されていません。`/channel set` コマンドで設定可能です。',
            });
          })
          .catch(consoleError);

        return;
      }

      // 通知するチャンネルが存在するとき
      return command.reply({
        content: `通話開始時に通知メッセージを送信するテキストチャンネルは ${currentChannel} です。`,
      });
    }

    if (subCommand === 'set') {
      const inputChannel = command.options.getChannel('channel', false);

      // 通知するチャンネルの設定を削除するとき
      if (!inputChannel) {
        prisma.guild
          .update({ where: { id: dbGuild.id }, data: { notifyChannelId: null } })
          .catch(handlePrismaError)
          .then(() => {
            return command.reply(`通話開始時に通知メッセージを送信するテキストチャンネルの設定を削除しました。`);
          })
          .catch(consoleError);

        return;
      }

      // テキストチャンネルまたはニュースチャンネル以外が指定された場合
      if (inputChannel.type !== 'GUILD_TEXT' && inputChannel.type !== 'GUILD_NEWS') {
        return command.reply({
          content: `${inputChannel} に通知を行うことはできません。テキストチャンネルまたはニュースチャンネルを指定してください。`,
        });
      }

      // 通知するチャンネルを設定するとき
      prisma.guild
        .update({ where: { id: dbGuild.id }, data: { notifyChannelId: inputChannel.id } })
        .catch(handlePrismaError)
        .then(() => {
          return command.reply(
            `通話開始時に通知メッセージを送信するテキストチャンネルを ${inputChannel} に設定しました。`
          );
        })
        .catch(consoleError);
    }
  },
};

export default notifyChannelCommand;
