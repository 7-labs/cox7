type PgrstRequestInit = {
  body?: BodyInit | null;
  headers?: HeadersInit;
  key?: string;
  method?: string;
  revalidate?: number;
};

function getRestUrl() {
  return process.env.SUPABASE_REST_URL?.replace(/\/$/, "") || null;
}

function getAnonKey() {
  return process.env.SUPABASE_ANON_KEY || null;
}

function getSchema() {
  return process.env.SUPABASE_SCHEMA || "cox7";
}

function buildHeaders(key: string, headers?: HeadersInit) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Accept-Profile": getSchema(),
    "Content-Profile": getSchema(),
    Accept: "application/json",
    ...headers
  };
}

async function readErrorBody(response: Response) {
  const text = await response.text();
  return text || response.statusText;
}

export function isSupabaseConfigured() {
  return Boolean(getRestUrl() && getAnonKey());
}

export async function pgrstFetch(pathAndQuery: string, init: PgrstRequestInit = {}) {
  const rest = getRestUrl();
  if (!rest) {
    throw new Error("SUPABASE_REST_URL unset");
  }

  const key = init.key || getAnonKey();
  if (!key) {
    throw new Error("SUPABASE_ANON_KEY unset");
  }

  const requestInit: RequestInit & {
    next?: {
      revalidate: number;
    };
  } = {
    method: init.method || "GET",
    body: init.body,
    headers: buildHeaders(key, init.headers),
    cache: init.revalidate == null ? "no-store" : undefined,
    next: init.revalidate != null ? { revalidate: init.revalidate } : undefined
  };

  const response = await fetch(`${rest}/${pathAndQuery.replace(/^\/+/, "")}`, requestInit);

  return response;
}

export async function pgrstGet<T>(pathAndQuery: string, init: Omit<PgrstRequestInit, "method"> = {}): Promise<T> {
  const response = await pgrstFetch(pathAndQuery, init);

  if (!response.ok) {
    throw new Error(`PostgREST ${response.status}: ${await readErrorBody(response)}`);
  }

  if (response.status === 204) {
    return [] as unknown as T;
  }

  return response.json() as Promise<T>;
}

export async function pgrstHead(pathAndQuery: string, init: Omit<PgrstRequestInit, "method" | "body"> = {}) {
  const response = await pgrstFetch(pathAndQuery, {
    ...init,
    method: "HEAD"
  });

  if (!response.ok) {
    throw new Error(`PostgREST ${response.status}: ${await readErrorBody(response)}`);
  }

  return response;
}

export async function pgrstCount(pathAndQuery: string, init: Omit<PgrstRequestInit, "method"> = {}) {
  const response = await pgrstFetch(pathAndQuery, {
    ...init,
    headers: {
      Prefer: "count=exact",
      Range: "0-0",
      ...init.headers
    }
  });

  if (!response.ok) {
    throw new Error(`PostgREST ${response.status}: ${await readErrorBody(response)}`);
  }

  const contentRange = response.headers.get("content-range");
  if (!contentRange) {
    return 0;
  }

  const [, total] = contentRange.split("/");
  return Number.parseInt(total || "0", 10) || 0;
}
