"use client";

import { useState } from "react";
import { BroadcastIcon } from "./icons";

type Result =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "ok"; detail: string }
  | { state: "error"; detail: string };

export function ConnectionTester() {
  const [result, setResult] = useState<Result>({ state: "idle" });

  async function test() {
    setResult({ state: "loading" });
    try {
      const response = await fetch("/api/health", { cache: "no-store" });
      const payload = (await response.json()) as {
        mode?: string;
        connected?: boolean;
        status?: { version?: string; osName?: string };
        error?: string;
      };

      if (payload.mode === "demo") {
        setResult({
          state: "ok",
          detail: "Demo mode is active — no Sonarr credentials configured, using bundled data.",
        });
        return;
      }

      if (payload.connected) {
        setResult({
          state: "ok",
          detail: `Connected to Sonarr ${payload.status?.version ?? ""} on ${
            payload.status?.osName ?? "your host"
          }.`,
        });
      } else {
        setResult({ state: "error", detail: payload.error ?? "Connection failed." });
      }
    } catch (error) {
      setResult({
        state: "error",
        detail: error instanceof Error ? error.message : "Request failed.",
      });
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => void test()}
        disabled={result.state === "loading"}
        className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.05] px-4 py-2 text-[12.5px] font-medium text-mist-200 transition hover:border-white/40 hover:text-white disabled:opacity-50"
      >
        <BroadcastIcon className="size-3.5" />
        {result.state === "loading" ? "Testing…" : "Test connection"}
      </button>

      {result.state === "ok" && (
        <p className="mt-3 flex items-start gap-2 text-[12px] leading-relaxed text-signal-400">
          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-signal-400" />
          {result.detail}
        </p>
      )}
      {result.state === "error" && (
        <p className="mt-3 flex items-start gap-2 break-words text-[12px] leading-relaxed text-red-300">
          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-red-400" />
          {result.detail}
        </p>
      )}
    </div>
  );
}
