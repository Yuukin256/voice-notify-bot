import { Command } from './command';

const pingCommand: Command = {
  data: {
    name: 'ping',
    description: 'Botのレイテンシを返します。',
  },
  exec: (command) => {
    return command.reply({ content: `Ping: ${command.client.ws.ping}ms` });
  },
};

export default pingCommand;
