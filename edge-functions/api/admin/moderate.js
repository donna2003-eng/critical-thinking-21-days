import { encodeFilterValue, json, requireAdmin, supabaseFetch } from "./_utils.js";

const allowedTables = ["content_comments", "topic_comments", "topics"];

export async function onRequestDelete({ request, env }) {
  if (!(await requireAdmin(request, env))) return json({ error: "Unauthorized" }, 401);
  const params = new URL(request.url).searchParams;
  const table = params.get("table") || "";
  const id = params.get("id");
  if (!allowedTables.includes(table) || !id) return json({ error: "Invalid moderation target" }, 400);

  const { response, body } = await supabaseFetch(env, `${table}?id=eq.${encodeFilterValue(id)}`, {
    method: "DELETE",
    headers: { prefer: "return=minimal" }
  });
  if (!response.ok) return json({ error: body?.message || body || "Supabase delete failed" }, 500);
  return json({ ok: true });
}
