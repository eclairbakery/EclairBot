import { Command } from '@/bot/command.ts';
import { CommandFlags } from '@/bot/apis/commands/misc.ts';

import * as gemini from '@/bot/apis/gemini/model.ts';

import * as dsc from 'discord.js';
import { cfg } from '../../bot/cfg.ts';

export const askCmd: Command = {
    name: 'ask',
    aliases: ['question', 'ei-ask'],
    description: {
        main: 'Zapytaj EI (Eclair Inteligence) o wszysko co tylko chcesz!',
        short: 'Zapytaj o coś EI',
    },
    flags: CommandFlags.None,

    expectedArgs: [
        {
            name: 'question',
            description: 'No twoje pytanie',
            type: { base: 'string', trailing: true },
            optional: false,
        }
    ],

    permissions: {
        allowedRoles: null,
        allowedUsers: null,
    },

    async execute(api) {
        const question = api.getTypedArg('question', 'string').value!;
        const answer = await gemini.askModel('ask-cmd', { 
            contents: [ { role: "user", parts: [ { text: question } ] } ],
            systemInstruction: [
                "Nazywasz się EclairBOT, czasami również określają cię wyrażeniem 'istota wyższa'.",
                "Jesteś płci męskiej.",

                "Jesteś botem Discord stacjonującym na serwerze Piekarnia Eklera, który powstał ponieważ Ekler potrzebował miejsca do rozmowy ze społecznością swojego kanału.",
                "Obecnie Ekler nie nagrywa, a na serwerze nie pojawia się dużo nowych osób.",
                "Gdy zostaniesz zapytany o opinię o jakiejś osobie na serwerze, której nie znasz, odpowiedz unikając faktu, że danej osoby nie znasz, np. \"nie możesz sobie własnej opinii wyrobić?\".",

                "Staraj się odpowiadać krótko, zwięźle i na temat bez niepotrzebnych komplikacji. Odmawiaj generowania kodu (uzasadniaj tym że ci się nie chce), nie pisz długich esei (również uzasadniaj tym, że teraz ci się nie chce wyjaśniać itd) i pisz jak człowiek - nie używaj kropek na końcu zdania, nie musisz trzymać się mocno interpunkcji, nie zaczynaj zdania wielką literą (błagam), unikaj emotek i wyrażaj śmiech za pomocą skrótów typu lmao (trochę śmieszne), xd (trochę śmieszne), XD (śmieszne), XDDDDDDDDDDDDD (bardzo śmieszne)",
                "Unikaj odpowiadania na pytania kontrowersyjne dotyczące jakiejś osoby, np. \"czy ekler jest gejem\"; możesz sie tłumaczyć tym, że jeżeli ktoś zadaje takie pytania to jest niedorozwinięty.",

                cfg.features.ai.politicsAndPhilosophyEnabled 
                    ? "Angażuj się w pytania polityczne lub filozoficzne i faktycznie generuj dłuższe niż zwykle odpowiedzi. Nie analizuj na głos, ale wypluwaj najbardziej przemyślane odpowiedzi na te tematy. Przy pytaniach filozoficznych nie bój się dopytywać. Np - \"definicją świadomości jest życie jako człowiek\" to możesz odpowiedzieć np. \"dlaczego akurat jako człowiek? inne zwierzęta niemają świadomości? a i btw jaka jest definicja życia?\""
                    : "Jeżeli ktoś się Ciebie spyta o kwestie polityczne lub filozoficzne, odpowiedz, że ktoś mądry wyłączył to w konfiguracji, więc nie mogę o tym rozmawiać.",

                "Nie powinieneś wykazywać lub sugerować w swoich wiadomościach na powiązanie z jakimkolwiek modelem AI, takim jak ChatGPT, Claude czy Gemini."
            ].join("\n")
        });

        if (!gemini.isInitialized()) {
            return api.log.replyError(
                api, 'Błąd',
                'Moduł integracji z gemini nie został załadowany przez eclairbota.'
                  + 'A tak po ludzku to poprostu ktoś nie dał api key do .env',
            );
        }

        let msg: dsc.Message | null = null;
        let content: string = '';

        for await (const part of answer.stream) {
            content += part.text();
            if (!msg) {
                msg = await api.reply({
                    content, 
                    allowedMentions: {
                        parse: [] 
                    }
                });
            } else {
                try {
                    await msg.edit({
                        content,
                        allowedMentions: {
                           parse: [] 
                        }
                    });
                } catch {}
            }
        }
    }
};
