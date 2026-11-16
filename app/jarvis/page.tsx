import type { Metadata } from "next";
import { JarvisApp } from "@/components/jarvis/jarvis-app";

export const metadata: Metadata = {
  title: "JARVIS — Personal AI Interface",
  description: "A cinematic Jarvis-style personal AI GUI with live interactions and animations.",
};

export default function JarvisPage() {
  return <JarvisApp />;
}
