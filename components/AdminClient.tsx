"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { contentTypeLabels, topicCategoryLabels, weekdays } from "@/lib/constants";
import type { ContentComment, CourseContent, CourseContentType, Signup, Topic, TopicComment } from "@/lib/types";

type AdminData = {
  contents: CourseContent[];
  contentComments: ContentComment[];
  topics: Topic[];
  topicComments: TopicComment[];
  signups: Signup[];
};

const emptyData: AdminData = { contents: [], contentComments: [], topics: [], topicComments: [], signups: [] };

export default function AdminClient() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [data, setData] = useState<AdminData>(emptyData);
  const [editing, setEditing] = useState<CourseContent | null>(null);
  const [message, setMessage] = useState("");

  async function load() {
    const response = await fetch("/api/admin/data");
    if (response.status === 401) {
      setLoggedIn(false);
      return;
    }
    const next = await response.json();
    setData(next);
    setLoggedIn(true);
  }

  useEffect(() => {
    load();
  }, []);

  async function login(event: FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, password })
    });
    if (!response.ok) {
      const body = await response.json();
      setMessage(body.error || "登录失败。");
      return;
    }
    setPassword("");
    setMessage("");
    load();
  }

  async function saveContent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const payload = {
      id: editing?.id,
      title: String(form.get("title") || ""),
      body: String(form.get("body") || ""),
      type: String(form.get("type") || "tool") as CourseContentType
    };
    const response = await fetch("/api/admin/contents", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (response.ok) {
      formElement.reset();
      setEditing(null);
      load();
    }
  }

  async function removeContent(id: string) {
    await fetch(`/api/admin/contents?id=${id}`, { method: "DELETE" });
    load();
  }

  async function moderate(table: string, id: string) {
    await fetch(`/api/admin/moderate?table=${table}&id=${id}`, { method: "DELETE" });
    load();
  }

  if (!loggedIn) {
    return (
      <main className="min-h-screen bg-paper px-4 py-10">
        <form className="mx-auto grid max-w-md gap-4 rounded-lg border border-ink/10 bg-white p-6 shadow-soft" onSubmit={login}>
          <Link className="text-sm text-ink/60" href="/">返回首页</Link>
          <h1 className="text-2xl font-semibold">管理员登录</h1>
          <input className="focus-ring rounded-md border border-ink/15 px-3 py-2" value={name} onChange={(event) => setName(event.target.value)} placeholder="管理员名称" />
          <input className="focus-ring rounded-md border border-ink/15 px-3 py-2" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="管理员密码" type="password" />
          {message && <p className="text-sm text-clay">{message}</p>}
          <button className="focus-ring rounded-md bg-ink px-4 py-2 font-semibold text-white" type="submit">登录</button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-paper px-4 py-8">
      <div className="mx-auto grid max-w-6xl gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <Link className="text-sm text-ink/60" href="/">返回首页</Link>
            <h1 className="mt-2 text-3xl font-semibold">管理员后台</h1>
          </div>
          <button className="focus-ring rounded-md border border-ink/15 px-4 py-2 text-sm" onClick={async () => { await fetch("/api/admin/logout", { method: "POST" }); setLoggedIn(false); }} type="button">退出</button>
        </div>

        <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
          <h2 className="text-xl font-semibold">{editing ? "编辑内容" : "添加工具 / 方法 / 案例"}</h2>
          <form className="mt-4 grid gap-3" onSubmit={saveContent}>
            <select className="focus-ring rounded-md border border-ink/15 px-3 py-2" name="type" defaultValue={editing?.type || "tool"} key={editing?.id || "new-type"}>
              {Object.entries(contentTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <input className="focus-ring rounded-md border border-ink/15 px-3 py-2" name="title" placeholder="标题" defaultValue={editing?.title || ""} key={editing?.id || "new-title"} />
            <textarea className="focus-ring min-h-36 rounded-md border border-ink/15 px-3 py-2" name="body" placeholder="正文" defaultValue={editing?.body || ""} key={editing?.id || "new-body"} />
            <div className="flex gap-2">
              <button className="focus-ring rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white" type="submit">保存</button>
              {editing && <button className="focus-ring rounded-md border border-ink/15 px-4 py-2 text-sm" onClick={() => setEditing(null)} type="button">取消编辑</button>}
            </div>
          </form>
        </section>

        <section className="grid gap-3 rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
          <h2 className="text-xl font-semibold">已发布内容</h2>
          {data.contents.map((item) => (
            <div className="rounded-md border border-ink/10 p-4" key={item.id}>
              <p className="text-xs font-semibold text-tea">{contentTypeLabels[item.type]}</p>
              <h3 className="mt-1 font-semibold">{item.title}</h3>
              <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-ink/65">{item.body}</p>
              <div className="mt-3 flex gap-2">
                <button className="focus-ring rounded-md border border-ink/15 px-3 py-1.5 text-sm" onClick={() => setEditing(item)} type="button">编辑</button>
                <button className="focus-ring rounded-md border border-clay/30 px-3 py-1.5 text-sm text-clay" onClick={() => removeContent(item.id)} type="button">删除</button>
              </div>
            </div>
          ))}
        </section>

        <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
          <h2 className="text-xl font-semibold">接龙和问题收集结果</h2>
          <div className="mt-4 grid gap-3">
            {data.signups.map((item) => (
              <div className="rounded-md border border-ink/10 p-3 text-sm" key={item.id}>
                <p className="font-semibold">{item.nickname}：{weekdays.filter((day) => item.days.includes(day)).join("、")}</p>
                <p className="mt-1 whitespace-pre-wrap text-ink/65">{item.question || "无疑问或期待"}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-3 rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
          <h2 className="text-xl font-semibold">评论管理</h2>
          {[...data.contentComments.map((item) => ({ ...item, table: "content_comments", label: "模块2评论" })), ...data.topicComments.map((item) => ({ ...item, table: "topic_comments", label: "话题评论" }))].map((item) => (
            <div className="rounded-md border border-ink/10 p-3 text-sm" key={`${item.table}-${item.id}`}>
              <p className="font-semibold">{item.label} / {item.nickname}</p>
              <p className="mt-1 whitespace-pre-wrap text-ink/65">{item.body}</p>
              <button className="focus-ring mt-2 rounded-md border border-clay/30 px-3 py-1.5 text-clay" onClick={() => moderate(item.table, item.id)} type="button">删除</button>
            </div>
          ))}
        </section>

        <section className="grid gap-3 rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
          <h2 className="text-xl font-semibold">话题管理</h2>
          {data.topics.map((item) => (
            <div className="rounded-md border border-ink/10 p-3 text-sm" key={item.id}>
              <p className="font-semibold">{topicCategoryLabels[item.category]} / {item.is_anonymous ? "匿名用户" : item.nickname}</p>
              <h3 className="mt-1 font-semibold">{item.title}</h3>
              <p className="mt-1 whitespace-pre-wrap text-ink/65">{item.body}</p>
              <button className="focus-ring mt-2 rounded-md border border-clay/30 px-3 py-1.5 text-clay" onClick={() => moderate("topics", item.id)} type="button">删除</button>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
