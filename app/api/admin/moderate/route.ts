import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const allowedTables = ["content_comments", "topic_comments", "topics"];

export async function DELETE(request: Request) {
  if (!requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const table = searchParams.get("table") || "";
  const id = searchParams.get("id");
  if (!allowedTables.includes(table) || !id) {
    return NextResponse.json({ error: "Invalid moderation target" }, { status: 400 });
  }
  const { error } = await createAdminClient().from(table).delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
