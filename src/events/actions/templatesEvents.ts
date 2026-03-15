import actionsManager from '@/features/actions/index.ts';
import { EmptyObject } from '../../defs.ts';
export default actionsManager;

export type ForceReloadTemplatesEventCtx = EmptyObject;

export const OnForceReloadTemplates = actionsManager.mkEvent('OnForceReloadTemplates');
