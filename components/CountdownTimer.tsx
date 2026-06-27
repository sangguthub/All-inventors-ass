"use client";

import { useEffect, useState } from "react";

interface CountdownTimerProps {
  expiresAt: string;
}

export function CountdownTimer({ expiresAt }: CountdownTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState<number>(0);

  useEffect(() => {
    const calc = () => {
      const diff = Math.max(
        0,
        Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)
      );
      setSecondsLeft(diff);
    };

    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const isUrgent = secondsLeft <= 60;
  const isExpired = secondsLeft === 0;

  return (
    <span
      className={`font-mono font-semibold text-lg tabular-nums ${
        isExpired
          ? "text-gray-400"
          : isUrgent
          ? "text-red-600 animate-pulse"
          : "text-green-700"
      }`}
    >
      {isExpired
        ? "Expired"
        : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`}
    </span>
  );
}
