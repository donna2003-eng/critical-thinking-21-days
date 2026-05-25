import { json, requireAdmin, supabaseFetch } from "./_utils.js";

async function list(env, path) {
  const { response, body } = await supabaseFetch(env, path, { method: "GET" });
  if (!response.ok) throw new Error(typeof body === "string" ? body : body?.message || "Supabase request failed");
  return body || [];
}

export async function onRequestGet({ request, env }) {
  if (!(await requireAdmin(request, env))) return json({ error: "Unauthorized" }, 401);

  try {
    const [contents, contentComments, topics, topicComments, signups] = await Promise.all([
      list(env, "course_contents?select=*&order=created_at.desc"),
      list(env, "content_comments?select=*&order=created_at.desc"),
      list(env, "topics?select=*&order=created_at.desc"),
      list(env, "topic_comments?select=*&order=created_at.desc"),
      list(env, "signups?select=*&order=updated_at.desc")
    ]);

    return json({ contents, contentComments, topics, topicComments, signups });
  } catch (error) {
    return json({ error: error.message }, 500);
  }
}
