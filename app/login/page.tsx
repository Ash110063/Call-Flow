"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { Logo } from "@/components/AppShell";
import { btn, cx } from "@/components/ui";

// Demo build: no credentials needed. Anyone can open the portal with one click.
export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const enter = () => {
    setLoading(true);
    setTimeout(() => router.push("/"), 400);
  };

  return (
    <div className="flex min-h-screen flex-wrap gap-6 p-4 md:p-6">
      <section className="flex min-h-[560px] min-w-0 flex-[1_1_480px] flex-col justify-between gap-10 rounded-[32px] bg-navy p-8 text-white md:p-10">
        <div className="flex items-center gap-2.5">
          <Logo size={40} />
          <span className="text-xl font-extrabold">Call Flow</span>
        </div>
        <div className="max-w-[540px]">
          <h1 className="font-display text-[40px] leading-[1.05] font-medium md:text-[52px]">Know exactly how long every airline keeps callers waiting.</h1>
          <p className="mt-4 text-[17px] leading-relaxed text-soft-2">Automated calls, live hold tracking and human detection in one place.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex-[1_1_180px] rounded-[20px] bg-navy-2 px-5 py-4">
            <div className="flex items-center gap-2 text-[13px] font-bold text-sky-light">
              <span className="h-[7px] w-[7px] rounded-full bg-sky" /> LIVE NOW
            </div>
            <div className="mt-2 text-[30px] font-bold">23 calls</div>
            <div className="text-[13px] text-muted-dark">across 3 airlines</div>
          </div>
          <div className="flex-[1_1_180px] rounded-[20px] bg-navy-2 px-5 py-4">
            <div className="text-[13px] font-bold text-muted-dark">AVG HOLD TODAY</div>
            <div className="mt-2 text-[30px] font-bold">14m 32s</div>
            <div className="text-[13px] text-muted-dark">1m 05s faster than yesterday</div>
          </div>
        </div>
      </section>

      <section className="flex min-w-0 flex-[1_1_420px] items-center justify-center px-2 py-6">
        <div className="flex w-full max-w-[420px] flex-col gap-5">
          <div>
            <h2 className="text-[30px] font-bold">Welcome to the demo</h2>
            <p className="mt-2 text-[15px] text-muted">This is a clickable prototype with sample data. No account or password needed.</p>
          </div>
          <button onClick={enter} className={cx(btn.primary, "h-[54px] text-base")}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : null}
            Enter Call Flow
            {!loading && <ArrowRight size={18} />}
          </button>
          <p className="text-center text-[13px] text-muted">You’ll be signed in as Sana Ahmed, workspace admin.</p>
        </div>
      </section>
    </div>
  );
}
