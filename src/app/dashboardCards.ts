import type { IconName } from "../components/Icon";
import { loadStoredJson, saveStoredJson } from "../lib/storage";
import type { MessageKey } from "./translations";

export type DashboardCardId =
  | "uploadTraffic"
  | "downloadTraffic"
  | "status"
  | "connections"
  | "clashMode";

export const DASHBOARD_CARDS: Record<DashboardCardId, { title: MessageKey; icon: IconName }> = {
  uploadTraffic: { title: "Upload", icon: "upload" },
  downloadTraffic: { title: "Download", icon: "download" },
  status: { title: "Status", icon: "bug_report" },
  connections: { title: "Connections", icon: "cable" },
  clashMode: { title: "Clash Mode", icon: "route" },
};

export const DEFAULT_CARD_ORDER: DashboardCardId[] = [
  "uploadTraffic",
  "downloadTraffic",
  "status",
  "connections",
  "clashMode",
];

export interface DashboardCardsConfig {
  enabled: DashboardCardId[];
  order: DashboardCardId[];
}

const STORAGE_KEY = "sing-box-dashboard.dashboard-cards";

function isCardId(value: unknown): value is DashboardCardId {
  return typeof value === "string" && value in DASHBOARD_CARDS;
}

export function loadDashboardCardsConfig(): DashboardCardsConfig {
  const parsed = loadStoredJson(STORAGE_KEY) as Partial<DashboardCardsConfig> | null;
  if (parsed) {
    const enabled = (Array.isArray(parsed.enabled) ? parsed.enabled : []).filter(isCardId);
    let order = (Array.isArray(parsed.order) ? parsed.order : []).filter(isCardId);
    order = order.concat(DEFAULT_CARD_ORDER.filter((card) => !order.includes(card)));
    return { enabled, order };
  }
  return { enabled: [...DEFAULT_CARD_ORDER], order: [...DEFAULT_CARD_ORDER] };
}

export function saveDashboardCardsConfig(config: DashboardCardsConfig) {
  saveStoredJson(STORAGE_KEY, config);
}

export function resetDashboardCardsConfig(): DashboardCardsConfig {
  localStorage.removeItem(STORAGE_KEY);
  return { enabled: [...DEFAULT_CARD_ORDER], order: [...DEFAULT_CARD_ORDER] };
}

export function orderedEnabledCards(config: DashboardCardsConfig): DashboardCardId[] {
  return config.order.filter((card) => config.enabled.includes(card));
}

export function toggleCard(config: DashboardCardsConfig, card: DashboardCardId): DashboardCardsConfig {
  if (config.enabled.includes(card)) {
    return { ...config, enabled: config.enabled.filter((entry) => entry !== card) };
  }
  const enabled = orderedEnabledCards({ ...config, enabled: [...config.enabled, card] });
  return { ...config, enabled };
}

export function moveCard(
  config: DashboardCardsConfig,
  from: number,
  to: number,
): DashboardCardsConfig {
  const order = [...config.order];
  const [moved] = order.splice(from, 1);
  order.splice(to, 0, moved);
  return { ...config, order };
}
