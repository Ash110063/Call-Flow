"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { SEED_JOBS, SEED_NOTIFICATIONS, TEAM, type Job, type Notification } from "./data";

type ToastTone = "ok" | "info" | "warn";
interface Toast {
  id: number;
  tone: ToastTone;
  text: string;
}

export interface Member {
  initials: string;
  name: string;
  email: string;
  role: string;
  you?: boolean;
  pending?: boolean;
}

interface Store {
  jobs: Job[];
  getJob: (id: number) => Job | undefined;
  addJob: (j: Omit<Job, "id" | "createdBy">) => number;
  updateJob: (id: number, patch: Partial<Job>) => void;
  notifications: Notification[];
  markAllRead: () => void;
  markRead: (id: number) => void;
  toast: (text: string, tone?: ToastTone) => void;
  team: Member[];
  inviteMember: (email: string, role: string) => void;
  liveMode: boolean;
  setLiveMode: (v: boolean) => void;
}

const Ctx = createContext<Store | null>(null);

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore must be used inside <StoreProvider>");
  return s;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>(SEED_JOBS);
  const [notifications, setNotifications] = useState<Notification[]>(SEED_NOTIFICATIONS);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [team, setTeam] = useState<Member[]>(TEAM);
  const [liveMode, setLiveMode] = useState(true);
  const toastId = useRef(1);
  const notifId = useRef(100);

  const toast = useCallback((text: string, tone: ToastTone = "ok") => {
    const id = toastId.current++;
    setToasts((t) => [...t, { id, tone, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);

  const pushNotification = useCallback((n: Omit<Notification, "id" | "read">) => {
    const id = notifId.current++;
    setNotifications((list) => [{ ...n, id, read: false }, ...list]);
  }, []);

  const getJob = useCallback((id: number) => jobs.find((j) => j.id === id), [jobs]);

  const addJob = useCallback((j: Omit<Job, "id" | "createdBy">) => {
    const id = Math.max(...jobs.map((x) => x.id)) + 1;
    setJobs((list) => [{ ...j, id, createdBy: "Sana Ahmed" }, ...list]);
    return id;
  }, [jobs]);

  const updateJob = useCallback((id: number, patch: Partial<Job>) => {
    setJobs((list) => list.map((j) => (j.id === id ? { ...j, ...patch } : j)));
  }, []);

  // Live simulation: running jobs place calls and reach humans over time.
  useEffect(() => {
    if (!liveMode) return;
    const timer = setInterval(() => {
      setJobs((list) =>
        list.map((j) => {
          if (j.status !== "running" || j.done >= j.total) return j;
          if (Math.random() > 0.4) return j;
          const reachedNow = Math.random() < 0.7;
          const done = j.done + 1;
          const reached = j.reached + (reachedNow ? 1 : 0);
          const hold = 300 + Math.floor(Math.random() * 1500);
          const avgHoldSec = Math.round(((j.avgHoldSec || hold) * j.done + hold) / done);
          const next: Job = { ...j, done, reached, avgHoldSec, longestHoldSec: Math.max(j.longestHoldSec, hold) };
          if (done >= j.total) {
            next.status = "completed";
            setTimeout(() => {
              pushNotification({ tone: "ok", title: `Job #${j.id} completed`, body: `${done} calls · ${Math.round((reached / done) * 100)}% reached a human`, href: `/jobs/${j.id}` });
              toast(`Job #${j.id} finished: ${reached} of ${done} calls reached a human`);
            }, 0);
          }
          return next;
        }),
      );
    }, 5000);
    return () => clearInterval(timer);
  }, [liveMode, pushNotification, toast]);

  const value = useMemo<Store>(
    () => ({
      jobs,
      getJob,
      addJob,
      updateJob,
      notifications,
      markAllRead: () => setNotifications((l) => l.map((n) => ({ ...n, read: true }))),
      markRead: (id) => setNotifications((l) => l.map((n) => (n.id === id ? { ...n, read: true } : n))),
      toast,
      team,
      inviteMember: (email, role) =>
        setTeam((t) => [...t, { initials: email.slice(0, 2).toUpperCase(), name: "Invite pending", email, role, pending: true }]),
      liveMode,
      setLiveMode,
    }),
    [jobs, getJob, addJob, updateJob, notifications, toast, team, liveMode],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed bottom-6 left-1/2 z-[100] flex w-[min(440px,calc(100vw-32px))] -translate-x-1/2 flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className="toast-in pointer-events-auto flex items-center gap-3 rounded-2xl bg-navy px-4 py-3 text-sm text-white shadow-[0_18px_48px_rgba(16,16,56,0.3)]">
            {t.tone === "ok" ? <CheckCircle2 size={18} className="shrink-0 text-sky-light" /> : t.tone === "warn" ? <AlertTriangle size={18} className="shrink-0 text-warn-dot" /> : <Info size={18} className="shrink-0 text-sky-light" />}
            <span className="flex-1">{t.text}</span>
            <button aria-label="Dismiss" onClick={() => setToasts((l) => l.filter((x) => x.id !== t.id))} className="rounded-full p-1 text-muted-dark hover:text-white">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
