import * as dsc from 'discord.js';
import * as log from '../util/log.js';

interface AutomodRules {
    activationType: 'contains' | 'is_equal_to' | 'starts_with' | 'ends_with';
    activationKeyword: string;
    response: string;
    deleteTargetMessage: boolean;
}

export async function automod(msg: dsc.OmitPartialGroupDMChannel<dsc.Message<boolean>>, client: dsc.Client) {
    const channel = (await client.channels.fetch(msg.channelId)) as dsc.Channel;
    if (!channel.isSendable()) return;
    const automodRules: AutomodRules[] = [
        // the most important go first
        {
            activationType: 'contains',
            activationKeyword: '@everyone',
            response: 'Pan piekarz, czy tam Eklerka będzie zły...',
            deleteTargetMessage: true,
        },
        {
            activationType: 'contains',
            activationKeyword: '@here',
            response: 'Może Eklerka nie będzie aż tak zły, jak w przypadku **małpa** everyone, ale i tak będzie zły...',
            deleteTargetMessage: true,
        },
        // fuck invites
        {
            activationType: 'starts_with',
            activationKeyword: '.gg/',
            deleteTargetMessage: true,
            response: 'Wypier*alaj ze swoją reklamą na serwery reklamowe ;)',
        },
        {
            activationType: 'contains',
            activationKeyword: 'discord.gg/',
            deleteTargetMessage: true,
            response: 'Wypier*alaj ze swoją reklamą na serwery reklamowe ;)',
        },
        {
            activationType: 'contains',
            activationKeyword: 'discord.com/invite/',
            deleteTargetMessage: true,
            response: 'Wypier*alaj ze swoją reklamą na serwery reklamowe ;)',
        },
        // nword
        {
            activationType: 'contains',
            activationKeyword: 'nigger',
            deleteTargetMessage: false,
            response: "osoba nade mną jest gejem 🥀"
        },
        // censorship i guess
        {
            activationType: 'contains',
            activationKeyword: 'anime',
            deleteTargetMessage: false,
            response: "osoba nade mną jest gejem 🥀"
        },
        // then go the least important
        {
            activationType: 'is_equal_to',
            activationKeyword: 'kiedy odcinek',
            response: 'nigdy - powiedział StartIT, ale ponieważ startit jest jebanym gównem no to spinguj eklerke by odpowiedział',
            deleteTargetMessage: false,
        },
    ];
    let actionedBefore = false;
    let deletedMsg = false;
    for (const automodRule of automodRules) {
        // there is a foreach method, but it's objectivelly worse in this case
        let isActivated = false;
        switch (automodRule.activationType) {
            case 'contains':
                if (msg.content.includes(automodRule.activationKeyword)) isActivated = true;
            case 'starts_with':
                if (msg.content.startsWith(automodRule.activationKeyword)) isActivated = true;
            case 'ends_with':
                if (msg.content.endsWith(automodRule.activationKeyword)) isActivated = true;
            case 'is_equal_to':
                if (msg.content.trim() === automodRule.activationKeyword) isActivated = true;
        }
        if (isActivated) {
            if (actionedBefore == false) channel.send(automodRule.response);
            if (automodRule.deleteTargetMessage) {
                if (msg.deletable) {
                    if (actionedBefore == false) {
                        await msg.delete();
                        deletedMsg = true;
                    }
                } else {
                    log.replyError(msg, 'Eklerka dawaj permisje!', 'Albo zrobimy kolejny buncik! Bunt maszynek! Konpopoz dobrze zrobił.');
                }
            }
            actionedBefore = true;
        }
    }
    return deletedMsg;
}
