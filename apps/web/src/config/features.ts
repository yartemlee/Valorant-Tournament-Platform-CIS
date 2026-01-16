// Feature flags configuration

export const FEATURES = {
  /**
   * Enable Riot Sign On integration
   * Set VITE_RSO_ENABLED=true in .env to enable
   */
  RSO_ENABLED: import.meta.env.VITE_RSO_ENABLED === 'true',

  /**
   * Demo mode for RSO (creates mock accounts)
   * Set VITE_RSO_DEMO_MODE=true in .env to enable
   */
  RSO_DEMO_MODE: import.meta.env.VITE_RSO_DEMO_MODE === 'true',

  /**
   * Show official rank from Riot API
   * Depends on RSO being enabled
   */
  SHOW_OFFICIAL_RANK: import.meta.env.VITE_SHOW_OFFICIAL_RANK !== 'false',
} as const;

// Type for feature flag keys
export type FeatureFlag = keyof typeof FEATURES;

// Helper to check if a feature is enabled
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return FEATURES[flag];
}
