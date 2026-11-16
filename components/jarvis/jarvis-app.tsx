"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  Activity,
  Bot,
  Brain,
  Cpu,
  Gauge,
  Mic,
  Power,
  Radio,
  Search,
  Send,
  Settings2,
  Shield,
  Sparkles,
  TerminalSquare,
  Volume2,
  Wifi,
} from "lucide-react";

type Role = "user" | "jarvis" | "system";
type Message = {
  id: string;
  role: Role;
  text: string;
  time: string;
  tag?: string;
};

type Module = {
  id: string;
  name: string;
  desc: string;
  on: boolean;
};

const now = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const initialMessages: Message[] = [
  {
    id: "m1",
    role: "system",
    text: "Secure local session initialized. Neural interface online.",
    time: now(),
    tag: "BOOT",
  },
  {
    id: "m2",
    role: "jarvis",
    text:
      "Good evening. I am JARVIS — your local-first personal AI interface inspired by OpenJarvis. Systems are nominal. How can I assist you?",
    time: now(),
  },
];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function jarvisReply(input: string): { text: string; tag?: string } {
  const q = input.toLowerCase();
  if (/(status|diagnostic|health|system)/.test(q)) {
    return {
      tag: "DIAGNOSTICS",
      text:
        "All subsystems are operating within expected parameters. CPU 34%, memory 48%, local inference ready, network stable. No anomalies detected.",
    };
  }
  if (/(hello|hi|hey)/.test(q)) {
    return {
      text:
        "Hello. I am standing by. You can ask for system status, open modules, run a simulated task, or explore capabilities.",
    };
  }
  if (/(open|enable|activate).*(vision|camera)/.test(q)) {
    return {
      tag: "MODULE",
      text:
        "Vision module armed in simulation mode. Camera pipeline is ready for local processing when a device feed is connected.",
    };
  }
  if (/(weather|time|date)/.test(q)) {
    return {
      tag: "CONTEXT",
      text: `Current local time is ${new Date().toLocaleString()}. Live weather feed is not connected in this demo, but the UI hook is ready.`,
    };
  }
  if (/(openjarvis|what.*you|who.*you|about)/.test(q)) {
    return {
      tag: "ABOUT",
      text:
        "This interface is a JARVIS-inspired GUI built for OpenJarvis-style workflows: local-first assistance, modular tools, agent actions, and rich feedback. It is fully interactive as a front-end simulation.",
    };
  }
  if (/(task|run|execute|scan|research)/.test(q)) {
    return {
      tag: "TASK",
      text:
        "Task queued. Planner decomposed the request, selected tools, and prepared an execution trace. In a connected OpenJarvis backend this would dispatch to real agents and tools.",
    };
  }
  if (/(animate|animation|cool)/.test(q)) {
    return {
      tag: "UI",
      text:
        "Motion systems active: reactive core, ambient particles, waveform telemetry, staggered panels, and state transitions tuned for a cinematic feel.",
    };
  }
  return {
    text:
      "Understood. I have logged your request to the session console. Connect a backend engine to give this interface live model, tool, and device capabilities.",
  };
}

