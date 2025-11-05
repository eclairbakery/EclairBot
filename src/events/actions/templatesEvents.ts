import actionsManager from '@/features/actions/index.js';
export default actionsManager;

export interface ForceReloadTemplatesEventCtx {

};

export const OnForceReloadTemplates = actionsManager.mkEvent('OnForceReloadTemplates');