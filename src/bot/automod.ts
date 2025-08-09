import * as dsc from 'discord.js';
import { getErrorEmbed } from '../util/log';

interface AutomodRules {
    activation_type: 'contains' | 'is_equal_to' | 'starts_with' | 'ends_with';
    activation_keyword: string;
    response: string;
    delete_target_message: boolean;
};

export async function automod(msg: dsc.OmitPartialGroupDMChannel<dsc.Message<boolean>>, client: dsc.Client) {
    const channel = await client.channels.fetch(msg.channelId);
    if (!channel.isSendable()) return;
    const automod_rules: AutomodRules[] = [
        // the most important go first
        {
            activation_type: 'contains',
            activation_keyword: '@everyone',
            response: 'Pan piekarz, czy tam Eklerka będzie zły...',
            delete_target_message: true
        },
        {
            activation_type: 'contains',
            activation_keyword: '@here',
            response: 'Może Eklerka nie będzie aż tak zły, jak w przypadku **małpa** everyone, ale i tak będzie zły...',
            delete_target_message: true
        },
        // fuck invites
        {
            activation_type: 'starts_with',
            activation_keyword: '.gg/',
            delete_target_message: true,
            response: 'Wypier*alaj ze swoją reklamą na serwery reklamowe ;)'
        },
        {
            activation_type: 'contains',
            activation_keyword: 'discord.gg',
            delete_target_message: true,
            response: 'Wypier*alaj ze swoją reklamą na serwery reklamowe ;)'
        },
        {
            activation_type: 'contains',
            activation_keyword: 'discord.com/invite/',
            delete_target_message: true,
            response: 'Wypier*alaj ze swoją reklamą na serwery reklamowe ;)'
        },
        // then go the least important
        {
            activation_type: 'is_equal_to',
            activation_keyword: 'git',
            response: 'hub',
            delete_target_message: false
        },
        {
            activation_type: 'is_equal_to',
            activation_keyword: 'kiedy odcinek',
            response: 'nigdy - powiedział StartIT, ale ponieważ startit jest jebanym gównem no to spinguj eklerke by odpowiedział',
            delete_target_message: false
        },
    ];
    for (const automod_rule of automod_rules) { // there is a foreach method, but it's objectivelly worse in this case
        let is_activated = false;
        switch (automod_rule.activation_type) {
            case 'contains':
                if (msg.content.includes(automod_rule.activation_keyword)) is_activated = true;
            case 'starts_with':
                if (msg.content.startsWith(automod_rule.activation_keyword)) is_activated = true;
            case 'ends_with':
                if (msg.content.endsWith(automod_rule.activation_keyword)) is_activated = true;
            case 'is_equal_to':
                if (msg.content.trim() == automod_rule.activation_keyword) is_activated = true;
        }
        if (is_activated) {
            channel.send(automod_rule.response);
            if (automod_rule.delete_target_message) {
                if (msg.deletable) {
                    await msg.delete();
                } else {
                    channel.send(getErrorEmbed('Eklerka dawaj permisje!', 'Albo zrobimy kolejny buncik! Bunt maszynek! Konpopoz dobrze zrobił.'));
                }
            }
            break;
        }
    }
}