import type { UpdaterConfig } from "./config.js";

async function post(url: string, init: RequestInit = {}) {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`Notify request failed with ${response.status}`);
  }
}

export async function pingKuma(config: UpdaterConfig, status: "up" | "down", message: string) {
  if (!config.kumaPushUrl) return; // heartbeat optional
  const url = new URL(config.kumaPushUrl);
  url.searchParams.set("status", status);
  url.searchParams.set("msg", message);
  url.searchParams.set("ping", new Date().toISOString());
  await post(url.toString(), { method: "GET" });
}

export async function triggerDeployHook(config: UpdaterConfig) {
  if (!config.cfDeployHookUrl) return; // deploy hook optional (Worker reads inventory at runtime)
  await post(config.cfDeployHookUrl, {
    method: "POST"
  });
}
