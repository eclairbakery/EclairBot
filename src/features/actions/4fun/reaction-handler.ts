import { Action, PredefinedActionEventTypes, ReactionEventCtx } from '@/features/actions/index.ts';
import User from '@/bot/apis/db/user.ts';
import { cfg } from '@/bot/cfg.ts';
import { output } from '@/bot/logging.ts';

function reactionMain(metadata: {
    givenBy: User,
    givenTo: User,
    reaction: string,
    removed: boolean
}) {
    output.verbose("Reaction handler: reaction metadata: " + JSON.stringify(metadata));

    const allReactions = [...cfg.features.prestige.reactions.negative, ...cfg.features.prestige.reactions.positive];
    if (!allReactions.includes(metadata.reaction)) {
        output.verbose(`Reaction handler: ${metadata.reaction} not in ${allReactions}`);
        return;
    }

    if (metadata.givenBy.id == metadata.givenTo.id) {
        //return;
    }

    const points = cfg.features.prestige.reactions.pointsPerReaction; 
    
    if (cfg.features.prestige.reactions.positive.includes(metadata.reaction) && !metadata.removed)
        metadata.givenTo.prestige.addPoints(points);
    else if (cfg.features.prestige.reactions.positive.includes(metadata.reaction) && metadata.removed)
        metadata.givenTo.prestige.removePoints(points);
    else if (cfg.features.prestige.reactions.negative.includes(metadata.reaction) && !metadata.removed)
        metadata.givenTo.prestige.removePoints(points);
    else if (cfg.features.prestige.reactions.negative.includes(metadata.reaction) && metadata.removed)
        metadata.givenTo.prestige.addPoints(points);
}

export const reactionAddHandler: Action<ReactionEventCtx> = {
    name: '4fun/reaction-handler-ad',
    activatesOn: PredefinedActionEventTypes.OnMessageReactionAdd,
    worksOutsideGuild: false, 

    constraints: [ () => true ],
    callbacks: [ 
        (reaction) => reactionMain({
            givenBy: new User(reaction.user.id),
            givenTo: new User(reaction.reaction.message.author?.id ?? cfg.hierarchy.developers.allowedUsers[0]),
            reaction: reaction.reaction.emoji.name ?? '', removed: false
        }) 
    ]
};

export const reactionRemoveHandler: Action<ReactionEventCtx> = {
    name: '4fun/reaction-handler-rm',
    activatesOn: PredefinedActionEventTypes.OnMessageReactionRemove,
    worksOutsideGuild: false, 

    constraints: [ () => true ],
    callbacks: [ 
        (reaction) => reactionMain({
            givenBy: new User(reaction.user.id),
            givenTo: new User(reaction.reaction.message.author?.id ?? cfg.hierarchy.developers.allowedUsers[0]),
            reaction: reaction.reaction.emoji.name ?? '', removed: true
        }) 
    ]
};
