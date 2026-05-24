import * as serchat from 'serchat.ts';
import { output } from '@/bot/logging.ts';
import registerLeveling from '@/features/serchat/leveling.ts';

export const client = new serchat.Client({
    logLevel: serchat.LogLevel.ERROR
});

export default async function startSerchatClient() {
    if (!Deno.env.has("EB_SERCHAT_TOKEN")) {
        output.warn('You should set EB_SERCHAT_TOKEN enviorment variables to a SerChat bot token.\nOtherwise, the SerChat integration will not work');
        return;
    }

    await client.login(Deno.env.get("EB_SERCHAT_TOKEN")!);
    output.verbose("Logged in to SerChat");

    registerLeveling();
}
