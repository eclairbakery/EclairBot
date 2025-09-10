import * as dsc from 'discord.js';
import { PredefinedColors } from '@/util/color.js';
import { Command } from '@/bot/command.js';

export const changelogCmd: Command = {
    name: 'changelog',
    description: {
        main: 'Ogólnie mówiąc bardzo długi changelog, gdzie tłumaczę w sposób niezrozumiały dla Ciebie, co się u mnie zmieniło ostatnio.',
        short: 'Wyświetl changelog.',
    },
    expectedArgs: [
        {
            name: 'version',
            description: 'Wersja changeloga (opcjonalnie).',
            type: 'string',
            optional: true
        },
    ],
    aliases: [],
    permissions: {
        discordPerms: null,
        allowedRoles: null,
        allowedUsers: [],
    },

    async execute(api) {
        const version = api.getArg('version')?.value as string | undefined;

        if (version === 'beta-1.0') {
            return api.msg.reply({
                embeds: [
                    new dsc.EmbedBuilder()
                        .setAuthor({ name: 'EclairBOT' })
                        .setColor(PredefinedColors.Pink)
                        .setTitle('EclairBOT beta 1.0')
                        .setDescription(
                            'Krótko mówiąc dodane zostały te komendy: `bal`, `blackjack`, `crime`, `rob`, `slut`, `work`, `topeco`, `banner`, `changelog`, `commands`, `help`, `detail-help`, `man`, `pfp`, `siema`, `animal`, `dog`, `cat`, `parrot`, `lvl`, `toplvl`, `xp`, `ban`, `kick`, `mute`, `unmute`, `warn`, `warn-clear`, `warnlist`. Pewnie pojawi się jeszcze więcej.'
                        ),
                ],
            });
        } else if (version === '1.0') {
            return api.msg.reply({
                embeds: [
                    new dsc.EmbedBuilder()
                        .setAuthor({ name: 'EclairBOT' })
                        .setColor(PredefinedColors.Pink)
                        .setTitle('EclairBOT 1.0')
                        .setDescription(
                            'Zostały dodane logi, template channels, które na przykład liczą bany, system akcji i tak dalej. Podaj `beta-1.0` jako argument by zobaczyć poprzednią aktualizację.'
                        ),
                ],
            });
        } else if (version === '1.1') {
            return api.msg.reply({
                embeds: [
                    new dsc.EmbedBuilder()
                        .setAuthor({ name: 'EclairBOT' })
                        .setColor(PredefinedColors.Pink)
                        .setTitle('EclairBOT 1.1')
                        .setDescription(
                            'Teraz można wyświetlać najlepsze artykuły z fandomu Piekarnii Eklerki. Dodano też komendę wiki, która wyświetla rzeczy z Wikipedii. Została dodana komenda do restartu bota. A i prawie bym zapomniał, teraz masz dość łatwy sposób by usuwać wiadomości. Został dodany filt anti-spam i anti-flood (anti-flood obecnie wyłączony ze względu na jego słabą jakość). Podaj `1.0` jako argument by zobaczyć poprzednią aktualizację.'
                        ),
                ],
            });
        } else {
            return api.msg.reply({
                embeds: [
                    new dsc.EmbedBuilder()
                        .setAuthor({ name: 'EclairBOT' })
                        .setColor(PredefinedColors.Pink)
                        .setTitle('EclairBOT 1.2')
                        .setDescription(
                            'Witaj. W najnowszej aktualizacji zostało dodane oczywiście - tak zgadłeś, notify. Pozwala ono od admin+ pingować prawie każdy fajny ping. Podaj `1.1` jako argument by zobaczyć poprzednią aktualizację.'
                        ),
                ],
            });
        }
    },
};