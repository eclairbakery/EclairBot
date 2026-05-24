import { client } from '@/features/serchat/client.ts';
import { Message } from 'serchat.ts';
import { translate } from '@/bot/apis/translations/translate.ts';

export default async function awaitUserConfirmation(text: string, from: string, confirmationMessage: string) {
    await client.sendMessage('695bfd6bd5faad271bdeb50c', '695bfd6bd5faad271bdeb510', confirmationMessage);

    return await new Promise((resolve, _reject) => {
        const listener = (msg: Message) => {
            if (![`\`${text}\``, text].includes(msg.text) || msg.senderId !== from) return;
            
            msg.reply(translate("Potwierdzono pomyślnie!"));
            client.off('messageCreate', listener);
            resolve(true);
        }
        client.on('messageCreate', listener);
    })
}
