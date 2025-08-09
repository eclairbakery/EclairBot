import { prettyPrint } from './util/objects';

import * as log from './util/log';

import * as cfgManager from './bot/config';

import * as dotenv from 'dotenv';
import * as dsc from 'discord.js';

dotenv.config({quiet: true});

let cfg = cfgManager.loadConfig();
console.log(prettyPrint(cfg));

interface Command {
    name: string;
    description: string;
    canExecute: null | string[]; // null = everyone can execute; if not null an array of role id strings that are allowed to execute the command
    code: (msg: dsc.OmitPartialGroupDMChannel<dsc.Message<boolean>>, args: string[]) => void;
};

const prefix = '!';

const commands: Command[] = [
    {
        name: 'help',
        description: 'Views all commands',
        canExecute: null,
        code(msg, args) {
            const all_commands_fields: dsc.APIEmbedField[] = [];
            commands.forEach((command) => {
                all_commands_fields.push({
                    name: `!${command.name}`,
                    value: command.description
                });
            });
            msg.reply({
                embeds: [
                    new dsc.EmbedBuilder()
                            .setTitle('📢 Moje komendy, władzco!')
                            .setDescription('Proszę o to komendy o które pan prosił. Jesteś kobietą? No to prawdopodobnie nie zrozumiesz propagandy tego serwera.')
                            .setColor(0x00ff00)
                            .setFields(all_commands_fields)
                ]
            });
        },
    },
    {
        name: 'ban',
        description: 'Jak masz uprawnienia, no to banuj ludzi. Taka praca... A jak nie, to nawet nie próbuj tego tykać!',
        canExecute: ['1403684128485806182'],
        async code(msg, args) {
            const who = msg.mentions.members.first();
            let reason = '';
            args.forEach((arg) => {
                if (arg.startsWith('<@')) return;
                reason += arg + ' ';
            });
            reason = reason.trim();
            if (reason == '') {
                reason = 'Mod nie poszczycił sie zbytnią znajomością komendy i nie podał powodu. Ale może to i lepiej...';
            }
            try {
                await who.ban({reason} /** you can write like this if the key name is the same as the variable name you want to pass (shorthand property) */);
            } catch {
                msg.reply(log.getErrorEmbed('Taki mały problemik był...', 'Chyba jestem niżej w permisjach od osoby do zbanowania.'));
            }
            msg.reply({
                embeds: [
                    new dsc.EmbedBuilder()
                            .setTitle('📢 Już po nim!')
                            .setDescription('Właśnie zbanowałem tego użytkownika!')
                            .setColor(0x00ff00)
                ]
            });
        }
    },
    {
        name: 'kick',
        description: 'Ta komenda istnieje po to by pozbyć się z serwera lekko wkurzających ludzi, tak żeby im nie dawać bana, a oni żeby myśleli że mają bana. A pospólstwo to ręce z daleka od moderacji!',
        canExecute: ['1403684128485806182'],
        async code(msg, args) {
            const who = msg.mentions.members.first();
            let reason = '';
            args.forEach((arg) => {
                if (arg.startsWith('<@')) return;
                reason += arg + ' ';
            });
            reason = reason.trim();
            if (reason == '') {
                reason = 'Mod nie poszczycił sie zbytnią znajomością komendy i nie podał powodu. Ale może to i lepiej...';
            }
            try {
                await who.kick(reason);
            } catch {
                log.replyError(
                    msg,
                    'Taki mały problemik był...',
                    'Chyba jestem niżej w permisjach od osoby do wywalenia. Więc... y... nie wiem, moze spróbuj mnie dać wyżej Eklerko? (przy okazji zrób ten odcinek)'
                );
            }
            msg.reply({
                embeds: [
                    new dsc.EmbedBuilder()
                        .setTitle('📢 Do widzenia panieeee!')
                        .setDescription('Właśnie wywaliłem tego gościa z serwera. Mam cichą nadzieję, że nie sprawił zbytniego kłopotu...')
                        .setColor(0x00ff00)
                ]
            });
        }
    }
];

const client = new dsc.Client(
    {
        intents: [
            dsc.GatewayIntentBits.DirectMessages, dsc.GatewayIntentBits.GuildMessages,
            dsc.GatewayIntentBits.MessageContent, dsc.GatewayIntentBits.GuildModeration,
            dsc.GatewayIntentBits.Guilds,         dsc.GatewayIntentBits.GuildMembers
        ],
    },
);

client.once('ready', () => {
    console.log(`Logged in.`);
});

client.on('messageCreate', (msg) => {
    if (!msg.inGuild()) return;
    if (!msg.content.startsWith(prefix)) return;
    var args = msg.content.slice(prefix.length).trim().split(/\s+/);
    const command = args.shift();
    const cmd_object = commands.find((val) => val.name === command);
    if (!cmd_object) {
        log.replyError(msg, 'Panie, ja nie panimaju!', `Wpisz se \`${prefix}help\` i dostarczę Ci listę komend!`);
        return;
    } else if (cmd_object.canExecute !== null && !msg.member.roles.cache.some(role => cmd_object.canExecute.includes(role.id))) {
        log.replyError(msg, 'Hej, a co ty odpie*dalasz!', `Wiesz że nie masz uprawnień? Poczekaj aż hubix się tobą zajmie...`);
        return;
    } else {
        return cmd_object.code(msg, args);
    }
});

client.login(process.env.TOKEN);
