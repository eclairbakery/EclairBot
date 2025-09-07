import actionsManager from '@/features/actions.js';
export default actionsManager;

export interface ForceReloadTemplatesEventCtx {

};

export const OnForceReloadTemplates = actionsManager.mkEvent('OnForceReloadTemplates');