import { Command, CommandAPI, CommandFlags } from '@/bot/command.js';
import { cfg } from '@/bot/cfg.js';
import * as dsc from 'discord.js';
import * as log from '@/util/log.js';
import { PredefinedColors } from '@/util/color.js';

export const izolatkaCmd: Command = {
    name: 'izolatka',
    aliases: [],
    description: {
        main: 'Jakby to ująć tak poetycko... Zamknij kogoś w przybrzeżnym więzieniu.',
        short: 'Taki mute ale bardziej denerwujący. Aha, no i można z administracją gadać.'
    },
    flags: CommandFlags.Important,

    expectedArgs: [
        { name: 'question', type: 'string', optional: false, description: 'Mam go dodać do izolatki (add) czy go stamtąd usunąć (rem)?'},
        { name: 'user', type: 'user-mention', optional: false, description: 'Podaj użytkownika do izolatki!' }
    ],
    permissions: {
        discordPerms: null,
        allowedRoles: [cfg.roles.eclair25, cfg.roles.secondLevelOwner, cfg.roles.headAdmin, cfg.roles.admin, cfg.roles.headMod],
        allowedUsers: []
    },
    async execute(api) {
        const targetUser = api.getTypedArg('user', 'user-mention').value as dsc.GuildMember;
        const modeOrig = api.getTypedArg('question', 'string').value as string;
        const mode = modeOrig.replace('#force-do', '').trim();
        if (mode !== 'add' && mode !== 'rem') {
            return log.replyError(api.msg, 'Podaj akcję.', 'Kolego, panie! Mam go dodać (add) czy usunąć (rem)?');
        }
        if (!modeOrig.includes('#force-do') && !cfg.commands.mod.izolatka.enabledForNormalAdministrators) {
            return log.replyWarn(api.msg, 'Nie polecam', 'Dwie osoby wyszły z serwera przez tą izolatkę. To po prostu wina tego konceptu. Nawet nie próbuj tłumaczyć, że to wina Gorciu\'a, bo ich dodał; tak to prawda, ale co to kurde w ogóle za koncept... ||Jak naprawdę Ci zależy, to dodaj po rem/add `#force-do` (bez spacji, połączone).||');
        }
        if (modeOrig.includes('#force-do') && !cfg.commands.mod.izolatka.enabledForNormalAdministrators && !api.msg.member!.plainMember.roles.cache.hasAny(cfg.roles.eclair25, cfg.roles.secondLevelOwner)) {
            return log.replyError(api.msg, 'Ty nie możesz!', 'Izolatka została wyłączona w konfiguracji dla administratorów poniżej współwłaściciela! (psst... prawdopodobnie dlatego, że została zaarchiwizowana)');
        }
        if (mode == 'add' && !targetUser.roles.cache.has('1415020555572088872')) {
            targetUser.roles.add('1415020555572088872');
        }
        if (mode == 'rem' && targetUser.roles.cache.has('1415020555572088872')) {
            targetUser.roles.remove('1415020555572088872');
        }

        return log.replySuccess(api.msg, 'TAAK!', 'Udało się przenieść / wywalić usera z izolatki!')
    }
};
