import { cleanText, isValidAdmin, json, makeSessionCookie } from "./_utils.js";

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));
  const name = cleanText(body.name, 80);
  const password = String(body.password || "");

  if (!(await isValidAdmin(name, password, env))) {
    return json({ error: "管理员名称或密码不正确。" }, 401);
  }

  return json({ ok: true }, 200, { "set-cookie": await makeSessionCookie(name, env) });
}
