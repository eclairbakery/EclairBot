import * as dsc from 'discord.js';

export type Snowflake = `${number}` | string;
export type SendableChannel = dsc.TextChannel | dsc.DMChannel | dsc.NewsChannel | dsc.ThreadChannel | dsc.VoiceChannel;
export type RenameableChannel = dsc.GuildChannel & { setName(name: string, reason?: string): Promise<dsc.GuildChannel> };

export type Ternary = false | undefined | true;

export type EmptyObject = Record<PropertyKey, never>;
