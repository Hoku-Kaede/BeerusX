"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CalendarCheck, Check, Inbox, PhoneMissed, Play, Send, Star } from "lucide-react";
import { Reveal } from "./reveal";

type Scenario = {
  id: string;
  trade: string;
  caller: string;
  callerNumber: string;
  issue: string;
  service: string;
  jobValue: number;
  slot: string;
};

const SCENARIOS: Scenario[] = [
  {
    id: "hvac",
    trade: "HVAC",
    caller: "Bandra resident",
    callerNumber: "+91 730674947",
    issue: "AC not cooling",
    service: "AC repair",
    jobValue: 320,
    slot: "Tomorrow · 10:00 AM",
  },
  {
    id: "plumber",
    trade: "Plumber",
    caller: "Marathahalli leak",
    callerNumber: "+91 98652 13098",
    issue: "Leak under kitchen sink",
    service: "Leak repair",
    jobValue: 275,
    slot: "Monday · 09:00 AM",
  },
  {
    id: "detailer",
    trade: "Detailer",
    caller: "Koramangala owner",
    callerNumber: "+91 98450 77123",
    issue: "Full interior detail",
    service: "Deep clean",
    jobValue: 180,
    slot: "Sat · 16:00",
  },
];

const FLOW = [
  { id: "missed", title: "Missed call", detail: "No answer — call dropped", icon: PhoneMissed },
  { id: "text", title: "Text back sent", detail: "Delivered in 3s · playbook fired", icon: Send },
  { id: "lead", title: "Lead in inbox", detail: "New lead · routed to owner", icon: Inbox },
  { id: "booked", title: "Booked", detail: "Instant booking confirmed", icon: CalendarCheck },
  { id: "review", title: "Review request", detail: "Post-job request queued", icon: Star },
];

const DURATIONS = [2300, 2600, 2900, 2600, 2600];

function statusOf(step: number, scenario: Scenario) {
  switch (step) {
    case 0:
      return { tone: "missed", label: "Missed" };
    case 1:
      return { tone: "sent", label: "Text sent" };
    case 2:
      return { tone: "new", label: "New" };
    case 3:
      return { tone: "booked", label: "Booked" };
    case 4:
      return { tone: "review", label: "Review" };
    default:
      return { tone: "idle", label: "Ready" };
  }
}

