import { Command } from '../../bot/command.js';
import { db } from '../../bot/db.js';

import * as log from '../../util/log.js';
import * as dsc from 'discord.js';
import { PredefinedColors } from '../../util/color.js';
import { cfg } from '../../bot/cfg.js';

import actionsManager, { OnForceReloadTemplates, ForceReloadTemplatesEventCtx } from '../../events/templatesEvents.js';
import { Action, ConstraintCallback, ActionEventType, MessageEventCtx, PredefinedActionEventTypes, AnyConstraintCallback } from '../../features/actions.js';

// export interface NotifyTarget {
//     type: 'role' | 'user';
//     id: dsc.Snowflake;
//     automatic?: {
//         inAction?: {z
//             eventType: ActionEventType;
//             constraints: AnyConstraintCallback[];
//         };
//     };
// };