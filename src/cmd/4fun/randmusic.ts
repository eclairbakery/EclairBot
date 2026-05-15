import { Command } from '@/bot/command.ts';
import { CommandFlags } from '@/bot/apis/commands/misc.ts';
import { db, MusicEntry } from '../../bot/apis/db/bot-db.ts';

const randmusicCmd: Command = {
    name: 'randmusic',
    aliases: [],
    description: {
        main: 'Odkryj losową muzykę z naszej serwerowej bazy danych!',
        short: 'Dostań losowy utwór muzyczny',
    },
    flags: CommandFlags.Spammy,

    expectedArgs: [],

    permissions: {
        allowedRoles: null,
        allowedUsers: null,
    },

    async execute(api) {
        let music: MusicEntry | undefined = undefined;

        for (let i = 0; i < 5; i++) {
            music = await db.music.getRandomEntry() as MusicEntry; 
        
            if (!music) break;
            if (![api.executor.id, ...(await api.executor.fetchAlternativeAccounts())].includes(music.authorId)) break;
        } 

        if (!music) {
            return api.log.replyError(
                api,
                'Pustka totalna',
                'No w skrócie to nasza serwerowa baza muzyki™ jest aktualnie pusta, więc nic nie dostaniesz!',
            );
        }

        return api.reply({
            content: `polecam zasugerowane przez <@${music.authorId}> ${music.musicUrl}`,
            allowedMentions: {
                parse: [],
            },
        });
    },
};

export default randmusicCmd;
