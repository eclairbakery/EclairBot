import { Config } from '../definitions/config.js';

const rolesCfg: Config['roles'] = {
    eclair25: '1280081773019140096',
    secondLevelOwner: '1280884378586845216',
    headAdmin: '1415710955022843904',
    admin: '1415710969732005980',
    headMod: '1415710973288910919',
    mod: '1415710976644349972',
    helper: '1415710980612034771',

    automodBypassRoles: ['1380875827998097418'],
};   
     
const channelsCfg: Config['channels'] = {
    mod: {
        modGeneral: '1235552454838456433',
        logs: '1235641912241819669',
        warnings: '1305591940821028884',
        hallOfShame: '1290327060970995812',
        modCommands: '1392787737962090596',
        info: '1390389554623549641',
        assets: '1404396223934369844',
        eclairBotAlerts: '1431322991022833785'
    },
    important: {
        lobby: '1235560269871190056',
        rules: '1286058702214008935',
        announcements: '1235560320596967516',
        boosts: '1298706083556229222',
    },
    general: {
        general: '1264971505662689311',
        offtopic: '1392567715407073402',
        commands: '1235604839078035537',
        media: '1235567551753486407',
    },
    other: {
        communityPolls: '1320035545543606282',
        desktopPorn: '1279888407421648967',
        minecraft: '1342793182265741394',
        economy: '1235561759448895590',
    },
    forfun: {
        counting: '1235566520310956184',
        lastLetter: '1235566646324887562',
        finishSentence: '1276861659587280896',
        wordAssociation: '1235567493855187025',
        unfiltred: '1397628186795311246',
    },
    isolation: {
        isolationCell: '1415020477180674048',
    },
    eclairbot: {
        stdout: '1419323394440167555',
        stderr: '1419323609419092019',
        stdwarn: '1435307953660887101',
        dbBackups: '1429118062816137318'
    },
    dev: {
        programming: '1426217543617740950'
    }
};

const commandsCfg: Config['commands'] = {
    mod: {
        ban: {
            enabled: true,
            aliases: [],
            allowedRoles: [rolesCfg.eclair25, rolesCfg.secondLevelOwner, rolesCfg.headAdmin, rolesCfg.admin, rolesCfg.headMod],
            allowedUsers: [],
            reasonRequired: false
        },
        kick: {
            enabled: true,
            aliases: [],
            allowedRoles: [rolesCfg.eclair25, rolesCfg.secondLevelOwner, rolesCfg.headAdmin, rolesCfg.admin, rolesCfg.headMod],
            allowedUsers: [],
            reasonRequired: false,
        },
        mute: {
            enabled: true,
            aliases: [],
            allowedRoles: [rolesCfg.eclair25, rolesCfg.secondLevelOwner, rolesCfg.headAdmin, rolesCfg.admin, rolesCfg.headMod, rolesCfg.mod, rolesCfg.helper],
            allowedUsers: [],
            reasonRequired: false,
        },
        warn: {
            enabled: true,
            aliases: [],
            allowedRoles: [rolesCfg.eclair25, rolesCfg.secondLevelOwner, rolesCfg.headAdmin, rolesCfg.admin, rolesCfg.headMod, rolesCfg.mod, rolesCfg.helper],
            allowedUsers: [],
            reasonRequired: false,
            maxPoints: 30,
            minPoints: 1,
        },
        ping: {
            allowedRoles: [rolesCfg.eclair25, rolesCfg.secondLevelOwner, rolesCfg.headAdmin, rolesCfg.admin],
            deathChatRenewInterval: 2 * 60 * 60 * 1000,
            eclairNewsRenewInterval: 6 * 60 * 60 * 1000,
            enabled: true
        },
        izolatka: {
            enabledForNormalAdministrators: true,
            enabled: true
        }
    },
    customs: {},
    defConf: {
        enabled: true
    }
};

