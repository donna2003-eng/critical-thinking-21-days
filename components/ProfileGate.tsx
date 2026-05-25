"use client";

import { useEffect, useState } from "react";
import { avatars } from "@/lib/constants";
import { cleanEditCode, cleanNickname } from "@/lib/sanitize";
import { supabase } from "@/lib/supabase/client";
import type { AvatarId, Profile } from "@/lib/types";
import { Avatar } from "./Avatar";

const storageKey = "ct21_profile";

export function getLocalProfile(): Profile | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Profile;
  } catch {
    return null;
  }
}

export function saveLocalProfile(profile: Profile) {
  window.localStorage.setItem(storageKey, JSON.stringify(profile));
  window.dispatchEvent(new CustomEvent("profile-updated", { detail: profile }));
}

export default function ProfileGate({ onReady }: { onReady: (profile: Profile) => void }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState<AvatarId>("seed");
  const [editCode, setEditCode] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const existing = getLocalProfile();
    if (existing) {
      setProfile(existing);
      setNickname(existing.nickname);
      setAvatar(existing.avatar);
      onReady(existing);
    }
  }, [onReady]);

  async function createProfile() {
    const cleanName = cleanNickname(nickname);
    const code = cleanEditCode(editCode);
    if (!cleanName) {
      setMessage("请先填写昵称。");
      return;
    }
    if (code.length < 4) {
      setMessage("提交码需要 4-8 位字母或数字。");
      return;
    }
    setBusy(true);
    const next: Profile = {
      id: crypto.randomUUID(),
      nickname: cleanName,
      avatar,
      edit_code: code
    };
    const { error } = await supabase.from("profiles").insert(next);
    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    saveLocalProfile(next);
    setProfile(next);
    onReady(next);
    setMessage("");
  }

  async function updateProfile() {
    if (!profile) return;
    if (cleanEditCode(verifyCode) !== profile.edit_code) {
      setMessage("提交码不正确。");
      return;
    }
    const next = { ...profile, nickname: cleanNickname(nickname), avatar };
    setBusy(true);
    const { error } = await supabase.rpc("update_profile_with_code", {
      p_profile_id: profile.id,
      p_edit_code: profile.edit_code,
      p_nickname: next.nickname,
      p_avatar: next.avatar
    });
    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    saveLocalProfile(next);
    setProfile(next);
    onReady(next);
    setEditing(false);
    setVerifyCode("");
    setMessage("资料已更新。");
  }

  const form = (
    <div className="grid gap-4">
      <label className="grid gap-2 text-sm font-medium">
        昵称
        <input className="focus-ring rounded-xl border border-ink/15 bg-white px-3 py-3" value={nickname} onChange={(event) => setNickname(event.target.value)} maxLength={24} />
      </label>
      <div className="grid gap-2">
        <span className="text-sm font-medium">选择系统头像</span>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {avatars.map((item) => (
            <button
              className={'focus-ring flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ' + (avatar === item.id ? "border-clay bg-clay/10" : "border-ink/10 bg-white")}
              key={item.id}
              onClick={() => setAvatar(item.id)}
              type="button"
            >
              <Avatar id={item.id} size="sm" />
              {item.label}
            </button>
          ))}
        </div>
      </div>
      {!profile && (
        <label className="grid gap-2 text-sm font-medium">
          提交码
          <input className="focus-ring rounded-xl border border-ink/15 bg-white px-3 py-3" value={editCode} onChange={(event) => setEditCode(cleanEditCode(event.target.value))} maxLength={8} />
        </label>
      )}
      {profile && editing && (
        <label className="grid gap-2 text-sm font-medium">
          输入提交码验证修改
          <input className="focus-ring rounded-xl border border-ink/15 bg-white px-3 py-3" value={verifyCode} onChange={(event) => setVerifyCode(cleanEditCode(event.target.value))} maxLength={8} />
        </label>
      )}
      {message && <p className="text-sm text-clay">{message}</p>}
      <button className="focus-ring rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white disabled:opacity-50" disabled={busy} onClick={profile ? updateProfile : createProfile} type="button">
        {busy ? "处理中..." : profile ? "保存修改" : "创建资料"}
      </button>
    </div>
  );

  if (!profile) {
    return (
      <section className="rounded-[22px] border border-ink/10 bg-white p-5 shadow-soft">
        <h2 className="text-xl font-black">先给自己一个轻账户</h2>
        <p className="mt-2 text-sm leading-6 text-ink/65">只保存昵称、系统头像和提交码。没有邮箱，没有手机号，也没有图片上传。</p>
        <div className="mt-5">{form}</div>
      </section>
    );
  }

  return (
    <div className="rounded-[22px] border border-ink/10 bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar id={profile.avatar} />
          <div className="min-w-0">
            <p className="truncate font-semibold">{profile.nickname}</p>
            <p className="text-xs text-ink/55">本机已记住你的轻账户</p>
          </div>
        </div>
        <button className="focus-ring shrink-0 rounded-xl border border-ink/15 px-3 py-2 text-sm" onClick={() => setEditing((value) => !value)} type="button">
          修改资料
        </button>
      </div>
      {editing && <div className="mt-5 border-t border-ink/10 pt-5">{form}</div>}
    </div>
  );
}
