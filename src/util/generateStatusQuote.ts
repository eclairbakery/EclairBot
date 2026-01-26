import { client } from "@/client.js";
import { ActivityType } from "discord.js";
import { getRandomInt } from "./math/rand.js";

type DiscordStatus = {
    type: ActivityType,
    name: string,
    desc: string
};

function changeStatusToRandomOne(prev: string): string {
    while (true) {
        const statuses: DiscordStatus[] = [
            {
                type: ActivityType.Watching,
                name: 'ogląda was 😈',
                desc: 'tak jak kiedyś watchdog, który nigdy nie stał na nogach'
            },
            {
                type: ActivityType.Playing,
                name: 'kasyno pana eklera',
                desc: 'pamiętaj, że tylko 0.9% osób odnosi sukces. ja jestem wśród nich.'
            },
            {
                type: ActivityType.Competing,
                name: 'wojna z hashcatem o hajs',
                desc: 'ja też chcę NaN hajsu w kasynie'
            },
            {
                type: ActivityType.Watching,
                name: 'Influencer wojna 2137 skibidi sigma',
                desc: 'GENZIE - YouTube'
            },
            {
                type: ActivityType.Listening,
                name: 'Powietrze - Billy Eilish',
                desc: 'moja muzyka jest jak powietrze, to jest nic przez 3 minuty.'
            },
            {
                type: ActivityType.Playing,
                name: 'wstawianie kropek.',
                desc: 'pamiętaj by zawsze wstawiać kropki na końcu zdania. teraz ja musze siedziec i je wstawiac.'
            },
            {
                type: ActivityType.Watching,
                name: 'memy z 2010 na pięknych *demotywatory.pl*',
                desc: 'retrogaming internetowej nostalgii'
            },
            {
                type: ActivityType.Watching,
                name: 'komputer się zawiesza',
                desc: 'spektakl trwa już 3 godziny'
            },
            {
                type: ActivityType.Watching,
                name: 'kitten icat selfie.png',
                desc: 'self-reflection.exe'
            },
        ];

        const status = statuses[getRandomInt(0, statuses.length - 1)];

        if ((status.name + '' + status.desc) == prev) {
            continue;
        }

        client.user!.setActivity({ type: ActivityType.Watching, name: status.name, state: status.desc });

        return status.name + '' + status.desc;
    }
}

export function setUpStatusGenerator() {
    let prev = '';

    setInterval(() => {
        prev = changeStatusToRandomOne(prev);
    }, 2 * 60 * 1000);

    prev = changeStatusToRandomOne(prev);
}