import { PrismaClient } from '@prisma/client';
import { ApplicationCommand, Collection, CommandInteraction, Guild } from 'discord.js';

import { Command, CommandInteractionWithGuild } from './commands/command';
import notifyChannelCommand from './commands/notifyChannel';
import pingCommand from './commands/ping';
import setCommand from './commands/set';

export default class CommandHandler {
  commands = new Collection<string, Command>(
    [pingCommand, notifyChannelCommand, setCommand].map((cmd) => [cmd.data.name, cmd])
  );
  prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  public setCommandsToGuild(guild: Guild): Promise<Collection<string, ApplicationCommand>> {
    return guild.commands.set(this.commands.map((cmd) => cmd.data));
  }

  public async execCommand(command: CommandInteraction): Promise<void> {
    if (!command.guildId || !command.guild) return;

    const exec = this.commands.get(command.commandName)?.exec;

    if (exec) {
      // データベースからサーバーの情報を取得 (なければレコードを作成)
      const dbGuild = await this.prisma.guild.upsert({
        where: { guildId: command.guildId },
        create: {
          guildId: command.guildId,
        },
        update: {},
        include: {
          channels: true,
        },
      });

      // コマンド実行
      // 型ガードしてる
      exec(command as CommandInteractionWithGuild, dbGuild, this.prisma);
    }
    // コマンドを実行する関数がないとき
    else {
      command.reply({ content: 'エラーが発生しました。' });
    }
  }
}
