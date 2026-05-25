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

const coverActions = [
  { id: "signup-section", label: "共学时间接龙" },
  { id: "content-section", label: "工具方法与案例" },
  { id: "topic-section", label: "争议话题与困扰" }
];

function scrollToSection(id: string) {
  const target = document.getElementById(id);
  if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
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
    <main className="min-h-screen bg-white text-ink">
      <div className="mx-auto min-h-screen w-full max-w-[430px] px-4 py-4">
        <section className="relative flex min-h-[96svh] flex-col overflow-hidden rounded-[28px] bg-white px-6 pb-12 pt-8 shadow-[0_20px_70px_rgba(26,87,170,0.10)]">
          <div className="pointer-events-none absolute -right-12 top-16 h-48 w-48 rounded-full bg-sky-100/70 blur-3xl" />
          <div className="pointer-events-none absolute -left-16 bottom-40 h-44 w-44 rounded-full bg-amber-100/60 blur-3xl" />
          <div className="relative z-10">
            <div>
              <p className="text-[clamp(1.55rem,7.4vw,2.2rem)] font-black leading-none text-[#1164f4]">AI时代的</p>
              <h1 className="mt-3 text-[clamp(3.15rem,14.8vw,4.35rem)] font-black leading-[0.9] tracking-normal text-black">21天</h1>
              <p className="mt-3 whitespace-nowrap text-[clamp(2.65rem,12.1vw,3.75rem)] font-black leading-[1] text-[#1164f4]">批判性思维</p>
              <p className="mt-3 text-[clamp(1.95rem,9vw,2.7rem)] font-black leading-none text-black">养成计划</p>
              <span className="mt-5 block h-1.5 w-14 rounded-full bg-[#1164f4]" />
              <p className="mt-5 text-sm font-semibold tracking-normal text-[#68769d] md:text-xl">质疑 · 分析 · 评估 · 洞察 · 表达</p>
            </div>
          </div>

          <CoverImageSlot />


        </section>

        <div className="relative z-10 mt-10 grid gap-3 pb-2">
          {coverActions.map((action) => (
            <button
              className="focus-ring group flex min-h-[64px] items-center justify-between gap-3 rounded-[18px] bg-white px-5 text-left shadow-[0_12px_26px_rgba(17,70,140,0.10)] transition hover:-translate-y-0.5"
              key={action.id}
              onClick={() => scrollToSection(action.id)}
              type="button"
            >
              <span className="min-w-0 flex-1 whitespace-nowrap text-[clamp(1.15rem,5.4vw,1.45rem)] font-black leading-none text-[#081747]">{action.label}</span>
              <span className="text-3xl font-black leading-none text-[#1164f4] transition group-hover:translate-x-1">›</span>
            </button>
          ))}
        </div>

        <div className="mt-5">
          <ProfileGate onReady={setProfile} />
        </div>

        {profile && (
          <div className="mt-5 grid gap-5 pb-10 md:gap-7">
            <section id="signup-section" className="scroll-mt-4 grid gap-5 rounded-[22px] border border-ink/10 bg-white p-5 shadow-soft">
              <div>
                <p className="text-sm font-semibold text-clay">板块一</p>
                <h2 className="mt-1 text-2xl font-black">共学时间接龙</h2>
              </div>
              <div>
                <h3 className="text-lg font-semibold">当前报名统计</h3>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-7">
                  {stats.map((item) => (
                    <div className="rounded-2xl border border-ink/10 bg-mist/40 p-3" key={item.day}>
                      <div className="flex items-center justify-between gap-2">
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
                <div className="mt-4 grid grid-cols-4 gap-2 sm:flex sm:flex-wrap">
                  {weekdays.map((day) => (
                    <button
                      className={'focus-ring rounded-xl border px-3 py-3 text-sm font-semibold ' + (selectedDays.includes(day) ? "border-clay bg-clay/10 text-clay" : "border-ink/15 bg-white")}
                      key={day}
                      onClick={() => setSelectedDays((days) => (days.includes(day) ? days.filter((item) => item !== day) : [...days, day]))}
                      type="button"
                    >
                      {day}
                    </button>
                  ))}
                </div>
                <textarea className="focus-ring mt-4 min-h-28 w-full rounded-2xl border border-ink/15 bg-white px-4 py-3" placeholder="对课程的疑问或期待（选填）" value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={500} />
                {message && <p className="mt-2 text-sm text-clay">{message}</p>}
                <button className="focus-ring mt-3 w-full rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white sm:w-auto" onClick={submitSignup} type="button">
                  提交
                </button>
              </div>
              {blindOpen && (
                <div id="blind-box" className="rounded-[22px] border border-clay/30 bg-[#fff8ed] p-5">
                  <p className="text-sm font-semibold text-clay">盲盒知识已打开</p>
                  {blindLines.map((line) => (
                    <p className="mt-3 text-xl font-semibold leading-9" key={line}>{line}</p>
                  ))}
                </div>
              )}
            </section>

            <section id="content-section" className="scroll-mt-4 grid gap-5 rounded-[22px] border border-ink/10 bg-white p-5 shadow-soft">
              <div>
                <p className="text-sm font-semibold text-tea">板块二</p>
                <h2 className="mt-1 text-2xl font-black">工具方法与案例</h2>
              </div>
              {contents.length === 0 && <p className="rounded-2xl bg-mist/40 p-4 text-ink/65">管理员还没有发布内容。</p>}
              {contents.map((content) => (
                <ContentCard
                  comments={contentComments.filter((comment) => comment.content_id === content.id)}
                  content={content}
                  key={content.id}
                  onComment={addContentComment}
                />
              ))}
            </section>

            <section id="topic-section" className="scroll-mt-4 grid gap-5 rounded-[22px] border border-ink/10 bg-white p-5 shadow-soft">
              <div>
                <p className="text-sm font-semibold text-tea">板块三</p>
                <h2 className="mt-1 text-2xl font-black">争议话题与困扰</h2>
              </div>
              <form
                className="grid gap-3 rounded-2xl border border-ink/10 bg-mist/30 p-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  addTopic(event.currentTarget);
                }}
              >
                <input className="focus-ring rounded-xl border border-ink/15 px-3 py-3" name="title" placeholder="标题" maxLength={80} />
                <textarea className="focus-ring min-h-28 rounded-xl border border-ink/15 px-3 py-3" name="body" placeholder="内容" maxLength={1200} />
                <div className="grid gap-3 sm:flex sm:items-center">
                  <select className="focus-ring rounded-xl border border-ink/15 px-3 py-3" name="category" defaultValue="controversy">
                    {Object.entries(topicCategoryLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  <label className="flex items-center gap-2 text-sm">
                    <input name="anonymous" type="checkbox" />
                    匿名发布
                  </label>
                  <button className="focus-ring rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white sm:ml-auto" type="submit">
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
          </div>
        )}
      </div>

      <Link className="fixed right-3 top-3 z-20 rounded-full border border-ink/10 bg-white/70 px-2.5 py-1.5 text-[11px] font-semibold text-ink/55 shadow-sm backdrop-blur" href="/admin">
        管理员入口
      </Link>
    </main>
  );
}

function CoverMagnifier() {
  return (
    <div className="hidden shrink-0 pt-16 sm:block" aria-hidden="true">
      <div className="relative h-36 w-36 rotate-[-16deg] rounded-full border-[12px] border-[#1164f4] bg-white shadow-[inset_0_0_0_5px_rgba(255,255,255,0.7),0_16px_32px_rgba(17,100,244,0.24)]">
        <span className="absolute left-6 top-5 h-5 w-16 rotate-[-18deg] rounded-full bg-white/80" />
        <span className="absolute -bottom-12 -right-9 h-20 w-7 rotate-[-42deg] rounded-full bg-[#1164f4] shadow-[0_14px_22px_rgba(17,100,244,0.24)]" />
      </div>
    </div>
  );
}

function CoverImageSlot() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <div className="relative z-10 flex flex-1 items-start justify-center pt-14">
      <img
        alt="共学讨论"
        className="h-auto w-[108%] max-w-[410px] object-contain"
        onError={() => setVisible(false)}
        src="/cover-people.png?v=hero6"
      />
    </div>
  );
}

