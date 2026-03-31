import { sessionManager } from "../../tracking/session-manager";


export const clearState = async () => {
    sessionManager.setSessionId(null);
}