import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  if (!requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createAdminClient();
  const [contents, contentComments, topics, topicComments, signups] = await Promise.all([
    supabase.from("course_contents").select("*").order("created_at", { ascending: false }),
    supabase.from("content_comments").select("*").order("created_at", { ascending: false }),
    supabase.from("topics").select("*").order("created_at", { ascending: false }),
    supabase.from("topic_comments").select("*").order("created_at", { ascending: false }),
    supabase.from("signups").select("*").order("updated_at", { ascending: false })
  ]);

  return NextResponse.json({
    contents: contents.data || [],
    contentComments: contentComments.data || [],
    topics: topics.data || [],
    topicComments: topicComments.data || [],
    signups: signups.data || []
  });
}
