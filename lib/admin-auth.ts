import { cookies } from "next/headers";
import { createHash, randomBytes, timingSafeEqual } from "crypto";

const cookieName = "ct_admin_session";

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function secret() {
  return process.env.ADMIN_SESSION_SECRET || "local-dev-secret-change-me";
}

function tokenFor(name: string) {
  return `${name}.${hash(`${name}:${secret()}`)}`;
}

export function isValidAdmin(name: string, password: string) {
  const admins = [
    [process.env.ADMIN_1_NAME, process.env.ADMIN_1_PASSWORD],
    [process.env.ADMIN_2_NAME, process.env.ADMIN_2_PASSWORD]
  ];

  return admins.some(([adminName, adminPassword]) => {
    if (!adminName || !adminPassword || adminName !== name) return false;
    const a = Buffer.from(hash(password));
    const b = Buffer.from(hash(adminPassword));
    return a.length === b.length && timingSafeEqual(a, b);
  });
}

export function setAdminSession(name: string) {
  cookies().set(cookieName, tokenFor(name), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  });
}

export function clearAdminSession() {
  cookies().delete(cookieName);
}

export function requireAdmin() {
  const raw = cookies().get(cookieName)?.value;
  if (!raw) return false;
  const [name] = raw.split(".");
  if (!name) return false;
  return raw === tokenFor(name);
}

export function makeProfileId() {
  return randomBytes(16).toString("hex");
}
