// import {
//   ApplicationCommandOptionType,
//   SlashCommandBuilder,
//   SlashCommandChannelOption,
//   SlashCommandSubcommandBuilder,
// } from 'discord.js';
import { ApplicationCommandOptionType, ChannelType } from 'discord.js';
import { Command } from './command';

const notifyChannelCommand: Command = {
  data: {
    name: 'notifychannel',
    description: '通話開始時に通知メッセージを送信するテキストチャンネルを確認/設定します。',
    options: [
      {
        type: ApplicationCommandOptionType.Subcommand,
        name: 'show',
        description: '通話開始時に通知メッセージを送信するテキストチャンネルを返します。',
      },
      {
        type: ApplicationCommandOptionType.Subcommand,
        name: 'set',
        description: '通話開始時に通知メッセージを送信するテキストチャンネルを設定します。',
        options: [
          {
            type: ApplicationCommandOptionType.Channel,
            name: 'channel',
            description:
              '通話開始時に通知メッセージを送信するテキストチャンネル。入力しなかった場合は現在の設定を削除します。',
            required: false,
          },
        ],
      },
    ],
  },

  // new SlashCommandBuilder()
  // .setName('notifychannel')
  // .setDescription('通話開始時に通知メッセージを送信するテキストチャンネルを確認/設定します。')
  // .addSubcommand(
  //   new SlashCommandSubcommandBuilder()
  //     .setName('set')
  //     .setDescription('通話開始時に通知メッセージを送信するテキストチャンネルを返します。'),
  // )
  // .addSubcommand(
  //   new SlashCommandSubcommandBuilder()
  //     .setName('set')
  //     .setDescription('通話開始時に通知メッセージを送信するテキストチャンネルを設定します。')
  //     .addChannelOption(
  //       new SlashCommandChannelOption()
  //         .setName('channel')
  //         .setDescription(
  //           '通話開始時に通知メッセージを送信するテキストチャンネル。入力しなかった場合は現在の設定を削除します。',
  //         )
  //         .setRequired(false),
  //     ),
  // ),
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

      // テキストチャンネルまたはアナウンスチャンネル以外が指定された場合
      if (inputChannel.type !== ChannelType.GuildText && inputChannel.type !== ChannelType.GuildAnnouncement) {
        return command.reply({
          content: `${inputChannel} に通知を行うことはできません。通常のテキストチャンネルまたはアナウンスチャンネルを指定してください。`,
        });
      }

      // 通知するチャンネルを設定するとき
      prisma.guild
        .update({ where: { id: dbGuild.id }, data: { notifyChannelId: inputChannel.id } })
        .catch(handlePrismaError)
        .then(() => {
          return command.reply(
            `通話開始時に通知メッセージを送信するテキストチャンネルを ${inputChannel} に設定しました。`,
          );
        })
        .catch(consoleError);
      return;
    }

    return;
  },
};

export default notifyChannelCommand;