export function Simulator() {
  const [scenarioId, setScenarioId] = useState(SCENARIOS[0].id);
  const scenario = SCENARIOS.find((entry) => entry.id === scenarioId) ?? SCENARIOS[0];
  const [step, setStep] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const timers = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }, []);

  useEffect(() => {
    clearTimers();
    return () => clearTimers();
  }, [clearTimers]);

  const play = useCallback(() => {
    clearTimers();
    setStep(0);
    setPlaying(true);
    FLOW.forEach((entry, index) => {
      timers.current.push(
        window.setTimeout(() => {
          setStep(index);
          if (index === FLOW.length - 1) setPlaying(false);
        }, DURATIONS[index]),
      );
    });
  }, [clearTimers]);

  const reset = useCallback(() => {
    clearTimers();
    setPlaying(false);
    setStep(-1);
  }, [clearTimers]);

  const selectScenario = (id: string) => {
    clearTimers();
    setPlaying(false);
    setStep(-1);
    setScenarioId(id);
  };

  const status = statusOf(step, scenario);
  const booked = step >= 3;
  const recovered = booked ? scenario.jobValue : 0;
  const recoveredPct = booked ? 100 : 0;

  return (
    <section id="demo" className="relative py-20 md:py-28">
      <div className="mx-auto max-w-[1680px] px-5 md:px-9">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-6">
          <Reveal>
            <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-7 md:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ember-300">
                    Live simulation
                  </p>
                  <h3 className="mt-3 font-display text-2xl font-bold tracking-tight text-white md:text-3xl">
                    Watch a missed call turn into revenue.
                  </h3>
                </div>
                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                    playing
                      ? "border-ember-500/40 bg-ember-500/10 text-ember-300"
                      : "border-white/15 bg-white/[0.04] text-mist-400"
                  }`}
                >
                  <span className={`size-1.5 rounded-full ${playing ? "bg-ember-400 animate-pulse" : "bg-mist-500"}`} />
                  {playing ? "Simulating" : step >= 0 ? "Replay ready" : "Ready"}
                </span>
              </div>

              <div className="no-scrollbar mt-7 flex gap-2 overflow-x-auto pb-2">
                {SCENARIOS.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => selectScenario(entry.id)}
                    className={`shrink-0 rounded-full border px-4 py-2 text-[12.5px] font-medium transition ${
                      entry.id === scenario.id
                        ? "border-ember-500/50 bg-ember-500/12 text-white"
                        : "border-white/15 bg-white/[0.03] text-mist-400 hover:border-white/30 hover:text-white"
                    }`}
                  >
                    {entry.trade}
                  </button>
                ))}
              </div>

              <ol className="mt-8 space-y-0">
                {FLOW.map((entry, index) => {
                  const Icon = entry.icon;
                  const state =
                    step < 0 || index < step ? "done" : index === step ? "current" : "todo";
                  return (
                    <li
                      key={entry.id}
                      className={`flex items-start gap-4 rounded-2xl px-4 py-3.5 transition-colors duration-500 ${
                        state === "current" ? "bg-ember-500/[0.07]" : ""
                      }`}
                    >
                      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center">
                        {state === "done" ? (
                          <span className="grid size-9 place-items-center rounded-full bg-signal-500/15 text-signal-400">
                            <Check className="size-4" />
                          </span>
                        ) : state === "current" ? (
                          <span className="grid size-9 place-items-center rounded-full border border-ember-500/50 bg-ink-900 text-ember-300">
                            <Icon className="size-4 animate-pulse" />
                          </span>
                        ) : (
                          <span className="grid size-9 place-items-center rounded-full border border-white/10 bg-white/[0.03] text-mist-600">
                            <Icon className="size-4" />
                          </span>
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-x-3">
                          <p className="font-display text-[15px] font-semibold tracking-tight text-white">
                            {entry.title}
                          </p>
                          <p
                            className={`text-[10.5px] font-semibold uppercase tracking-[0.14em] ${
                              state === "done"
                                ? "text-signal-400"
                                : state === "current"
                                  ? "text-ember-300"
                                  : "text-mist-600"
                            }`}
                          >
                            {status.label}
                          </p>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-mist-500">{entry.detail}</p>
                        {state === "current" && entry.id === "missed" ? (
                          <p className="mt-2 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-[11px] font-medium text-red-300">
                            <PhoneMissed className="size-3.5" />
                            Ringing… no answer
                          </p>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ol>

              {step >= 1 ? (
                <div className="in-soft mt-6 rounded-2xl border border-ember-500/25 bg-gradient-to-br from-ember-500/10 to-transparent p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-mist-500">
                    MissedWorth · SMS · +1 (demo)
                  </p>
                  <p className="mt-2 text-[13px] leading-relaxed text-mist-200">
                    “Sorry we missed you, we&apos;re on a job. Book or get a quote here:”
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-ink-950">
                    Book / Get quote
                  </span>
                </div>
              ) : null}
            </div>
          </Reveal>

          <Reveal delay={140}>
            <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-7 md:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ember-300">
                Recovered revenue
              </p>
              <div className="mt-5 flex items-end justify-between gap-4">
                <p className="font-display text-[clamp(2.6rem,4vw,3.6rem)] font-bold leading-[0.95] tracking-[-0.04em] text-white tabular-nums">
                  ${recovered.toLocaleString("en-US")}
                </p>
                <p className="pb-2 text-right text-[11px] font-semibold uppercase tracking-[0.14em] text-mist-500">
                  {booked ? "recovered" : "recovered yet"}
                </p>
              </div>

              <div className="mt-6">
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-ember-400 to-ember-600 transition-all duration-1500 ease-out"
                    style={{ width: `${recoveredPct}%` }}
                  />
                </div>
              </div>

              <dl className="mt-7 space-y-3 border-t border-white/[0.08] pt-6 text-[13px]">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-mist-500">Lost call value</dt>
                  <dd className="font-semibold text-mist-200 tabular-nums">${scenario.jobValue}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-mist-500">Recovered</dt>
                  <dd className={`font-semibold tabular-nums ${booked ? "text-signal-400" : "text-mist-500"}`}>
                    ${recovered.toLocaleString("en-US")}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-mist-500">Status</dt>
                  <dd className="font-semibold text-white">{booked ? "Booked · paid path open" : "Waiting on booking"}</dd>
                </div>
              </dl>

              <p className="mt-6 text-xs leading-relaxed text-mist-500">
                {booked
                  ? `${scenario.trade} · ${scenario.issue} → ${scenario.service} booked for ${scenario.slot}. The lead closed in the inbox — that&apos;s the $${scenario.jobValue} back in your lost column.`
                  : `The ${scenario.trade.toLowerCase()} lead from ${scenario.callerNumber} is still waiting on a booking. Once they take the ${scenario.service.toLowerCase()} slot, the recovered-revenue meter fills.`}
              </p>
            </div>
          </Reveal>
        </div>

        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={play}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-white px-7 py-3 text-[14px] font-semibold text-ink-950 transition hover:bg-ember-200 active:scale-95"
          >
            <Play className="size-3.5" />
            {step >= 0 ? "Replay missed call" : "Run missed call"}
          </button>
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-[44px] items-center rounded-full border border-white/20 bg-white/[0.06] px-7 py-3 text-[14px] font-medium text-mist-50 transition hover:border-white/40 hover:bg-white/[0.12] active:scale-95"
          >
            Reset
          </button>
        </div>
      </div>
    </section>
  );
}
