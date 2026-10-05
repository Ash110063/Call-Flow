"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, LogOut, Settings, Briefcase, CheckCheck } from "lucide-react";
import { useStore } from "@/lib/store";
import { cx, popCls, menuItemCls, usePopover } from "./ui";

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/jobs", label: "Jobs" },
  { href: "/analytics", label: "Analytics" },
  { href: "/settings", label: "Settings" },
];

export function Logo({ size = 36 }: { size?: number }) {
  return (
    <span className="flex items-center justify-center rounded-xl bg-primary" style={{ width: size, height: size }}>
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M2 12h4l2.5-6 5 12 2.5-6h6" />
      </svg>
    </span>
  );
}

const TONE_DOT = { bad: "bg-bad-dot", warn: "bg-warn-dot", ok: "bg-ok-dot", info: "bg-primary" };

function Notifications() {
  const { notifications, markAllRead, markRead } = useStore();
  const { open, setOpen, ref } = usePopover();
  const unread = notifications.filter((n) => !n.read).length;
  return (
    <div ref={ref} className="relative">
      <button
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-soft bg-white hover:border-primary"
      >
        <Bell size={19} />
        {unread > 0 && <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-bad-dot px-1 text-[10px] font-bold text-white">{unread}</span>}
      </button>
      {open && (
        <div role="dialog" aria-label="Notifications" className={cx(popCls, "right-0 w-[360px] max-w-[calc(100vw-32px)]")}>
          <div className="flex items-center justify-between px-3 pt-2 pb-1.5">
            <strong className="text-[15px]">Notifications</strong>
            <button onClick={markAllRead} className="flex cursor-pointer items-center gap-1 rounded-full px-2 py-1.5 text-[13px] font-bold text-primary-ink hover:bg-tint">
              <CheckCheck size={15} /> Mark all read
            </button>
          </div>
          <div className="flex max-h-[380px] flex-col gap-1 overflow-y-auto">
            {notifications.map((n) => (
              <Link
                key={n.id}
                href={n.href}
                onClick={() => {
                  markRead(n.id);
                  setOpen(false);
                }}
                className={cx("flex gap-3 rounded-xl p-3 hover:bg-tint", !n.read && "bg-bg")}
              >
                <span className={cx("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", TONE_DOT[n.tone])} />
                <span>
                  <span className={cx("block text-sm", n.read ? "font-semibold" : "font-bold")}>{n.title}</span>
                  <span className="mt-0.5 block text-[13px] text-muted">{n.body}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AccountMenu() {
  const { open, setOpen, ref } = usePopover();
  const router = useRouter();
  return (
    <div ref={ref} className="relative">
      <button aria-label="Account menu" aria-expanded={open} onClick={() => setOpen(!open)} className="h-11 w-11 cursor-pointer rounded-full bg-navy text-sm font-bold text-white hover:ring-4 hover:ring-soft">
        SA
      </button>
      {open && (
        <div role="menu" className={cx(popCls, "right-0 w-[250px]")}>
          <div className="mb-1 border-b border-line px-3 pt-2.5 pb-3">
            <div className="text-sm font-bold">Sana Ahmed</div>
            <div className="text-[13px] text-muted">Admin · sana@callflow.io</div>
          </div>
          <Link role="menuitem" href="/settings" onClick={() => setOpen(false)} className={menuItemCls}>
            <Settings size={16} /> Settings
          </Link>
          <Link role="menuitem" href="/jobs" onClick={() => setOpen(false)} className={menuItemCls}>
            <Briefcase size={16} /> My jobs
          </Link>
          <button role="menuitem" onClick={() => router.push("/login")} className={cx(menuItemCls, "text-bad")}>
            <LogOut size={16} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { jobs } = useStore();
  const failed = jobs.some((j) => j.status === "failed");
  const isActive = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  return (
    <div className="min-h-screen px-4 pt-4 pb-12 md:px-6 md:pt-6">
      <div className="mx-auto flex max-w-[1392px] flex-col gap-5">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] bg-white py-3 pr-3.5 pl-5">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo />
            <span className="text-lg font-extrabold tracking-tight">Call Flow</span>
          </Link>
          <nav aria-label="Primary" className="order-3 flex w-full flex-wrap gap-1 rounded-full bg-tint p-1.5 md:order-none md:w-auto">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                aria-current={isActive(n.href) ? "page" : undefined}
                className={cx("rounded-full px-5 py-2.5 text-sm font-semibold transition", isActive(n.href) ? "bg-primary text-white" : "text-body hover:bg-white")}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2.5">
            <span className={cx("hidden items-center gap-2 rounded-full px-3.5 py-2.5 text-[13px] font-bold lg:flex", failed ? "bg-warn-bg text-warn" : "bg-ok-bg text-ok")}>
              <span className={cx("h-2 w-2 rounded-full", failed ? "bg-warn-dot" : "bg-ok-dot")} />
              {failed ? "1 job needs attention" : "All systems operational"}
            </span>
            <Notifications />
            <AccountMenu />
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
