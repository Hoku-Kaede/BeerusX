"use client";

import { useState } from "react";
import { AquariumExperience } from "@/components/aquarium/aquarium-experience";
import { SplashScreen } from "@/components/splash-screen";

export function AquariumLanding() {
  const [splashDone, setSplashDone] = useState(false);
  return (
    <>
      {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
      <div style={{ opacity: splashDone ? 1 : 0, transition: "opacity 0.6s ease" }}>
        <AquariumExperience />
      </div>
    </>
  );
}