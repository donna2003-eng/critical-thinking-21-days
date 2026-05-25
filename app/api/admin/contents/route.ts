import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { cleanText } from "@/lib/sanitize";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CourseContentType } from "@/lib/types";

const types = ["tool", "method", "case"];

export async function POST(request: Request) {
  if (!requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const type = types.includes(body.type) ? (body.type as CourseContentType) : "tool";
  const payload = {
    type,
    title: cleanText(String(body.title || ""), 120),
    body: cleanText(String(body.body || ""), 5000)
  };
  if (!payload.title || !payload.body) return NextResponse.json({ error: "标题和正文不能为空。" }, { status: 400 });

  const { error } = await createAdminClient().from("course_contents").insert(payload);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function PUT(request: Request) {
  if (!requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const type = types.includes(body.type) ? (body.type as CourseContentType) : "tool";
  const { error } = await createAdminClient()
    .from("course_contents")
    .update({
      type,
      title: cleanText(String(body.title || ""), 120),
      body: cleanText(String(body.body || ""), 5000)
    })
    .eq("id", String(body.id || ""));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  if (!requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const { error } = await createAdminClient().from("course_contents").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
