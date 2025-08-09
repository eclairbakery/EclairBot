import { pretty_print } from './util/objects';
import * as log from './util/log';
import * as cfg_manager from './bot/config';
import * as automod from './bot/automod';

import * as dotenv from 'dotenv';
import * as dsc from 'discord.js';
import * as sqlite from 'sqlite3';

dotenv.config({quiet: true});

const db = new sqlite.Database('bot.db');
db.exec("CREATE TABLE IF NOT EXISTS warns (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL, reason_string TEXT NOT NULL, points INTEGER NOT NULL);");

let cfg = cfg_manager.load_config();
console.log(pretty_print(cfg));

interface Command {
    name: string;
    description: string;
    canExecute: null | string[]; // null = everyone can execute; if not null an array of role id strings that are allowed to execute the command
    code: (msg: dsc.OmitPartialGroupDMChannel<dsc.Message<boolean>>, args: string[]) => void;
};

const prefix = '!';

function isStrictNumeric(str: string) {
    if (typeof str !== "string" || str.trim() === "") return false;
    return !Number.isNaN(Number(str));
}

function parseCommandArgs(args: string[]) {
    let points: number | null = null;
    let duration: string | null = null;
    let reasonParts: string[] = [];

    args.forEach(arg => {
        if (/^\d+$/.test(arg) && points === null) {
            points = parseInt(arg);
        } else if (/^\d+[smhd]$/.test(arg) && duration === null) {
            duration = arg;
        } else {
            reasonParts.push(arg);
        }
    });

    return {
        points,
        duration,
        reason: reasonParts.join(' ').trim()
    };
}

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
            const parsed = parseCommandArgs(args.filter(a => !a.startsWith('<@')));
            const reason = parsed.reason || 'Mod nie poszczycił sie zbytnią znajomością komendy i nie podał powodu. Ale może to i lepiej...';

            try {
                await who.ban({ reason });
            } catch {
                log.replyError(msg, 'Taki mały problemik był...', 'Chyba jestem niżej w permisjach od osoby do zbanowania.');
                return;
            }
            msg.reply({
                embeds: [
                    new dsc.EmbedBuilder()
                            .setTitle('📢 Już po nim!')
                            .setDescription(`Właśnie zbanowałem tego użytkownika!`)
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
            const parsed = parseCommandArgs(args.filter(a => !a.startsWith('<@')));
            const reason = parsed.reason || 'Mod nie poszczycił sie zbytnią znajomością komendy i nie podał powodu. Ale może to i lepiej...';

            try {
                await who.kick(reason);
            } catch {
                log.replyError(
                    msg,
                    'Taki mały problemik był...',
                    'Chyba jestem niżej w permisjach od osoby do wywalenia. Więc... y... nie wiem, moze spróbuj mnie dać wyżej Eklerko? (przy okazji zrób ten odcinek)'
                );
                return;
            }
            msg.reply({
                embeds: [
                    new dsc.EmbedBuilder()
                        .setTitle('📢 Do widzenia panieeee!')
                        .setDescription(`Właśnie wywaliłem tego gościa z serwera.`)
                        .setColor(0x00ff00)
                ]
            });
        }
    },
    {
        name: "warn",
        description: "Daj komuś warna, by go onieśmielić, uciszyć, zamknąć mu morde i nadużyć władzy. Żart, ale nie nadużywaj drogi modzie. Ale ja nie jestem modem... To już nie mój problem.",
        canExecute: ['1403684128485806182'],
        code(msg, args) {
            const who = msg.mentions.members.first();
            const parsed = parseCommandArgs(args.filter(a => !a.startsWith('<@')));
            const points = parsed.points ?? 1;
            const reason = parsed.reason || 'Mod nie poszczycił sie zbytnią znajomością komendy i nie podał powodu. Ale może to i lepiej...';

            db.run("INSERT INTO warns VALUES (NULL, ?, ?, ?)", [who.id, reason, points]);
            msg.reply({
                embeds: [
                    new dsc.EmbedBuilder()
                        .setTitle('📢 Masz warna!!!')
                        .setDescription(`Właśnie dostałeś darmoweeego warna (punktów: ${points})! Powód brzmi: \`${reason.replaceAll('`', '[znak]')}\`.`)
                        .setColor(0x00ff00)
                ]
            });
        },
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

async function getGIF(searchTerm: string): Promise<string> {
  const apiKey = process.env.TENOR_API;
  const url = `https://tenor.googleapis.com/v2/search?q=${searchTerm}&key=${apiKey}&limit=1&random=true&media_filter=minimal`;

  try {
    const response = await fetch(url);
    const json = await response.json() as any;

    if (json.results && json.results.length > 0) {
      return json.results[0].media_formats.gif.url;
    } else {
      return 'Nie znaleziono!';
    }
  } catch (error) {
    console.error('Błąd podczas pobierania GIFa:', error);
    return 'Wystąpił błąd!';
  }
}

client.on('messageCreate', async (msg) => {
    // block dm's, if you want to dm me, fuck out
    if (!msg.inGuild()) return;

    // a little reverse automod
    await automod.automod(msg, client);

    // let's do something awesome
    if (!msg.author.bot && (msg.content.includes('cat') || msg.content.includes('kot'))) {
        msg.reply(await getGIF('cat'));
    }
    if (!msg.author.bot && (msg.content.includes('dog') || msg.content.includes('pies'))) {
        msg.reply(await getGIF('dog'));
    }

    // let's do commands
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
