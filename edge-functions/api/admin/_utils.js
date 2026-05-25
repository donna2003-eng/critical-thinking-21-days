const cookieName = "ct_admin_session";

function textEncoder() {
  return new TextEncoder();
}

async function sha256(value) {
  const buffer = await crypto.subtle.digest("SHA-256", textEncoder().encode(value));
  return Array.from(new Uint8Array(buffer)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function tokenFor(name, env) {
  const secret = env.ADMIN_SESSION_SECRET || "local-dev-secret-change-me";
  return `${name}.${await sha256(`${name}:${secret}`)}`;
}

function parseCookies(request) {
  const header = request.headers.get("cookie") || "";
  return Object.fromEntries(
    header
      .split(";")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const index = item.indexOf("=");
        return index === -1 ? [item, ""] : [item.slice(0, index), decodeURIComponent(item.slice(index + 1))];
      })
  );
}

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...headers
    }
  });
}

export async function isValidAdmin(name, password, env) {
  const admins = [
    [env.ADMIN_1_NAME, env.ADMIN_1_PASSWORD],
    [env.ADMIN_2_NAME, env.ADMIN_2_PASSWORD]
  ];

  return admins.some(([adminName, adminPassword]) => adminName && adminPassword && adminName === name && adminPassword === password);
}

export async function makeSessionCookie(name, env) {
  const token = await tokenFor(name, env);
  return `${cookieName}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=28800`;
}

export function clearSessionCookie() {
  return `${cookieName}=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0`;
}

export async function requireAdmin(request, env) {
  const raw = parseCookies(request)[cookieName];
  if (!raw) return false;
  const name = raw.split(".")[0];
  if (!name) return false;
  return raw === await tokenFor(name, env);
}

export function cleanText(value, maxLength = 2000) {
  return String(value || "")
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "")
    .trim()
    .slice(0, maxLength);
}

export async function supabaseFetch(env, path, init = {}) {
  const url = `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${path}`;
  const headers = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    "content-type": "application/json",
    ...init.headers
  };

  const response = await fetch(url, { ...init, headers });
  const text = await response.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  return { response, body };
}

export function encodeFilterValue(value) {
  return encodeURIComponent(String(value).replace(/"/g, ""));
}