export const defaultCfg: Config = {
    enabled: true,

    roles: rolesCfg,
    channels: channelsCfg,
    channelsConfiguration: {
        channelNameWatchdog: [
            {
                name: {
                    name: 'general',
                    emoji: '💬',
                    leaveSpaces: false
                },
                id: '1264971505662689311'
            },
            {
                name: {
                    name: 'offtopic',
                    emoji: '👤',
                    leaveSpaces: false
                },
                id: '1392567715407073402'
            },
        ],
        characters: {
            beforeEmoji: '﹝',
            afterEmoji: '﹞'
        },
        emojiPlacement: 'before-name',
        spaceReplacement: null
    },

    general: {
        prefix: 'sudo ',
        switchToProgrammingChance: 0.2,
        databaseBackups: {
            enabled: true,
            msg: '🗄️ automatyczny backup masz tutaj',
            interval: 2 * 60 * 60 * 1000
        },
        usingNormalHosting: false
    },

    emoji: {
        darkRedBlock:      { name: 'dark_red_block',    id: '1416021203331715082' },
        lightRedBlock:     { name: 'light_red_block',   id: '1416021243379056700' },
        darkGreenBlock:    { name: 'dark_green_block',  id: '1416021182964043856' },
        lightGreenBlock:   { name: 'light_green_block', id: '1416021218485600357' },

        circleProgressBar: {
            '0/4': { name: 'circle_progress_bar_04', id: '1416021170750492775' },
            '1/4': { name: 'circle_progress_bar_14', id: '1416021158779945020' },
            '2/4': { name: 'circle_progress_bar_24', id: '1416021143315546162' },
            '3/4': { name: 'circle_progress_bar_34', id: '1416021126890655894' },
        },

        heartAttackEmoji: { name: 'joe_zatrzymanie_akcji_serca', id: '1308174897758994443' },
        sadEmoji: { name: 'joe_smutny', id: '1317904814025474088' },
        wowEmoji: { name: 'joe_wow', id: '1308174905489100820' },
        idkEmoji: { name: 'joe_noniewiemno', id: '1317904812779503676' }
    },

    devPerms: {
        allowedRoles: [],
        allowedUsers: ['1368171061585117224', '990959984005222410', '985053803151753316', '1274610053843783768', '1401568817766862899']
    },

    blockCommands: {
        full: {
            default: 'allow',
            deny: [],
        },
        fullExceptImportant: {
            default: 'allow',
            deny: [...Object.values(channelsCfg.forfun), channelsCfg.general.media],
        },
        spammy: {
            default: 'block',
            allow: [channelsCfg.general.commands, channelsCfg.mod.modCommands, channelsCfg.mod.modGeneral, channelsCfg.forfun.unfiltred],
        },
        economy: {
            default: 'block',
            allow: [channelsCfg.other.economy, channelsCfg.mod.modCommands],
        },
        preferShortenedEmbeds: [channelsCfg.general.general]
    },

    unfilteredRelated: {
        gifBan: "1406369089634435204",
        unfilteredChannel: channelsCfg.forfun.unfiltred,
    },

    commands: commandsCfg,

    customization: {
        modTexts: {
            userIsProtectedHeader: 'Ten użytkownik jest chroniony!',
            userIsProtectedDesc: 'Ten uzytkownik chyba prosił o ochronę... A jak nie prosił... to i tak ją ma.',
            reasonRequiredNotSpecifiedHeader: 'Musisz podać powód!',
            reasonRequiredNotSpecifiedText: 'Bratku... dlaczego ty chcesz to zrobić? Możesz mi chociaż powiedzieć, a nie wysuwać pochopne wnioski i banować/warnować/mute\'ować ludzi bez powodu?',
            defaultReason: 'Moderator nie poszczycił się znajomością komendy i nie podał powodu... Ale moze to i lepiej...',
            havingMentalProblemsByWarningYourselfHeader: 'Bro co ty odpierdalasz?',
            havingMentalProblemsByWarningYourselfText: 'Czemu ty chcesz sobie dać warna? Co jest z tobą nie tak... Zabrać cię do szpitala zdrowia psychicznego czy co ja mam zrobić...',
            warningEclairBotReason: 'nei warnuje sie istoty wyższej panie',
            warningWatchdogReason: 'co prawda nie jest istotą wyższą watchdog, ale my sie lubimy. dam ci w zamian warna. nice try',
            warnHeader: '<mention> dostał warna od <mod>!',
            warnDescription: 'Warn w skrócie ma <points> punktów i skończy się <duration>.',
            shitwarnHeader: 'Masz shitwarna/fake-warna, <mention>!',
            noTargetSpecifiedHeader: 'Nie podano celu',
            noTargetSpecifiedText: 'Kolego co ty myślisz że ja się sam domyślę, komu ty to chcesz zrobić? Zgadłeś - nie domyślę się. Więc bądź tak miły i podaj użytkownika, dla którego odpalasz tą komendę.'
        },
        evalWarnings: {
            consoleLogWarn: '`console.log` spowoduje iż gorciu dostanie dm z wynikiem, ale może się on nie pojawić w wyniku komendy. evaluje sie funkcja wiec po prostu uzyj return by cos napisac. mozesz ten zrobic zmienna z buforem wyjscia i zwracac ja na koncu. z kolei `console.error` w ogóle nie da wyniku...',
            doNotDownloadDatabase: 'wiem, ze jest do tego masa sposóbów by bypassnąć ten restriction ale plz nie pobieraj bazy danych bota; btw masz do tego db-backups',
            execReturnWarn: 'nie używasz return a masz używać...',
            unsafeEval: 'unsafe, użyj do tego komendy `restart`',
            wait: 'cierpliwości nauczę cię, nie sbrickujesz mnie',
            waitRestart: 'cierpliwości',
            gonnaRestart: 'jusz siem restartujem plis łejt plis plis plis łejt'
        },
        commandsErrors: {
            legacy: {
                commandDisabledHeader: 'Ta komenda jest wyłączona',
                commandDisabledDescription: 'Eklerka coś tam gadał, że go wkurza bloat, więc dodałem wyłączanie komend. Trzeba będzie wszystko dodać jako możliwe do wyłączenia w konfiguracji XD.',
                doesNotWorkInDmHeader: 'Ta komenda nie jest przeznaczona do tego trybu gadania!',
                doesNotWorkInDmText: 'Taka komenda jak \`<cmd>\` może być wykonana tylko na serwerach no sorki no!',
                missingPermissionsHeader: 'Hej, a co ty odpie*dalasz?',
                missingPermissionsText: 'Wiesz że nie masz uprawnień? Poczekaj aż hubix się tobą zajmie...',
                commandNotFoundHeader: 'Nie znam takiej komendy',
                commandNotFoundText: 'Komenda \`<cmd>\` nie istnieje'
            },
            slash: {
                notAllowedInDm: 'Nie możesz tej komendy uruchomić w DMach.',
                commandIsDisabled: 'Ktoś tą komendę z jakiegoś powodu wyłączył...',
                commandNotFound: 'Nie znam takiej komendy',
                missingPermissions: 'Nie masz uprawnień.'
            }
        },
        economyTexts: {
            betWrongAmountHeader: 'Namieszałeś z kwotą.',
            betWrongAmountText: 'Podaj poprawną kwotę!',
            balanceNotSufficientHeader: 'Nie masz wystarczającej ilości pieniędzy.',
            balanceNotSufficientText: 'Może nie zdążyłeś ich wypłacić?',
            bankBalanceNotSufficientText: 'Przynajmniej w banku...',
            blackjack: {
                title: '♠️ Blackjack ♠️',
                descriptionWin: '🏆 Wygrałeś!',
                descriptionLose: '💥 Przegrałeś!',
                descriptionDraw: '🤝 Remis!',
                descriptionTimeout: '⏳ Czas minął!',
                descriptionBust: '💥 Przegrałeś! Przekroczyłeś 21.',
            },
            playerCardsLabel: 'Twoje karty',
            dealerCardsLabel: 'Karty dealera',
            workSlutOrCrime: {
                crime: {
                    crimeNotAllowedHeader: 'Ta możliwość jest zablokowana!',
                    crimeNotAllowedText: `Z racji, iż mógłbyś się zadłużyć i nie móc z tego wyjść potem bez resetu ekonomii, dokonywanie przestępstw jest dozwolone tylko, jeżeli masz więcej niż 100$.`,
                    waitTextHeader: 'Chwila przerwy!',
                    waitTextDescription: `Musisz odczekać **<seconds> sekund** zanim znowu popełnisz przestępstwo.`,
                    winHeader: 'Yay!',
                    winText: `Popełniłeś przestępstwo i zarobiłeś *<amount>** dolarów!`,
                    loseHeader: 'Przestępstwo nie zawsze się opłaca...',
                    loseText: `Straciłeś **<amount>** dolarów, ponieważ musiałeś zapłacić mandat!`
                }
            },
            robbing: {
                waitHeader: 'Chwila przerwy!',
                waitText: `Musisz poczekać **<seconds> sekund** zanim spróbujesz znowu okraść kogoś.`
            }
        },
        watchdogTexts: {
            fatalHeader: 'Podejmij działania na temat użytkownika <user>!',
            suspiciousHeader: `<user> może być podejrzany.`,
            descStart: `Nastąpiły te problemy z tym użytkownikiem:\n\n`,
            descEnd: {
                reputation: '\n\nWyliczyłem i ma <score> punktów reputacji.',
                floodSorry: 'A! Co prawda nie spingowałem, ale sorki za mały flood.',
                pingSorry: `A i sorry za ping...`
            },
            newBotsAddition: {
                firstSentence: 'dodawanie botów jest wyłączone w konfiguracji',
                secondSentence: 'aby dodać innego bota, włącz cfg.masterSecurity.allowNewBots',
                gayBotSentence: 'a i btw to jest zacznijTO więc i tak bym go wywalił bo jest gejem',
                remReason: 'zasada cfg.masterSecurity.allowNewBots nie pozwala na dodawanie nowych botów'
            },
            susThings: {
                defaultIssue: 'Ma trust score mniejszy od domyślnego.',
                similarUsername: `Nick podobny do innego niedawnego użytkownika: <user>`,
                raid: `Wykryto masowe dołączenia nowych członków - <count> w bliskim do siebie czasie.`,
                gayBot: 'Nikt go tu nie chce, wywalać StartIT w tej chwili!',
                susName: 'Ma jakiś nick z adresem url, losowymi znakami unicode, invite do serwera, reklamą na Discord Nitro i/lub ruską domeną.',
                noAvatar: 'Konto nie ma avatara (ciekawe).',
                freshAccount: 'Konto jest naprawdę świeże (młodsze niż tydzień).',
                youngAccount: 'Konto jest dziwnie młode (młodsze niż miesiąc).'
            }
        },
        uncategorized: {
            gifErrorString: 'Wystąpił jakiś błąd. To najprawdopodobniej nie moja wina, więc wiń Tenora.',
            gifNotFound: 'Nie znaleziono GIF\'a...',
            gifWrongApiKey: 'Spinguj deweloperów bota, bo zapomnieli ustawić zmienną środowiskową...',
            wikiUnknownArticleHeader: 'Tego artykułu nie ma na Wikipedii!',
            wikiUnknownArticleText: 'Wiem, to niemożliwe...',
            wikiIsNotFandomHeader: 'Ta komenda nie jest do tego!',
            wikiIsNotFandomText: 'Rzeczy takie jak `eklerka`, `aurorOS`, `piekarnia eklerki`, `gorciu`, `maqix`, itd. nie są na wikipedii... Ale **są na fandomie**, więc możesz użyć komendy fandom!',
            wikiDisambiguationPageHeader: 'Doprecyzuj!',
            wikiDisambiguationPageText: 'Natrafiłeś na stronę ujednoznaczniającą. Ona wyświetla różne znaczenia wyrazu...',
            fandomDefaultQueryText: 'Zlew00',
            fandomArticleNotFoundHeader: 'Nie znaleziono...',
            fandomArticleNotFoundText: 'Niestety czegoś takiego na fandomie nie ma... Może jest na Wikipedii?'
        },
        stringifyEmbed: false
    },

    features: {
        automod: {
            antiFloodEnabled: false,
            antiSpamEnabled: false,
        },
        welcomer: {
            channelId: channelsCfg.important.lobby,
            enabled: true,
            general: channelsCfg.general.general,
            mentionNewPeopleInLobby: false,
            welcomeMsgs: [
                `witaj szanowny użytkowniku <mention>!`,
                `siema, ale przystojny jesteś <mention> ngl`,
                `kocham cię <mention>`,
                `c-cczęsto masz tak na imie <mention>?`,
                `nie chce mi się, <mention>`,
                `<mention>, lubimy cie (chyba)`
            ],
            goodbyeMsgs: [
                `do widzenia <mention>!`,
                `żegnaj <mention>, będziemy za tobą tęsknić! (chyba)`,
                `<mention> opuścił nasz serwer, ale zawsze może wrócić! (nie wróci)`,
            ],
            freeRolesForEveryone: [
                '1235548306550161451',
                // roles for appereance
                '1235540123576176652',
                '1415582195564806154',
                '1235541500889137273',
                '1235540273556361268'
            ],
        },
        forFun: {
            media: [
                {
                    channel: channelsCfg.general.media,
                    addReactions: ['👍', '👎', '😭', '🙏', '🤣', '<:joe_i_git:1376096877610799205>'],
                    deleteMessageIfNotMedia: true,
                    shallCreateThread: true
                },
                {
                    channel: channelsCfg.mod.hallOfShame,
                    addReactions: ['🙏'],
                    deleteMessageIfNotMedia: false,
                    shallCreateThread: false
                }
            ],
            countingChannel: channelsCfg.forfun.counting,
            lastLetterChannel: channelsCfg.forfun.lastLetter,
        },
        leveling: {
            xpPerMessage: 4,
            levelDivider: 100,
            excludedChannels: [],
            canChangeXP: ['1404392144441180221', rolesCfg.eclair25, rolesCfg.secondLevelOwner],
            milestoneRoles: {
                3: '1297559525989158912',
                5: '1235550102563852348',
                10: '1235550105751392276',
                15: '1235550109891035218',
                20: '1235570092218122251',
                25: '1235594078305914880',
                30: '1235594081556627577',
                50: '1235594083544858667',
                75: '1235594085188767835',
                100: '1390802440739356762'
            },
            levelChannel: '1235592947831930993',
            shallPingWhenNewLevel: false,
            currentEvent: {
                enabled: false,
                channels: [ channelsCfg.dev.programming ],
                multiplier: 2
            },
            generalLevelBoost: {
                enabled: true,
                boostTimeInMinutes: 2,
                generalActivityMeterRefreshInMinutes: 5
            },
            multipliers: []
        },
        hallOfFame: {
            channel: '1392128976574484592',
            eligibleChannels: [channelsCfg.general.general, channelsCfg.general.offtopic, channelsCfg.general.media, channelsCfg.mod.hallOfShame],
            enabled: false,
        },
        logs: {
            channel: channelsCfg.mod.logs,
            stdout: channelsCfg.eclairbot.stdout,
            stderr: channelsCfg.eclairbot.stderr,
            stdwarn: channelsCfg.eclairbot.stdwarn
        },
        ai: {
            enabled: false,
            channel: '1276271917665484801',
            notAllowedCharacters: [':', '#', '!', '&', '*'],
            bannedSequences: ['@here', '@everyone', 'choler', 'chuj', 'debil', 'fiucie', 'fiut', 'fuck', 'gówn', 'hitler', 'ja pierdole', 'ja pierdolę', 'jeba', 'jebany', 'jebi', 'jprdl', 'kurwa', 'kutas', 'niger', 'nigger', 'penis', 'pierdol', 'porn', 'putin', 'rucha', 'skibidi', 'skibidi toilet', 'spierdalaj', 'toilet', 'wypierdalaj', 'zapierdalaj'],
        },
        economy: {
            shop: [
                {
                    name: 'VIP',
                    description: 'Nie wiem poflexuj się rangą która jest na końcu listy, ale hej - dalej jesteś VIP\'em.',
                    price: 25_000,
                    role: '1235548993933541397'
                },
                {
                    name: 'miniVIP',
                    description: 'Taki VIP ale na sterydach. Nie możesz się poflexować, bo ma mini w nazwie i będą myśleli, że cię nie stać...',
                    price: 5_000,
                    role: '1235550013233303582'
                },
                {
                    name: 'SVIP',
                    description: 'Już lepszy VIP. Nie wiem co Ci daje to ciągłe upgradeowanie VIP\'ów, ale musi coś dawać, bo inaczej byś tego nie robił :wilted_rose:',
                    price: 100_000,
                    role: '1235550115998076948'
                },
                {
                    name: 'MVIP',
                    description: 'Kolejna generacja VIPa, której prawdopodobnie nie użyjesz...',
                    price: 250_000,
                    role: '1235569694451306516'
                },
                {
                    name: 'Pieczywo VIP',
                    description: 'VIP Final Boss. Daje ci aż pięciokrotny level boost!',
                    price: 1_000_000,
                    role: '1343632574437920799'
                },
                {
                    name: 'Hall of Shame Access',
                    description: 'Mamy taki fajny kanał zwany `Hall of Shame`! Właśnie dostaniesz do niego dostęp, wystarczy tylko, że ten przedmiot zostanie przez ciebie kupiony',
                    price: 10_000_000,
                    role: '1437780651356196864'
                }
            ],
            currencySign: '$',
            currencySignPlacement: 'left',

            commandSettings: {
                crime: {
                    cooldown: 15 * 60 * 1000,
                    maximumCrimeAmount: 8000,
                    minimumCrimeAmount: 2500,
                    successRatio: 0.4
                }
            }
        },
        moderation: {
            protectedRoles: [],
            warnAutoActions: []
        },
        translations: [],
        generalFiltering: {
            enabled: true,
            leet_map: {
                "@": "a",
                "4": "a",
                "€": "e",
                "3": "e",
                "1": "i",
                "!": "i",
                "|": "i",
                "0": "o",
                "5": "s",
                "$": "s",
                "7": "t",
                "+": "t",
                "2": "z",
                "8": "b",
                "9": "g"
            },
            regex: {
                regex: "\\b(" +
                    "snus(y|a|em|ik|iki|ow)?|" +
                    "white\\s?fox|" +
                    "velo|" +
                    "siberia|" +
                    "epok|" +
                    "nikotyn(a|owy|ie)?|" +
                    "papieros(y|a|ow)?|" +
                    "e-?papieros(y)?|" +
                    "vape(y|m|owac)?|" +
                    "joint(y|a)?|" +
                    "ziol(o|a)?|" +
                    "traw(a|y|a)?|" +
                    "alkohol|" +
                    "piw(o|a|em)?|" +
                    "wod(k|ka|ki|a)?" +
                    ")\\b",
                flags: "i"
            }
        }
    },

    masterSecurity: {
        trustNewMembers: false,
        fuckNewMembers: false,
        minimumAccountAge: 3,
        massJoinWindow: 10 * 60 * 1000,
        massJoinThreshold: 5,
        similarityThreshold: 3,
        allowNewBots: false,
        shallAutoDegrade: true,
        notForgiveAdministration: false,
        limitsConfiguration: {
            maxMutes: 6,
            maxWarns: 4,
            maxChannelCreations: 10,
            maxChannelDeletions: 2
        },
        approveDangerousPermissions: false
    }
};