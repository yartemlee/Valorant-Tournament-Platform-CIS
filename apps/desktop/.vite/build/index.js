"use strict";
const electron = require("electron");
const IPC_CHANNELS = {
  // Valorant API channels
  VALORANT_GET_STATUS: "valorant:get-status",
  VALORANT_GET_LOBBY: "valorant:get-lobby",
  VALORANT_GET_MATCH_STATS: "valorant:get-match-stats",
  VALORANT_STATUS_CHANGED: "valorant:status-changed",
  VALORANT_LOBBY_DETECTED: "valorant:lobby-detected",
  VALORANT_MATCH_STARTED: "valorant:match-started",
  VALORANT_MATCH_COMPLETED: "valorant:match-completed",
  // Supabase sync channels
  VALORANT_SYNC_SUPABASE: "valorant:sync-supabase",
  VALORANT_SYNC_STATUS: "valorant:sync-status",
  // LFG Party Management channels
  LFG_GET_PARTY_INFO: "lfg:get-party-info",
  LFG_GENERATE_PARTY_CODE: "lfg:generate-party-code",
  LFG_JOIN_PARTY_BY_CODE: "lfg:join-party-by-code",
  LFG_INVITE_TO_PARTY: "lfg:invite-to-party",
  LFG_CHANGE_QUEUE: "lfg:change-queue",
  LFG_PARTY_CODE_GENERATED: "lfg:party-code-generated",
  LFG_PARTY_JOIN_RESULT: "lfg:party-join-result",
  // Desktop Sync channels
  DESKTOP_HEARTBEAT: "desktop:heartbeat",
  DESKTOP_STATUS_CHANGED: "desktop:status-changed",
  DESKTOP_START_SYNC: "desktop:start-sync",
  DESKTOP_STOP_SYNC: "desktop:stop-sync",
  // App lifecycle channels
  APP_GET_VERSION: "app:get-version",
  APP_QUIT: "app:quit",
  APP_MINIMIZE: "app:minimize",
  APP_MAXIMIZE: "app:maximize",
  APP_CLOSE: "app:close"
};
function invoke(channel, data) {
  return electron.ipcRenderer.invoke(channel, data);
}
function on(channel, listener) {
  const wrappedListener = (_event, data) => {
    listener(data);
  };
  electron.ipcRenderer.on(channel, wrappedListener);
  return () => {
    electron.ipcRenderer.removeListener(channel, wrappedListener);
  };
}
const valorantApi = {
  // Query methods
  getGameStatus: () => invoke(IPC_CHANNELS.VALORANT_GET_STATUS),
  getLobbyInfo: () => invoke(IPC_CHANNELS.VALORANT_GET_LOBBY),
  getMatchStats: (matchId) => invoke(IPC_CHANNELS.VALORANT_GET_MATCH_STATS, { matchId }),
  // Sync methods
  syncToSupabase: (force) => invoke(IPC_CHANNELS.VALORANT_SYNC_SUPABASE, { force }),
  // Event listeners
  onStatusChange: (callback) => on(IPC_CHANNELS.VALORANT_STATUS_CHANGED, callback),
  onLobbyDetected: (callback) => on(IPC_CHANNELS.VALORANT_LOBBY_DETECTED, callback),
  onMatchStarted: (callback) => on(IPC_CHANNELS.VALORANT_MATCH_STARTED, callback),
  onMatchCompleted: (callback) => on(IPC_CHANNELS.VALORANT_MATCH_COMPLETED, callback),
  onSyncStatus: (callback) => on(IPC_CHANNELS.VALORANT_SYNC_STATUS, callback)
};
const appApi = {
  getVersion: () => invoke(IPC_CHANNELS.APP_GET_VERSION),
  quit: () => invoke(IPC_CHANNELS.APP_QUIT),
  minimize: () => invoke(IPC_CHANNELS.APP_MINIMIZE),
  maximize: () => invoke(IPC_CHANNELS.APP_MAXIMIZE),
  close: () => invoke(IPC_CHANNELS.APP_CLOSE)
};
const lfgApi = {
  // Party management
  getPartyInfo: () => invoke(IPC_CHANNELS.LFG_GET_PARTY_INFO),
  generatePartyCode: () => invoke(IPC_CHANNELS.LFG_GENERATE_PARTY_CODE),
  joinPartyByCode: (code) => invoke(IPC_CHANNELS.LFG_JOIN_PARTY_BY_CODE, { code }),
  inviteToParty: (gameName, tagLine) => invoke(IPC_CHANNELS.LFG_INVITE_TO_PARTY, { gameName, tagLine }),
  changeQueue: (queueId) => invoke(IPC_CHANNELS.LFG_CHANGE_QUEUE, { queueId }),
  // Desktop sync
  startSync: (supabaseToken, supabaseUrl, supabaseAnonKey) => invoke(IPC_CHANNELS.DESKTOP_START_SYNC, { supabaseToken, supabaseUrl, supabaseAnonKey }),
  stopSync: () => invoke(IPC_CHANNELS.DESKTOP_STOP_SYNC),
  // Event listeners
  onPartyCodeGenerated: (callback) => on(IPC_CHANNELS.LFG_PARTY_CODE_GENERATED, callback),
  onPartyJoinResult: (callback) => on(IPC_CHANNELS.LFG_PARTY_JOIN_RESULT, callback),
  onHeartbeat: (callback) => on(IPC_CHANNELS.DESKTOP_HEARTBEAT, callback),
  onStatusChanged: (callback) => on(IPC_CHANNELS.DESKTOP_STATUS_CHANGED, callback)
};
electron.contextBridge.exposeInMainWorld("valorantApi", valorantApi);
electron.contextBridge.exposeInMainWorld("appApi", appApi);
electron.contextBridge.exposeInMainWorld("lfgApi", lfgApi);
console.log("[Preload] APIs exposed successfully");
//# sourceMappingURL=index.js.map
