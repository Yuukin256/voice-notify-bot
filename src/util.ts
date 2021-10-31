import { EmbedFieldData, Role, User, BaseGuildVoiceChannel } from 'discord.js';

export const nonNullable = <T>(value: T): value is NonNullable<T> => value != null;

export const makeMentionSettingEmbedFieldData = (
  channel: BaseGuildVoiceChannel,
  roles: Role[],
  users: User[]
): EmbedFieldData => {
  const mentions = [...roles, ...users].filter(nonNullable);
  return {
    name: '🔊 ' + channel.name,
    value: mentions.length ? mentions.join(' ') : 'メンションなし',
  };
};