function ContentCard({ content, comments, onComment }: { content: CourseContent; comments: ContentComment[]; onComment: (id: string, body: string, reset: () => void) => void }) {
  const [body, setBody] = useState("");
  return (
    <article className="rounded-2xl border border-ink/10 p-4">
      <span className="rounded-full bg-tea/10 px-3 py-1 text-xs font-semibold text-tea">{contentTypeLabels[content.type]}</span>
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
        <div className="grid gap-2 sm:flex">
          <input className="focus-ring min-w-0 flex-1 rounded-xl border border-ink/15 px-3 py-3 text-sm" value={body} onChange={(event) => setBody(event.target.value)} placeholder="写一条评论" maxLength={800} />
          <button className="focus-ring rounded-xl border border-ink/15 px-4 py-3 text-sm font-semibold" onClick={() => onComment(content.id, body, () => setBody(""))} type="button">发送</button>
        </div>
      </div>
    </article>
  );
}

function TopicCard({ topic, comments, onComment }: { topic: Topic; comments: TopicComment[]; onComment: (id: string, body: string, anonymous: boolean, reset: () => void) => void }) {
  const [body, setBody] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  return (
    <article className="rounded-2xl border border-ink/10 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          {topic.is_anonymous ? <span className="h-10 w-10 rounded-full bg-ink/10" /> : <Avatar id={topic.avatar} />}
          <div>
            <p className="text-sm font-semibold">{topic.is_anonymous ? "匿名用户" : topic.nickname} <span className="font-normal text-ink/45">{formatTime(topic.created_at)}</span></p>
            <span className="mt-1 inline-block rounded-full bg-clay/10 px-3 py-1 text-xs font-semibold text-clay">{topicCategoryLabels[topic.category]}</span>
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
        <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
          <input className="focus-ring min-w-0 rounded-xl border border-ink/15 px-3 py-3 text-sm" value={body} onChange={(event) => setBody(event.target.value)} placeholder="参与讨论" maxLength={800} />
          <label className="flex items-center gap-2 text-sm">
            <input checked={anonymous} onChange={(event) => setAnonymous(event.target.checked)} type="checkbox" />
            匿名评论
          </label>
          <button className="focus-ring rounded-xl border border-ink/15 px-4 py-3 text-sm font-semibold" onClick={() => onComment(topic.id, body, anonymous, () => setBody(""))} type="button">发送</button>
        </div>
      </div>
    </article>
  );
}