function Orb({ listening, thinking }: { listening: boolean; thinking: boolean }) {
  return (
    <div className="relative flex items-center justify-center">
      <motion.div
        className="absolute h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl"
        animate={{ scale: listening ? [1, 1.2, 1] : thinking ? [1, 1.15, 1] : [1, 1.08, 1], opacity: [0.35, 0.6, 0.35] }}
        transition={{ duration: thinking ? 1.8 : 3.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute h-56 w-56 rounded-full border border-cyan-300/30"
        animate={{ rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute h-64 w-64 rounded-full border border-cyan-400/10"
        animate={{ rotate: -360 }}
        transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute h-44 w-44 rounded-full"
        style={{
          background:
            "conic-gradient(from 0deg, rgba(34,211,238,0.0), rgba(34,211,238,0.7), rgba(59,130,246,0.2), rgba(34,211,238,0.0))",
          filter: "blur(1px)",
        }}
        animate={{ rotate: 360, scale: listening ? [1, 1.08, 1] : [1, 1.03, 1] }}
        transition={{ rotate: { duration: 6, repeat: Infinity, ease: "linear" }, scale: { duration: 2.2, repeat: Infinity, ease: "easeInOut" } }}
      />
      <motion.div
        className="relative h-36 w-36 rounded-full border border-cyan-200/40 bg-[radial-gradient(circle_at_35%_30%,rgba(255,255,255,0.9),rgba(34,211,238,0.55)_35%,rgba(8,47,73,0.95)_75%)] shadow-[0_0_60px_rgba(34,211,238,0.45),inset_0_0_30px_rgba(255,255,255,0.18)]"
        animate={{ scale: thinking ? [1, 0.96, 1.04, 1] : listening ? [1, 1.05, 1] : [1, 1.02, 1] }}
        transition={{ duration: thinking ? 1.4 : 2.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="absolute inset-3 rounded-full border border-white/20" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="h-8 w-8 text-cyan-50/90" />
        </div>
      </motion.div>
      <div className="absolute -bottom-10 flex gap-1.5">
        {Array.from({ length: 24 }).map((_, i) => (
          <motion.span
            key={i}
            className="w-1 rounded-full bg-cyan-300/70"
            animate={{ height: listening ? [6, 18 + (i % 5) * 6, 6] : thinking ? [5, 12 + (i % 4) * 4, 5] : [4, 8 + (i % 3) * 3, 4], opacity: [0.35, 0.95, 0.35] }}
            transition={{ duration: listening ? 0.7 : 1.2, repeat: Infinity, delay: i * 0.03, ease: "easeInOut" }}
          />
        ))}
      </div>
    </div>
  );
}

export function JarvisApp() {
  const [booted, setBooted] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [listening, setListening] = useState(false);
  const [assistantMode, setAssistantMode] = useState<"unknown" | "backend" | "simulation">("unknown");
  const [modules, setModules] = useState<Module[]>([
    { id: "voice", name: "Voice", desc: "Speech I/O", on: true },
    { id: "vision", name: "Vision", desc: "Scene understanding", on: false },
    { id: "memory", name: "Memory", desc: "Local context store", on: true },
    { id: "agents", name: "Agents", desc: "Tool orchestration", on: true },
    { id: "automations", name: "Automations", desc: "Schedules & triggers", on: false },
    { id: "telemetry", name: "Telemetry", desc: "Energy & performance", on: true },
  ]);
  const [logs, setLogs] = useState<string[]>([
    "[ok] ui.renderer online",
    "[ok] local.session secured",
    "[ok] animation.pipeline warmed",
  ]);
  const logRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setBooted(true), 1800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [logs]);

  useEffect(() => {
    const id = setInterval(() => {
      const samples = [
        "[metric] inference.latency 42ms",
        "[metric] ui.frame 60fps",
        "[ok] memory.index synced",
        "[metric] cpu 31% mem 47%",
        "[ok] agent.router idle",
      ];
      setLogs((l) => [...l.slice(-40), samples[Math.floor(Math.random() * samples.length)]]);
    }, 3500);
    return () => clearInterval(id);
  }, []);

  const stats = useMemo(
    () => [
      { label: "CPU", value: 34, icon: Cpu, color: "from-cyan-400 to-blue-500" },
      { label: "Memory", value: 48, icon: Brain, color: "from-emerald-400 to-cyan-500" },
      { label: "Network", value: 92, icon: Wifi, color: "from-violet-400 to-fuchsia-500" },
      { label: "Power", value: 76, icon: Gauge, color: "from-amber-400 to-orange-500" },
    ],
    []
  );

  function pushLog(line: string) {
    setLogs((l) => [...l.slice(-60), line]);
  }

  function toggleModule(id: string) {
    setModules((ms) =>
      ms.map((m) => {
        if (m.id !== id) return m;
        const on = !m.on;
        pushLog(`[module] ${m.name.toLowerCase()} ${on ? "enabled" : "disabled"}`);
        return { ...m, on };
      })
    );
  }

  async function send(text?: string) {
    const value = (text ?? input).trim();
    if (!value || thinking) return;
    setInput("");
    const userMsg: Message = { id: uid(), role: "user", text: value, time: now() };
    const history = [...messages, userMsg];
    setMessages(history);
    pushLog(`[input] ${value.slice(0, 48)}`);
    setThinking(true);

    try {
      const apiMessages = history
        .filter((m) => m.role === "user" || m.role === "jarvis")
        .slice(-16)
        .map((m) => ({
          role: m.role === "jarvis" ? "assistant" : "user",
          content: m.text,
        }));

      let handled = false;
      try {
        const res = await fetch("/api/jarvis/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: apiMessages }),
        });

        if (res.ok) {
          const data = (await res.json()) as { reply?: string; model?: string };
          const replyText = data.reply?.trim();
          if (replyText) {
            setAssistantMode("backend");
            setMessages((m) => [
              ...m,
              { id: uid(), role: "jarvis", text: replyText, time: now(), tag: "LIVE" },
            ]);
            pushLog(`[reply] backend${data.model ? `:${data.model}` : ""}`);
            handled = true;
          }
        } else {
          const data = (await res.json().catch(() => ({}))) as { error?: string; hint?: string };
          if (res.status === 501) {
            setAssistantMode("simulation");
            pushLog("[backend] not configured, using simulation");
          } else if (data?.error) {
            pushLog(`[backend] ${String(data.error).slice(0, 80)}`);
            setMessages((m) => [
              ...m,
              {
                id: uid(),
                role: "system",
                text: `Backend error: ${data.error}${data.hint ? ` ${data.hint}` : ""}`,
                time: now(),
                tag: "ERROR",
              },
            ]);
            handled = true;
          }
        }
      } catch {
        setAssistantMode("simulation");
        pushLog("[backend] unreachable, using simulation");
      }

      if (!handled) {
        await new Promise((r) => setTimeout(r, 450 + Math.random() * 500));
        const reply = jarvisReply(value);
        setAssistantMode((mode) => (mode === "backend" ? "backend" : "simulation"));
        setMessages((m) => [
          ...m,
          { id: uid(), role: "jarvis", text: reply.text, time: now(), tag: reply.tag ?? "SIM" },
        ]);
        pushLog(`[reply] ${reply.tag ?? "simulation"} generated`);
      }
    } finally {
      setThinking(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] overflow-hidden bg-[#020611] text-cyan-50">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(14,116,144,0.35),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(37,99,235,0.22),transparent_45%),radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.12),transparent_40%)]" />
        <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: "linear-gradient(rgba(103,232,249,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(103,232,249,0.12) 1px, transparent 1px)", backgroundSize: "48px 48px", maskImage: "radial-gradient(circle at center, black 35%, transparent 95%)" }} />
        {Array.from({ length: 18 }).map((_, i) => (
          <motion.span
            key={i}
            className="absolute h-1 w-1 rounded-full bg-cyan-300/60"
            style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%` }}
            animate={{ y: [0, -30 - (i % 5) * 10, 0], opacity: [0.1, 0.7, 0.1] }}
            transition={{ duration: 6 + (i % 5), repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
          />
        ))}
      </div>

      <AnimatePresence>
        {!booted && (
          <motion.div
            className="absolute inset-0 z-50 flex items-center justify-center bg-[#020611]"
            exit={{ opacity: 0, filter: "blur(8px)" }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-[min(520px,90vw)] space-y-6 text-center">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mx-auto h-20 w-20 rounded-full border border-cyan-300/40 bg-cyan-400/10 p-4 shadow-[0_0_40px_rgba(34,211,238,0.25)]">
                <Sparkles className="h-full w-full text-cyan-300" />
              </motion.div>
              <div>
                <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="font-[family-name:var(--font-display)] text-4xl font-semibold tracking-[0.2em] text-cyan-100">
                  J.A.R.V.I.S
                </motion.h1>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-2 text-sm text-cyan-200/60">
                  Just A Rather Very Intelligent System
                </motion.p>
              </div>
              <div className="space-y-2 text-left font-mono text-xs text-cyan-200/70">
                {["Loading neural interface...", "Mounting local modules...", "Calibrating motion systems...", "Ready."].map((line, i) => (
                  <motion.div key={line} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 * i }}>
                    <span className="text-cyan-400">›</span> {line}
                  </motion.div>
                ))}
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-cyan-950/80 ring-1 ring-cyan-400/20">
                <motion.div className="h-full bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 1.6, ease: "easeInOut" }} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 grid h-full grid-rows-[auto_1fr]">
        <header className="flex items-center justify-between border-b border-cyan-400/15 bg-[#07111f]/55 px-4 py-3 backdrop-blur-xl md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/30 bg-cyan-400/10 shadow-[0_0_20px_rgba(34,211,238,0.15)]">
              <Bot className="h-5 w-5 text-cyan-300" />
            </div>
            <div>
              <div className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-wide text-cyan-50">JARVIS</div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-cyan-300/60">OpenJarvis-inspired local AI interface</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-cyan-100/80">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />Online</span>
            <span className={`hidden rounded-full border px-2.5 py-1 sm:inline-flex items-center gap-1.5 ${assistantMode === "backend" ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-100" : "border-cyan-400/20 bg-cyan-400/5 text-cyan-100/80"}`}>
              <Shield className="h-3.5 w-3.5" />{assistantMode === "backend" ? "Live backend" : assistantMode === "simulation" ? "Simulation mode" : "Assistant ready"}
            </span>
            <button className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-400/20 bg-white/5 hover:bg-white/10" title="Settings"><Settings2 className="h-4 w-4" /></button>
          </div>
        </header>

        <main className="grid min-h-0 grid-cols-1 gap-3 p-3 md:p-4 xl:grid-cols-[320px_minmax(0,1fr)_340px]">
          <section className="order-2 flex min-h-0 flex-col gap-3 xl:order-1">
            <Panel title="Core Telemetry" icon={Activity}>
              <div className="grid grid-cols-2 gap-3">
                {stats.map((s) => (
                  <div key={s.label} className="rounded-xl border border-cyan-400/10 bg-white/[0.03] p-3">
                    <div className="mb-2 flex items-center justify-between text-xs text-cyan-100/70">
                      <span className="inline-flex items-center gap-1.5"><s.icon className="h-3.5 w-3.5 text-cyan-300" />{s.label}</span>
                      <span>{s.value}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-cyan-950/70">
                      <motion.div className={`h-full bg-gradient-to-r ${s.color}`} initial={{ width: 0 }} animate={{ width: `${s.value}%` }} transition={{ duration: 1, ease: "easeOut" }} />
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel title="Modules" icon={Cpu} className="min-h-0 flex-1">
              <div className="space-y-2 overflow-auto pr-1">
                {modules.map((m) => (
                  <button key={m.id} onClick={() => toggleModule(m.id)} className="flex w-full items-center justify-between rounded-xl border border-cyan-400/10 bg-white/[0.03] p-3 text-left transition hover:border-cyan-300/25 hover:bg-cyan-400/[0.06]">
                    <div>
                      <div className="text-sm font-medium text-cyan-50">{m.name}</div>
                      <div className="text-xs text-cyan-200/55">{m.desc}</div>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${m.on ? "bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/30" : "bg-white/5 text-cyan-200/50 ring-1 ring-white/10"}`}>{m.on ? "ON" : "OFF"}</span>
                  </button>
                ))}
              </div>
            </Panel>
          </section>

          <section className="order-1 flex min-h-0 flex-col gap-3 xl:order-2">
            <Panel className="relative overflow-hidden">
              <div className="flex flex-col items-center justify-center py-4 md:py-6">
                <Orb listening={listening} thinking={thinking} />
                <div className="mt-12 text-center">
                  <div className="text-sm text-cyan-100/80">{thinking ? "Processing request..." : listening ? "Listening..." : "Awaiting command"}</div>
                  <div className="mt-1 text-xs text-cyan-300/50">{assistantMode === "backend" ? "Live assistant connected" : "Local-first · Private · Modular"}</div>
                </div>
              </div>
            </Panel>

            <Panel title="Conversation" icon={TerminalSquare} className="min-h-0 flex-1">
              <div ref={chatRef} className="flex h-full min-h-[260px] flex-col gap-3 overflow-auto pr-1">
                {messages.map((m) => (
                  <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`max-w-[92%] rounded-2xl border px-3.5 py-2.5 ${m.role === "user" ? "ml-auto border-cyan-300/20 bg-cyan-400/15" : m.role === "system" ? "border-amber-300/20 bg-amber-400/10 text-amber-50" : "border-cyan-400/10 bg-white/[0.04]"}`}>
                    <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-cyan-200/50">
                      <span>{m.role}</span>{m.tag && <span className="rounded bg-cyan-300/10 px-1.5 py-0.5 text-cyan-200/70">{m.tag}</span>}<span className="ml-auto">{m.time}</span>
                    </div>
                    <div className="text-sm leading-relaxed text-cyan-50/95">{m.text}</div>
                  </motion.div>
                ))}
                {thinking && (
                  <div className="inline-flex items-center gap-2 self-start rounded-2xl border border-cyan-400/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-cyan-100/80">
                    <span className="flex gap-1"><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-300 [animation-delay:0ms]" /><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-300 [animation-delay:120ms]" /><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-300 [animation-delay:240ms]" /></span>
                    JARVIS is thinking
                  </div>
                )}
              </div>
              <form
                className="mt-3 flex items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  void send();
                }}
              >
                <button type="button" onClick={() => { setListening((v) => !v); pushLog(`[voice] listening ${!listening ? "started" : "stopped"}`); }} className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border transition ${listening ? "border-cyan-300/50 bg-cyan-400/20 text-cyan-100" : "border-cyan-400/15 bg-white/[0.03] text-cyan-200/70 hover:bg-white/[0.08]"}`} title="Voice (simulated)">
                  <Mic className="h-4.5 w-4.5" />
                </button>
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-300/40" />
                  <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask JARVIS anything..." className="h-11 w-full rounded-xl border border-cyan-400/15 bg-[#07111f]/70 pl-9 pr-3 text-sm text-cyan-50 placeholder:text-cyan-200/35 outline-none ring-cyan-300/30 transition focus:border-cyan-300/35 focus:ring-2" />
                </div>
                <button type="submit" className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 text-sm font-semibold text-white shadow-[0_0_24px_rgba(34,211,238,0.25)] transition hover:brightness-110 active:scale-[0.98]">
                  <Send className="h-4 w-4" /> Send
                </button>
              </form>
              <div className="mt-2 flex flex-wrap gap-2">
                {["System status", "What is OpenJarvis?", "Run a research task", "Enable vision module"].map((q) => (
                  <button key={q} onClick={() => void send(q)} className="rounded-full border border-cyan-400/15 bg-white/[0.03] px-3 py-1 text-xs text-cyan-100/75 hover:bg-cyan-400/10">
                    {q}
                  </button>
                ))}
              </div>
            </Panel>
          </section>

          <section className="order-3 flex min-h-0 flex-col gap-3">
            <Panel title="Capabilities" icon={Sparkles}>
              <div className="grid gap-2 text-sm">
                {[
                  { icon: Brain, label: "Local reasoning", desc: "On-device first workflows" },
                  { icon: Radio, label: "Tool orchestration", desc: "Agents, skills & automations" },
                  { icon: Volume2, label: "Voice & alerts", desc: "Speech and event feedback" },
                  { icon: Shield, label: "Private by design", desc: "Personal data stays local" },
                ].map((c) => (
                  <div key={c.label} className="flex items-start gap-3 rounded-xl border border-cyan-400/10 bg-white/[0.03] p-3">
                    <c.icon className="mt-0.5 h-4 w-4 text-cyan-300" />
                    <div><div className="font-medium text-cyan-50">{c.label}</div><div className="text-xs text-cyan-200/55">{c.desc}</div></div>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel title="Event Console" icon={TerminalSquare} className="min-h-0 flex-1">
              <div ref={logRef} className="h-full min-h-[220px] overflow-auto rounded-xl border border-cyan-400/10 bg-[#030a14]/80 p-3 font-mono text-[11px] leading-relaxed text-cyan-200/75">
                {logs.map((l, i) => (
                  <div key={i} className="whitespace-pre-wrap"><span className="text-cyan-500/60">{String(i + 1).padStart(2, "0")}</span> {l}</div>
                ))}
              </div>
            </Panel>
            <Panel>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-cyan-50">Power State</div>
                  <div className="text-xs text-cyan-200/55">Session active · {modules.filter((m) => m.on).length} modules online</div>
                </div>
                <button onClick={() => { setBooted(false); setTimeout(() => setBooted(true), 1500); pushLog("[sys] interface rebooted"); }} className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-sm font-medium text-cyan-100 hover:bg-cyan-400/20">
                  <Power className="h-4 w-4" /> Reboot
                </button>
              </div>
            </Panel>
          </section>
        </main>
      </div>
    </div>
  );
}

function Panel({
  title,
  icon: Icon,
  children,
  className = "",
}: {
  title?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className={`flex min-h-0 flex-col rounded-2xl border border-cyan-400/15 bg-[#07111f]/55 p-3 shadow-[0_0_0_1px_rgba(34,211,238,0.03),0_20px_60px_-30px_rgba(0,0,0,0.8)] backdrop-blur-xl ${className}`}
    >
      {title && (
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200/70">
          {Icon && <Icon className="h-4 w-4 text-cyan-300" />}
          <span>{title}</span>
        </div>
      )}
      <div className="min-h-0 flex-1">{children}</div>
    </motion.section>
  );
}
