import { PrismaClient } from '.prisma/client';
import { Collection, CommandInteraction, Guild } from 'discord.js';
import { Command } from './commands/command';
import pingCommand from './commands/ping';
import notifyChannelCommand from './commands/notifyChannel';

export default class CommandHandler {
  commands = new Collection<string, Command>([pingCommand, notifyChannelCommand].map((cmd) => [cmd.data.name, cmd]));
  prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  public setCommandsToGuild(guild: Guild) {
    return guild.commands.set(this.commands.map((cmd) => cmd.data));
  }

  public async execCommand(command: CommandInteraction) {
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
      exec(command, dbGuild, this.prisma);
    } else {
      command.reply({ content: 'エラーが発生しました。' });
    }
  }
}
