import { client } from '@/client.ts';
import { ActivityType } from 'discord.js';
import { getRandomInt } from './math/rand.ts';

type DiscordStatus = {
    type: ActivityType;
    name: string;
    desc: string;
};

function changeStatusToRandomOne(prev?: number): number {
    while (true) {
        const statuses: DiscordStatus[] = [
            {
                type: ActivityType.Watching,
                name: 'ogląda was 😈',
                desc: 'tak jak kiedyś watchdog, który nigdy nie stał na nogach',
            },
            {
                type: ActivityType.Playing,
                name: 'nielegalnekasynko.pl',
                desc: 'pamiętaj, że tylko 0.9% osób odnosi sukces. ja jestem wśród nich.',
            },
            {
                type: ActivityType.Watching,
                name: 'Announcing new Intel Core Ultra Plus CPU',
                desc: 'Intel - YouTube',
            },
            {
                type: ActivityType.Listening,
                name: 'Nudzi mi sie - PowietrzeMusic',
                desc: 'moja muzyka jest jak powietrze, to jest nic przez 3 minuty.',
            },
            {
                type: ActivityType.Playing,
                name: 'wstawianie kropek.',
                desc: 'pamiętaj by zawsze wstawiać kropki na końcu zdania. teraz ja musze siedziec i je wstawiac.',
            },
            {
                type: ActivityType.Watching,
                name: 'memy z 2010 na pięknych *demotywatory.pl*',
                desc: 'retrogaming internetowej nostalgii',
            },
            {
                type: ActivityType.Watching,
                name: 'komputer się zawiesza',
                desc: 'spektakl trwa już 3 godziny',
            },
            {
                type: ActivityType.Watching,
                name: 'kitten icat selfie.png',
                desc: 'self-reflection.exe',
            },
        ];

        const idx = getRandomInt(0, statuses.length - 1);
        if (prev != undefined && idx == prev) continue;

        const status = statuses[idx];

        client.user!.setActivity({ type: status.type, name: status.name, state: status.desc });
        return idx;
    }
}

export function initStatusGenerator() {
    let prev: number | undefined;

    setInterval(() => {
        prev = changeStatusToRandomOne(prev);
    }, 2 * 60 * 1000);

    prev = changeStatusToRandomOne();
}
