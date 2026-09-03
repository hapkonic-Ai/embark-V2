import features from "../.backend-features.json";

type FeaturesFile = {
  version?: number;
  features?: string[];
  flags?: Record<string, boolean>;
};

const file = (features as FeaturesFile) ?? {};

function envDisabled(): string[] {
  try {
    if (typeof process !== "undefined" && process.env?.DISABLED_FEATURES) {
      return process.env.DISABLED_FEATURES.split(",").map((s: string) => s.trim()).filter(Boolean);
    }
  } catch {
    // ignore
  }
  try {
    const meta = import.meta as unknown as { env?: Record<string, string> };
    if (typeof import.meta !== "undefined" && meta.env?.VITE_DISABLED_FEATURES) {
      return meta.env.VITE_DISABLED_FEATURES.split(",").map((s) => s.trim()).filter(Boolean);
    }
  } catch {
    // ignore
  }
  return [];
}

const disabled = new Set(envDisabled());

export function isFeatureEnabled(name: string): boolean {
  if (disabled.has(name) || disabled.has("*")) return false;
  if (file.flags && name in file.flags) return file.flags[name] === true;
  return file.features?.includes(name) ?? false;
}

export const isExpertEnabled = () => isFeatureEnabled("expert");
