import { client } from '@/client.js';
import { SendableChannel } from '@/defs.js';

import * as dsc from 'discord.js';
import util from 'util';

export default async function mkDscLogger(
    origWrite: typeof process.stdout.write,
    channelID: dsc.Snowflake
): Promise<typeof process.stdout.write> {
    origWrite('Here!');
    const channel = await client.channels.fetch(channelID).catch(() => null);
    if (channel == null || !channel.isSendable()) return origWrite;
    origWrite('Channel loaded idk');
    const sendableChannel = channel as SendableChannel;

    return function (chunk: any, encoding?: any, cb?: any): boolean {
        if (typeof encoding == 'function') {
            cb = encoding;
            encoding = undefined;
        }

        origWrite('Hi');
    
        const text =
            typeof chunk == 'string'
                ? chunk
                : Buffer.isBuffer(chunk)
                    ? chunk.toString(encoding ?? 'utf8')
                    : util.format(chunk);
        
        const cleanText = text.replace(/\x1b\[[0-9;]*m/g, '');
        const max = 1900;
        for (let i = 0; i < text.length; i += max) {
            sendableChannel.send('```js\n' + cleanText.slice(i, i + max).replace('```', '\`\`\`') + '```').catch(err => {
                origWrite(`dsc logger send error: ${String(err)}\n`);
            });
        }
    
        return origWrite(chunk, encoding, cb);
    };
}

