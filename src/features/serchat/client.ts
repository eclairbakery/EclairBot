import * as serchat from 'serchat.ts';
import { output } from '@/bot/logging.ts';
import registerLeveling from '@/features/serchat/leveling.ts';
import SerchatCommandLevel from '@/features/serchat/cmd/lvl.ts';
import logError from '@/util/log-error.ts';
import SerChatCommandWiki from '@/features/serchat/cmd/wiki.ts';

export const client = new serchat.Client({
    logLevel: serchat.LogLevel.ERROR
});

const serchat_commands: serchat.BotCommand[] = [
    new SerchatCommandLevel(),
    new SerChatCommandWiki()
];

export default async function startSerchatClient() {
    if (!Deno.env.has("EB_SERCHAT_TOKEN")) {
        output.warn('You should set EB_SERCHAT_TOKEN enviorment variables to a SerChat bot token.\nOtherwise, the SerChat integration will not work');
        return;
    }

    await client.login(Deno.env.get("EB_SERCHAT_TOKEN")!);
    output.verbose("Logged in to SerChat");

    registerLeveling();

    for (const command of serchat_commands) {
        client.commands.register(command);
    }

    try {
        await client.commands.sync();
    } catch (e) {
        logError('stdwarn', e, "SerChat command sync")
    }
}
