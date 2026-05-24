import { client } from '@/features/serchat/client.ts';

export default function registerLeveling() {
    client.on('messageCreate', (msg) => {
        if (msg.senderIsBot) return;
    })
}
