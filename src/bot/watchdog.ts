import * as dsc from 'discord.js';
import { cfg } from './cfg.js';
import { PredefinedColors } from '@/util/color.js';
import { client } from '@/client.js';

const recentJoins: { id: string; joinedAt: number; username: string }[] = [];

function levenshtein(a: string, b: string): number {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            matrix[i][j] =
                b[i - 1] === a[j - 1]
                    ? matrix[i - 1][j - 1]
                    : Math.min(
                          matrix[i - 1][j - 1] + 1,
                          matrix[i][j - 1] + 1,
                          matrix[i - 1][j] + 1
                      );
        }
    }
    return matrix[b.length][a.length];
}

async function logAlarming(description: string, fatal: boolean, mem: dsc.GuildMember, score: number) {
    const channel = await client.channels.fetch(cfg.channels.mod.modGeneral);
    if (!channel.isSendable()) return;
    channel.send({
        embeds: [
            new dsc.EmbedBuilder()
                .setAuthor({
                    name: 'EclairBOT'
                })
                .setColor(fatal ? PredefinedColors.Red : PredefinedColors.Yellow)
                .setTitle('❌ ' + (fatal ? `Podejmij działania na temat użytkownika ${mem.user.username}!` : `${mem.user.username} może być podejrzany.`))
                .setDescription(`Nastąpiły te problemy z tym użytkownikiem:\n\n${description}\n\nWyliczyłem i ma ${score} punktów reputacji. ${fatal ? `A i sorry za ping...` : 'A! Co prawda nie spingowałem, ale sorki za mały flood.'}`)
        ],
        content: fatal ? '@here' : undefined
    });
}

export async function watchNewMember(mem: dsc.GuildMember): Promise<boolean | 'kicked'> {
    let defaultTrustScore = 5;
    let trustScore = (defaultTrustScore - 1) + 1; // javascript i dont want references

    let fatal = false;
    let issues: string[] = [];

    if (cfg.masterSecurity.trustNewMembers) return true;
    if (cfg.masterSecurity.fuckNewMembers) {
        await mem.kick();
        return 'kicked';
    }

    const created = mem.user.createdAt;
    const now = new Date();
    const accountAge = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    if (accountAge < 7) {
        issues.push('Konto jest dziwnie młode.');
        trustScore -= 5;
    }

    if (!mem.user.avatar) {
        trustScore -= 1;
        issues.push('Konto nie ma avatara (ciekawe).');
    }

    const susWords = ["free nitro", "discord.gg", "http://", "https://", ".ru", "▒", "░"];
    if (susWords.some(w => (mem.user.username.toLowerCase().includes(w)) || mem.user.displayName.toLowerCase().includes(w))) {
        trustScore -= 1;
        issues.push('Ma jakiś nick z adresem url, losowymi znakami unicode, invite do serwera, reklamą na Discord Nitro i/lub ruską domeną.');
    }

    if (mem.user.id == '572906387382861835') {
        trustScore -= 3;
        issues.push('Nikt go tu nie chce, wywalać StartIT w tej chwili!');
    }

    recentJoins.push({ id: mem.id, joinedAt: Date.now(), username: mem.user.username });
    const windowStart = Date.now() - cfg.masterSecurity.massJoinWindow;
    const recent = recentJoins.filter(e => e.joinedAt > windowStart);
    if (recent.length >= cfg.masterSecurity.massJoinThreshold) {
        issues.push(`Wykryto masowe dołączenia nowych członków - ${recent.length} w bliskim do siebie czasie.`);
        trustScore -= 3;
    }

    for (const prev of recent.filter(e => e.id !== mem.id)) {
        if (levenshtein(prev.username.toLowerCase(), mem.user.username.toLowerCase()) <= cfg.masterSecurity.similarityThreshold) {
            issues.push(`Nick podobny do innego niedawnego użytkownika: ${prev.username}`);
            trustScore -= 2;
        }
    }

    if (defaultTrustScore > trustScore) {
        if (trustScore <= 0) {
            fatal = true;
        }
        issues.push('Ma trust score mniejszy od domyślnego.');

        let issuesString = '';
        issues.forEach((issue) => {
            issuesString += `- ${issue}\n`;
        });
        issuesString = issuesString.trim();
        await logAlarming(issuesString, fatal, mem, trustScore);
        return false;
    }

    return true;
}