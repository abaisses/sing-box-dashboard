import type { TailscaleEndpointStatus, TailscalePeer } from "../gen/daemon/started_service_pb";

import { loadStoredJson, saveStoredJson } from "./storage";

export interface TailscaleSSHPrefs {
  username: string;
  terminalType: string;
  remember: boolean;
}

export interface SSHSessionOptions {
  endpointTag: string;
  peerAddress: string;
  peerName: string;
  username: string;
  terminalType: string;
  hostKeys: string[];
}

const SSH_PREFS_KEY = "sing-box-dashboard.tailscale-ssh";
export const SSH_DEFAULT_USERNAME = "root";
export const SSH_DEFAULT_TERMINAL_TYPE = "xterm-256color";

export function loadSSHPrefs(): Record<string, TailscaleSSHPrefs> {
  const parsed = loadStoredJson(SSH_PREFS_KEY);
  if (parsed && typeof parsed === "object") {
    return parsed as Record<string, TailscaleSSHPrefs>;
  }
  return {};
}

export function saveSSHPrefs(stableID: string, prefs: TailscaleSSHPrefs) {
  const map = loadSSHPrefs();
  map[stableID] = prefs;
  saveStoredJson(SSH_PREFS_KEY, map);
}

export function allPeers(endpoint: TailscaleEndpointStatus | undefined): TailscalePeer[] {
  return endpoint?.userGroups.flatMap((group) => group.peers) ?? [];
}

export function peerDisplayName(peer: TailscalePeer | undefined): string {
  if (!peer) {
    return "";
  }
  if (peer.dnsName !== "") {
    return peer.dnsName.split(".")[0];
  }
  return peer.hostName;
}

export function peerSSHAddress(peer: TailscalePeer): string {
  return (
    peer.tailscaleIPs.find((address) => !address.includes(":")) ??
    peer.tailscaleIPs[0] ??
    peer.dnsName
  );
}

export function peerSSHAvailable(peer: TailscalePeer): boolean {
  return peer.online && peer.sshHostKeys.length > 0 && peer.tailscaleIPs.length > 0;
}

export function buildSSHSession(
  endpointTag: string,
  peer: TailscalePeer,
  username: string,
  terminalType: string,
): SSHSessionOptions {
  return {
    endpointTag,
    peerAddress: peerSSHAddress(peer),
    peerName: peerDisplayName(peer),
    username,
    terminalType,
    hostKeys: peer.sshHostKeys,
  };
}
