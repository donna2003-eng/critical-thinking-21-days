"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Avatar } from "./Avatar";
import ProfileGate from "./ProfileGate";
import { blindBoxLines, contentTypeLabels, topicCategoryLabels, weekdays } from "@/lib/constants";
import { cleanText } from "@/lib/sanitize";
import { supabase } from "@/lib/supabase/client";
import type { ContentComment, CourseContent, Profile, Signup, Topic, TopicCategory, TopicComment } from "@/lib/types";

function formatTime(value: string) {
  return new Date(value).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function HomeClient() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [signups, setSignups] = useState<Signup[]>([]);
  const [contents, setContents] = useState<CourseContent[]>([]);
  const [contentComments, setContentComments] = useState<ContentComment[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicComments, setTopicComments] = useState<TopicComment[]>([]);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [question, setQuestion] = useState("");
  const [blindOpen, setBlindOpen] = useState(false);
  const [blindLines, setBlindLines] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  const loadAll = useCallback(async () => {
    const [signupRes, contentRes, contentCommentRes, topicRes, topicCommentRes] = await Promise.all([
      supabase.from("signups").select("*").order("updated_at", { ascending: false }),
      supabase.from("course_contents").select("*").order("created_at", { ascending: false }),
      supabase.from("content_comments").select("*").order("created_at", { ascending: true }),
      supabase.from("topics").select("id,nickname,avatar,title,body,category,is_anonymous,created_at").order("created_at", { ascending: false }),
      supabase.from("topic_comments").select("id,topic_id,nickname,avatar,body,is_anonymous,created_at").order("created_at", { ascending: true })
    ]);
    if (signupRes.data) setSignups(signupRes.data as Signup[]);
    if (contentRes.data) setContents(contentRes.data as CourseContent[]);
    if (contentCommentRes.data) setContentComments(contentCommentRes.data as ContentComment[]);
    if (topicRes.data) setTopics(topicRes.data as Topic[]);
    if (topicCommentRes.data) setTopicComments(topicCommentRes.data as TopicComment[]);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (!profile) return;
    const mine = signups.find((item) => item.profile_id === profile.id);
    if (mine) {
      setSelectedDays(mine.days);
      setQuestion(mine.question || "");
    }
  }, [profile, signups]);

  const stats = useMemo(
    () =>
      weekdays.map((day) => ({
        day,
        names: signups.filter((item) => item.days.includes(day)).map((item) => item.nickname)
      })),
    [signups]
  );

  async function submitSignup() {
    if (!profile || selectedDays.length === 0) {
      setMessage("请至少选择一天。");
      return;
    }
    const { error } = await supabase.rpc("upsert_signup_with_code", {
      p_profile_id: profile.id,
      p_edit_code: profile.edit_code || "",
      p_nickname: profile.nickname,
      p_avatar: profile.avatar,
      p_days: selectedDays,
      p_question: cleanText(question, 500) || null
    });
    if (error) {
      setMessage(error.message);
      return;
    }
    await loadAll();
    const start = Math.abs(profile.id.split("").reduce((sum, char) => sum + char.charCodeAt(0), Date.now())) % blindBoxLines.length;
    setBlindLines([blindBoxLines[start], blindBoxLines[(start + 3) % blindBoxLines.length]]);
    setBlindOpen(true);
    setMessage("");
    window.location.hash = "blind-box";
  }

  async function addContentComment(contentId: string, body: string, reset: () => void) {
    if (!profile || !body.trim()) return;
    const { error } = await supabase.rpc("add_content_comment_with_code", {
      p_profile_id: profile.id,
      p_edit_code: profile.edit_code || "",
      p_content_id: contentId,
      p_body: cleanText(body, 800)
    });
    if (!error) {
      reset();
      loadAll();
    }
  }

  async function addTopic(form: HTMLFormElement) {
    if (!profile) return;
    const data = new FormData(form);
    const title = cleanText(String(data.get("title") || ""), 80);
    const body = cleanText(String(data.get("body") || ""), 1200);
    if (!title || !body) return;
    const { error } = await supabase.rpc("create_topic_with_code", {
      p_profile_id: profile.id,
      p_edit_code: profile.edit_code || "",
      p_title: title,
      p_body: body,
      p_category: data.get("category") as TopicCategory,
      p_is_anonymous: data.get("anonymous") === "on"
    });
    if (!error) {
      form.reset();
      loadAll();
    }
  }

  async function addTopicComment(topicId: string, body: string, anonymous: boolean, reset: () => void) {
    if (!profile || !body.trim()) return;
    const { error } = await supabase.rpc("add_topic_comment_with_code", {
      p_profile_id: profile.id,
      p_edit_code: profile.edit_code || "",
      p_topic_id: topicId,
      p_body: cleanText(body, 800),
      p_is_anonymous: anonymous
    });
    if (!error) {
      reset();
      loadAll();
    }
  }

  return (
    <main className="min-h-screen bg-paper">
      <header className="border-b border-ink/10 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-clay">21 天共学实验</p>
            <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight md:text-5xl">AI时代的21天批判性思维养成计划</h1>
            <p className="mt-4 max-w-2xl leading-7 text-ink/70">把提问、辨析和表达放回日常。没有登录系统，没有图片视频上传，只有文本、同伴和一点点打开问题的勇气。</p>
          </div>
          <Link className="focus-ring w-fit rounded-md border border-ink/15 px-4 py-2 text-sm font-semibold" href="/admin">
            管理员入口
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8">
        <ProfileGate onReady={setProfile} />
        {profile && (
          <>
            <section className="grid gap-6 rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
              <div>
                <p className="text-sm font-semibold text-tea">板块一</p>
                <h2 className="mt-1 text-2xl font-semibold">共学时间接龙</h2>
              </div>
              <div>
                <h3 className="text-lg font-semibold">当前报名统计</h3>
                <div className="mt-4 grid gap-3 md:grid-cols-7">
                  {stats.map((item) => (
                    <div className="rounded-md border border-ink/10 bg-mist/40 p-3" key={item.day}>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{item.day}</span>
                        <span className="text-sm text-ink/60">{item.names.length} 人</span>
                      </div>
                      <p className="mt-2 min-h-10 text-sm leading-6 text-ink/65">{item.names.length ? item.names.join("、") : "暂未报名"}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t border-ink/10 pt-5">
                <h3 className="text-lg font-semibold">用户填写区域</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {weekdays.map((day) => (
                    <button
                      className={`focus-ring rounded-md border px-4 py-2 text-sm ${selectedDays.includes(day) ? "border-clay bg-clay/10 text-clay" : "border-ink/15 bg-white"}`}
                      key={day}
                      onClick={() => setSelectedDays((days) => (days.includes(day) ? days.filter((item) => item !== day) : [...days, day]))}
                      type="button"
                    >
                      {day}
                    </button>
                  ))}
                </div>
                <textarea className="focus-ring mt-4 min-h-28 w-full rounded-md border border-ink/15 bg-white px-3 py-2" placeholder="对课程的疑问或期待（选填）" value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={500} />
                {message && <p className="mt-2 text-sm text-clay">{message}</p>}
                <button className="focus-ring mt-3 rounded-md bg-ink px-5 py-2 text-sm font-semibold text-white" onClick={submitSignup} type="button">
                  提交
                </button>
              </div>
              {blindOpen && (
                <div id="blind-box" className="rounded-lg border border-clay/30 bg-[#fff8ed] p-5">
                  <p className="text-sm font-semibold text-clay">盲盒知识已打开</p>
                  {blindLines.map((line) => (
                    <p className="mt-3 text-xl font-semibold leading-9" key={line}>{line}</p>
                  ))}
                </div>
              )}
            </section>

            <section className="grid gap-5 rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
              <div>
                <p className="text-sm font-semibold text-tea">模块 2</p>
                <h2 className="mt-1 text-2xl font-semibold">工具方法与案例区</h2>
              </div>
              {contents.length === 0 && <p className="rounded-md bg-mist/40 p-4 text-ink/65">管理员还没有发布内容。</p>}
              {contents.map((content) => (
                <ContentCard
                  comments={contentComments.filter((comment) => comment.content_id === content.id)}
                  content={content}
                  key={content.id}
                  onComment={addContentComment}
                />
              ))}
            </section>

            <section className="grid gap-5 rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
              <div>
                <p className="text-sm font-semibold text-tea">模块 3</p>
                <h2 className="mt-1 text-2xl font-semibold">争议话题与困扰区</h2>
              </div>
              <form
                className="grid gap-3 rounded-md border border-ink/10 bg-mist/30 p-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  addTopic(event.currentTarget);
                }}
              >
                <input className="focus-ring rounded-md border border-ink/15 px-3 py-2" name="title" placeholder="标题" maxLength={80} />
                <textarea className="focus-ring min-h-28 rounded-md border border-ink/15 px-3 py-2" name="body" placeholder="内容" maxLength={1200} />
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <select className="focus-ring rounded-md border border-ink/15 px-3 py-2" name="category" defaultValue="controversy">
                    {Object.entries(topicCategoryLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  <label className="flex items-center gap-2 text-sm">
                    <input name="anonymous" type="checkbox" />
                    匿名发布
                  </label>
                  <button className="focus-ring rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white md:ml-auto" type="submit">
                    发布话题
                  </button>
                </div>
              </form>
              {topics.map((topic) => (
                <TopicCard
                  comments={topicComments.filter((comment) => comment.topic_id === topic.id)}
                  key={topic.id}
                  onComment={addTopicComment}
                  topic={topic}
                />
              ))}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function ContentCard({ content, comments, onComment }: { content: CourseContent; comments: ContentComment[]; onComment: (id: string, body: string, reset: () => void) => void }) {
  const [body, setBody] = useState("");
  return (
    <article className="rounded-md border border-ink/10 p-4">
      <span className="rounded bg-tea/10 px-2 py-1 text-xs font-semibold text-tea">{contentTypeLabels[content.type]}</span>
      <h3 className="mt-3 text-xl font-semibold">{content.title}</h3>
      <p className="mt-3 whitespace-pre-wrap leading-7 text-ink/75">{content.body}</p>
      <div className="mt-5 grid gap-3 border-t border-ink/10 pt-4">
        {comments.map((comment) => (
          <div className="flex gap-3" key={comment.id}>
            <Avatar id={comment.avatar} size="sm" />
            <div>
              <p className="text-sm font-semibold">{comment.nickname} <span className="font-normal text-ink/45">{formatTime(comment.created_at)}</span></p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-ink/70">{comment.body}</p>
            </div>
          </div>
        ))}
        <div className="flex gap-2">
          <input className="focus-ring min-w-0 flex-1 rounded-md border border-ink/15 px-3 py-2 text-sm" value={body} onChange={(event) => setBody(event.target.value)} placeholder="写一条评论" maxLength={800} />
          <button className="focus-ring rounded-md border border-ink/15 px-3 py-2 text-sm" onClick={() => onComment(content.id, body, () => setBody(""))} type="button">发送</button>
        </div>
      </div>
    </article>
  );
}

function TopicCard({ topic, comments, onComment }: { topic: Topic; comments: TopicComment[]; onComment: (id: string, body: string, anonymous: boolean, reset: () => void) => void }) {
  const [body, setBody] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  return (
    <article className="rounded-md border border-ink/10 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          {topic.is_anonymous ? <span className="h-10 w-10 rounded-full bg-ink/10" /> : <Avatar id={topic.avatar} />}
          <div>
            <p className="text-sm font-semibold">{topic.is_anonymous ? "匿名用户" : topic.nickname} <span className="font-normal text-ink/45">{formatTime(topic.created_at)}</span></p>
            <span className="mt-1 inline-block rounded bg-clay/10 px-2 py-1 text-xs font-semibold text-clay">{topicCategoryLabels[topic.category]}</span>
          </div>
        </div>
      </div>
      <h3 className="mt-3 text-xl font-semibold">{topic.title}</h3>
      <p className="mt-2 whitespace-pre-wrap leading-7 text-ink/75">{topic.body}</p>
      <div className="mt-5 grid gap-3 border-t border-ink/10 pt-4">
        {comments.map((comment) => (
          <div className="flex gap-3" key={comment.id}>
            {comment.is_anonymous ? <span className="h-8 w-8 shrink-0 rounded-full bg-ink/10" /> : <Avatar id={comment.avatar} size="sm" />}
            <div>
              <p className="text-sm font-semibold">{comment.is_anonymous ? "匿名用户" : comment.nickname} <span className="font-normal text-ink/45">{formatTime(comment.created_at)}</span></p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-ink/70">{comment.body}</p>
            </div>
          </div>
        ))}
        <div className="grid gap-2 md:grid-cols-[1fr_auto_auto]">
          <input className="focus-ring min-w-0 rounded-md border border-ink/15 px-3 py-2 text-sm" value={body} onChange={(event) => setBody(event.target.value)} placeholder="参与讨论" maxLength={800} />
          <label className="flex items-center gap-2 text-sm">
            <input checked={anonymous} onChange={(event) => setAnonymous(event.target.checked)} type="checkbox" />
            匿名评论
          </label>
          <button className="focus-ring rounded-md border border-ink/15 px-3 py-2 text-sm" onClick={() => onComment(topic.id, body, anonymous, () => setBody(""))} type="button">发送</button>
        </div>
      </div>
    </article>
  );
}
