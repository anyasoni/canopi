const COMMODITY_ICONS: Record<string, string> = {
  "palm-oil": "🌴",
  cocoa: "🍫",
  soy: "🌱",
  coffee: "☕",
  tea: "🍵",
  "dairy-feed": "🐄",
};

const DEFAULT_COMMODITY_ICON = "🌿";

export const commodityIconForId = (commodityId: string): string =>
  COMMODITY_ICONS[commodityId] ?? DEFAULT_COMMODITY_ICON;
