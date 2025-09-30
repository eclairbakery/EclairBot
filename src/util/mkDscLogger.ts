import { client } from '@/client.js';
import { SendableChannel } from '@/defs.js';

import * as dsc from 'discord.js';
import util from 'node:util';

export default async function mkDscLogger(
    origWrite: typeof process.stdout.write,
    channelID: dsc.Snowflake,
    type: 'stdout' | 'stderr' | 'stdwarn' = 'stdout'
): Promise<typeof process.stdout.write> {
    const channel = await client.channels.fetch(channelID).catch(() => null);
    if (channel == null || !channel.isSendable()) return origWrite;
    const sendableChannel = channel as SendableChannel;

    return function (chunk: any, encoding?: any, cb?: any): boolean {
        if (typeof encoding == 'function') {
            cb = encoding;
            encoding = undefined;
        }
    
        const text =
            typeof chunk == 'string'
                ? chunk
                : Buffer.isBuffer(chunk)
                    ? chunk.toString(encoding ?? 'utf8')
                    : util.format(chunk);
        
        const cleanText = text.replace(/\x1b\[[0-9;]*m/g, '');
        const max = 1900;
        for (let i = 0; i < text.length; i += max) {
            sendableChannel.send(`hiouston ${type == 'stderr' ? 'jest problem' : (type == 'stdwarn' ? 'coś (mniej poważnego) się odwaliło' : 'masz log od komputera pokładowego')} \n\`\`\`ansi\n` + cleanText.slice(i, i + max).replace('```', '\`\`\`') + '```').catch(err => {
                origWrite(`dsc logger send error: ${String(err)}\n`);
            });
        }
    
        return origWrite(chunk, encoding, cb);
    };
}

