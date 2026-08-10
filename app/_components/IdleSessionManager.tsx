"use client";

import { useEffect, useRef } from "react";
import { signOut, useSession } from "next-auth/react";
import { toast } from "sonner";

const IDLE_TIMEOUT_MS = 10 * 60 * 1000;
const WARNING_MS = 60 * 1000;
const ACTIVITY_KEY = "gaar:last-activity";

export default function IdleSessionManager() {
  const { status } = useSession();
  const loggingOut = useRef(false);
  const warned = useRef(false);
  const lastWrite = useRef(0);

  useEffect(() => {
    if (status !== "authenticated") return;

    const recordActivity = () => {
      const now = Date.now();
      if (now - lastWrite.current < 1000) return;
      lastWrite.current = now;
      warned.current = false;
      localStorage.setItem(ACTIVITY_KEY, String(now));
    };

    const logoutForInactivity = async () => {
      if (loggingOut.current) return;
      loggingOut.current = true;
      localStorage.removeItem(ACTIVITY_KEY);
      await signOut({ redirect: false });
      window.location.assign("/?reason=idle");
    };

    recordActivity();

    const checkIdleTime = () => {
      const lastActivity = Number(localStorage.getItem(ACTIVITY_KEY)) || Date.now();
      const inactiveFor = Date.now() - lastActivity;

      if (inactiveFor >= IDLE_TIMEOUT_MS) {
        void logoutForInactivity();
      } else if (inactiveFor >= IDLE_TIMEOUT_MS - WARNING_MS && !warned.current) {
        warned.current = true;
        toast.warning("Your session will end in 1 minute due to inactivity.");
      }
    };

    const events: (keyof WindowEventMap)[] = [
      "pointerdown",
      "keydown",
      "scroll",
      "touchstart",
    ];
    events.forEach((event) => window.addEventListener(event, recordActivity, { passive: true }));
    window.addEventListener("storage", checkIdleTime);
    const interval = window.setInterval(checkIdleTime, 5000);

    return () => {
      events.forEach((event) => window.removeEventListener(event, recordActivity));
      window.removeEventListener("storage", checkIdleTime);
      window.clearInterval(interval);
    };
  }, [status]);

  return null;
}
