import * as dsc from 'discord.js';

import { Command, CommandFlags } from "@/bot/command.js";
import { BlockCommandsRules } from '@/bot/definitions/config-subtypes.js';
import { cfg } from '@/bot/cfg.js';

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

   // this is confusing so i'll document it
   //  cfg.blockCommands.fullExceptImportant allows important cmds on some channels
   //  or maybe not
   //  who knows
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
