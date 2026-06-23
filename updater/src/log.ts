type LogLevel = "info" | "warn" | "error";

type LogPayload = {
  level: LogLevel;
  msg: string;
  channel?: string;
  counts?: Record<string, number | null | undefined>;
  quota?: number;
  durationMs?: number;
  error?: string;
};

export function log(payload: LogPayload) {
  process.stdout.write(`${JSON.stringify({ ts: new Date().toISOString(), ...payload })}\n`);
}

export function maskSecret(value: string | undefined) {
  if (!value) {
    return "(unset)";
  }

  if (value.length <= 8) {
    return "***";
  }

  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}
