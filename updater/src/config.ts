import { maskSecret } from "./log.js";

export type UpdaterConfig = {
  youtubeApiKey: string;
  supabaseRestUrl: string;
  supabaseServiceKey: string;
  supabaseSchema: string;
  cfDeployHookUrl: string;
  kumaPushUrl: string;
  updaterMaxQuotaUnits: number;
  updaterLookbackDays: number;
  updaterPerChannelMax: number;
};

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function optionalEnv(name: string) {
  return process.env[name] || "";
}

function parsePositiveInt(name: string, fallback: number) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Invalid positive integer for ${name}: ${raw}`);
  }
  return value;
}

type LoadConfigOptions = {
  requireNotifications?: boolean;
  requireSupabase?: boolean;
  requireYouTube?: boolean;
};

export function loadConfig(options: LoadConfigOptions = {}): UpdaterConfig {
  const requireNotifications = options.requireNotifications ?? true;
  const requireSupabase = options.requireSupabase ?? true;
  const requireYouTube = options.requireYouTube ?? true;

  return {
    youtubeApiKey: requireYouTube ? requireEnv("YOUTUBE_API_KEY") : optionalEnv("YOUTUBE_API_KEY"),
    supabaseRestUrl: requireSupabase ? requireEnv("SUPABASE_REST_URL") : optionalEnv("SUPABASE_REST_URL"),
    supabaseServiceKey: requireSupabase ? requireEnv("SUPABASE_SERVICE_KEY") : optionalEnv("SUPABASE_SERVICE_KEY"),
    supabaseSchema: process.env.SUPABASE_SCHEMA || "cox7",
    cfDeployHookUrl: requireNotifications ? requireEnv("CF_DEPLOY_HOOK_URL") : optionalEnv("CF_DEPLOY_HOOK_URL"),
    kumaPushUrl: requireNotifications ? requireEnv("KUMA_PUSH_URL") : optionalEnv("KUMA_PUSH_URL"),
    updaterMaxQuotaUnits: parsePositiveInt("UPDATER_MAX_QUOTA_UNITS", 2000),
    updaterLookbackDays: parsePositiveInt("UPDATER_LOOKBACK_DAYS", 120),
    updaterPerChannelMax: parsePositiveInt("UPDATER_PER_CHANNEL_MAX", 25)
  };
}

export function publicConfig(config: UpdaterConfig) {
  return {
    ...config,
    youtubeApiKey: maskSecret(config.youtubeApiKey),
    supabaseServiceKey: maskSecret(config.supabaseServiceKey),
    cfDeployHookUrl: maskSecret(config.cfDeployHookUrl),
    kumaPushUrl: maskSecret(config.kumaPushUrl)
  };
}
