import actionsManager from "@/features/actions/index.ts";
export default actionsManager;

export interface ForceReloadTemplatesEventCtx {
}

export const OnForceReloadTemplates = actionsManager.mkEvent("OnForceReloadTemplates");
