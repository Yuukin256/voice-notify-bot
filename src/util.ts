import { TextChannel, Role, GuildMember, EmbedFieldData } from 'discord.js';

export const nonNullable = <T>(value: T): value is NonNullable<T> => value != null;

export const makeMentionSettingEmbed = (
  channel: TextChannel,
  roles: (Role | null)[],
  users: (GuildMember | null)[]
): EmbedFieldData => {
  const mentions = [...roles, ...users].filter(nonNullable);
  return {
    name: channel.name,
    value: mentions.length ? mentions.join(' ') : 'メンションなし',
  };
};
