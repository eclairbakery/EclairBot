import * as dsc from 'discord.js';

import { Command } from '@/bot/command.ts';
import { CommandFlags } from '@/bot/apis/commands/misc.ts';
import { BlockCommandsRules } from '@/bot/definitions/config/subtypes.ts';
import { cfg } from '@/bot/cfg.ts';

function isBlockedByRules(id: dsc.Snowflake, rules: BlockCommandsRules): boolean {
    if (rules.default == 'allow') {
        return rules.deny?.includes(id) ?? false;
    } else if (rules.default == 'block') {
        return !(rules.allow?.includes(id) ?? false);
    }
    // this should not happen
    return false;
}

export default function isCommandBlockedOnChannel(command: Command, channelID: dsc.Snowflake, dm: boolean) {
    if (dm) return false;

    let result: boolean = false;

    if (command.flags & CommandFlags.Important) {
        result ||= isBlockedByRules(channelID, cfg.commands.blocking.fullExceptImportant);
    } else {
        result ||= isBlockedByRules(channelID, cfg.commands.blocking.full);
    }

    if (command.flags & CommandFlags.Spammy) {
        result ||= isBlockedByRules(channelID, cfg.commands.blocking.spammy);
    }

    if (command.flags & CommandFlags.Economy) {
        result ||= isBlockedByRules(channelID, cfg.commands.blocking.economy);
    }

    return result;
}
