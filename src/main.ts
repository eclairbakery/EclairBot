import * as dotenv from 'dotenv';
dotenv.config({quiet: true});

import { GatewayIntentBits, Client, EmbedBuilder } from 'discord.js';
import type { APIEmbedField, Message, OmitPartialGroupDMChannel } from 'discord.js';

interface Command {
    name: string;
    description: string;
    canExecute: null | string[]; // null = everyone can execute; if not null an array of role id strings that are allowed to execute the command
    code: (msg: OmitPartialGroupDMChannel<Message<boolean>>, args: string[]) => void;
};

function print_error(msg: OmitPartialGroupDMChannel<Message<boolean>>, error: string, error_description: string) {
    msg.reply({
        embeds: [
            new EmbedBuilder()
                .setTitle('⚠️ ' + error)
                .setColor(0xff0000)
                .setAuthor({ name: 'EclairBOT' })
                .setDescription(error_description)
        ]
    });
}

const prefix = '!';

const commands: Command[] = [
    {
        name: 'help',
        description: 'Views all commands',
        canExecute: null,
        code(msg, args) {
            const all_commands_fields: APIEmbedField[] = [];
            commands.forEach((command) => {
                all_commands_fields.push({
                    name: `!${command.name}`,
                    value: command.description
                });
            });
            msg.reply({
                embeds: [
                    new EmbedBuilder()
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
                return print_error(msg, 'Taki mały problemik był...', 'Chyba jestem niżej w permisjach od osoby do zbanowania.');
            }
            msg.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('📢 Już po nim!')
                        .setDescription('Właśnie zbanowałem tego użytkownika!')
                        .setColor(0x00ff00)
                ]
            });
        }
    }
];

const client = new Client({ intents: [GatewayIntentBits.DirectMessages, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildModeration, GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

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
        print_error(msg, 'Panie, ja nie panimaju!', `Wpisz se \`${prefix}help\` i dostarczę Ci listę komend!`);
        return;
    } else if (cmd_object.canExecute !== null && !msg.member.roles.cache.some(role => cmd_object.canExecute.includes(role.id))) {
        print_error(msg, 'Hej, a co ty odpie*dalasz!', `Wiesz że nie masz uprawnień? Poczekaj aż hubix się tobą zajmie...`);
        return;
    } else {
        return cmd_object.code(msg, args);
    }
});

client.login(process.env.TOKEN);