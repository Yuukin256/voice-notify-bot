import { EmbedField, Role, User, BaseGuildVoiceChannel } from 'discord.js';

export const nonNullable = <T>(value: T): value is NonNullable<T> => value != null;

export const makeMentionSettingEmbedFieldData = (
  channel: BaseGuildVoiceChannel,
  roles: Role[],
  users: User[],
): EmbedField => {
  const mentions = [...roles, ...users].filter(nonNullable);
  return {
    inline: true,
    name: '🔊 ' + channel.name,
    value: mentions.length ? mentions.join(' ') : 'メンションなし',
  };
};
