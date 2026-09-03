"use client";

import { useRef, useState } from "react";
import { LogOut, LogIn, User, Settings } from "lucide-react";
import { useSession, signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export function NavbarProfile() {
  const session = useSession();
  const [profileOpen, setProfileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const user = session.data?.user;

  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? "?";

  async function handleSignOut() {
    setProfileOpen(false);
    await signOut({ fetchOptions: { onSuccess: () => { window.location.href = "/login"; } } });
  }

  if (!user) {
    return (
      <a
        href="/login"
        className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 text-[0.76rem] text-white/70 transition hover:bg-white/10 hover:text-white"
      >
        <LogIn className="h-3.5 w-3.5" />
        Sign in
      </a>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setProfileOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2 py-1 transition hover:bg-white/10"
      >
        <ProfileAvatar user={user} initials={initials} size="sm" />
        <span className="hidden max-w-[130px] truncate text-[0.76rem] text-white/70 lg:block">
          {user.email}
        </span>
      </button>

      {profileOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
          <div className="absolute right-0 top-10 z-40 w-64 overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-3 border-b border-white/10 px-4 py-4">
              <ProfileAvatar user={user} initials={initials} size="lg" />
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-white">{user.name ?? "User"}</div>
                <div className="truncate text-[0.72rem] text-white/45">{user.email}</div>
              </div>
            </div>
            <div className="py-1.5">
              <DropdownItem icon={User} label="Your Profile" onClick={() => setProfileOpen(false)} />
              <DropdownItem icon={Settings} label="Settings" href="/settings" onClick={() => setProfileOpen(false)} />
              <div className="mx-3 my-1.5 border-t border-white/8" />
              <DropdownItem icon={LogOut} label="Sign out" onClick={handleSignOut} danger />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

type AvatarUser = { name?: string | null; email?: string | null; image?: string | null };

function ProfileAvatar({ user, initials, size }: { user: AvatarUser; initials: string; size: "sm" | "lg" }) {
  const dim = size === "sm" ? "h-6 w-6 text-[0.6rem]" : "h-9 w-9 text-sm";

  if (user.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.image}
        alt={user.name ?? "Profile"}
        className={cn("shrink-0 rounded-full object-cover ring-1 ring-white/15", dim)}
      />
    );
  }

  return (
    <div
      className={cn(
        "shrink-0 flex items-center justify-center rounded-full bg-[hsl(184,73%,61%)]/20 font-semibold text-[hsl(184,73%,61%)] ring-1 ring-[hsl(184,73%,61%)]/20",
        dim
      )}
    >
      {initials}
    </div>
  );
}

function DropdownItem({
  icon: Icon,
  label,
  onClick,
  href,
  danger = false,
}: {
  icon: React.FC<{ className?: string }>;
  label: string;
  onClick: () => void;
  href?: string;
  danger?: boolean;
}) {
  const cls = cn(
    "flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors",
    danger ? "text-red-400 hover:bg-red-500/10" : "text-white/65 hover:bg-white/5 hover:text-white"
  );
  if (href) {
    return (
      <a href={href} onClick={onClick} className={cls}>
        <Icon className="h-4 w-4 shrink-0" />
        {label}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </button>
  );
}
