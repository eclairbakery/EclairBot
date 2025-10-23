import * as dsc from 'discord.js';

import { Command, CommandFlags } from "@/bot/command.js";
import { BlockCommandsRules, cfg } from '@/bot/cfg.js';

function isBlockedByRules(id: dsc.Snowflake, rules: BlockCommandsRules): boolean {
    if (rules.default == 'allow') {
        return rules.deny?.includes(id) ?? false;
    } else if (rules.default == 'block') {
        return !(rules.allow?.includes(id) ?? false);
    }
    // this should not happen
    return false;
}

export default function isCommandBlockedOnChannel(command: Command, channelID: dsc.Snowflake) {
   let result: boolean = false;

   if (command.flags & CommandFlags.Important)
       result ||= isBlockedByRules(channelID, cfg.blockCommands.fullExceptImportant);
   else
       result ||= isBlockedByRules(channelID, cfg.blockCommands.full);

   if (command.flags & CommandFlags.Spammy)
       result ||= isBlockedByRules(channelID, cfg.blockCommands.spammy);

   if (command.flags & CommandFlags.Economy)
       result ||= isBlockedByRules(channelID, cfg.blockCommands.economy);

   return result;
}
