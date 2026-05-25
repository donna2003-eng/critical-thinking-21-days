import { avatars } from "@/lib/constants";
import type { AvatarId } from "@/lib/types";

export function Avatar({ id, size = "md" }: { id?: AvatarId; size?: "sm" | "md" | "lg" }) {
  const avatar = avatars.find((item) => item.id === id) || avatars[0];
  const sizeClass = size === "sm" ? "h-8 w-8 text-xs" : size === "lg" ? "h-14 w-14 text-lg" : "h-10 w-10 text-sm";

  return (
    <span className={`${avatar.bg} ${sizeClass} inline-flex shrink-0 items-center justify-center rounded-full border border-ink/10 font-semibold text-ink`}>
      {avatar.mark}
    </span>
  );
}
