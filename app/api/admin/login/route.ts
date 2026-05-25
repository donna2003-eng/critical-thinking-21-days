import { NextResponse } from "next/server";
import { isValidAdmin, setAdminSession } from "@/lib/admin-auth";
import { cleanText } from "@/lib/sanitize";

export async function POST(request: Request) {
  const body = await request.json();
  const name = cleanText(String(body.name || ""), 80);
  const password = String(body.password || "");

  if (!isValidAdmin(name, password)) {
    return NextResponse.json({ error: "管理员名称或密码不正确。" }, { status: 401 });
  }

  setAdminSession(name);
  return NextResponse.json({ ok: true });
}
