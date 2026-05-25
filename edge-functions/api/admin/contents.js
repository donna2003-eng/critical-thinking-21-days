import { cleanText, encodeFilterValue, json, requireAdmin, supabaseFetch } from "./_utils.js";

const types = ["tool", "method", "case"];

function payloadFrom(body) {
  return {
    type: types.includes(body.type) ? body.type : "tool",
    title: cleanText(body.title, 120),
    body: cleanText(body.body, 5000)
  };
}

export async function onRequestPost({ request, env }) {
  if (!(await requireAdmin(request, env))) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => ({}));
  const payload = payloadFrom(body);
  if (!payload.title || !payload.body) return json({ error: "标题和正文不能为空。" }, 400);

  const { response, body: result } = await supabaseFetch(env, "course_contents", {
    method: "POST",
    headers: { prefer: "return=minimal" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) return json({ error: result?.message || result || "Supabase insert failed" }, 500);
  return json({ ok: true });
}

export async function onRequestPut({ request, env }) {
  if (!(await requireAdmin(request, env))) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => ({}));
  const id = cleanText(body.id, 80);
  const payload = payloadFrom(body);
  if (!id) return json({ error: "Missing id" }, 400);

  const { response, body: result } = await supabaseFetch(env, `course_contents?id=eq.${encodeFilterValue(id)}`, {
    method: "PATCH",
    headers: { prefer: "return=minimal" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) return json({ error: result?.message || result || "Supabase update failed" }, 500);
  return json({ ok: true });
}

export async function onRequestDelete({ request, env }) {
  if (!(await requireAdmin(request, env))) return json({ error: "Unauthorized" }, 401);
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return json({ error: "Missing id" }, 400);

  const { response, body } = await supabaseFetch(env, `course_contents?id=eq.${encodeFilterValue(id)}`, {
    method: "DELETE",
    headers: { prefer: "return=minimal" }
  });
  if (!response.ok) return json({ error: body?.message || body || "Supabase delete failed" }, 500);
  return json({ ok: true });
}
