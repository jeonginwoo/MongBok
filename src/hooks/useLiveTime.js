"use client";

import { useState, useEffect } from "react";
import dayjs from "dayjs";

// 방송 시작 시각(openDate) 기준 경과 시간 문자열.
// 1일 미만 "HH:MM:SS", 1일 이상 "3D 7H", 1년 이상 "1Y 42D"
export function useLiveTime(channel) {
  const [time, setTime] = useState("00:00:00");

  useEffect(() => {
    if (!channel?.openDate) return;

    if (!channel.isLive) {
      setTime("00:00:00");
      return;
    }

    const updateTimer = () => {
      const now = dayjs();
      const start = dayjs(channel.openDate);
      const diff = now.diff(start);

      if (diff >= 0) {
        const totalSeconds = Math.floor(diff / 1000);
        const totalMinutes = Math.floor(totalSeconds / 60);
        const totalHours = Math.floor(totalMinutes / 60);
        const totalDays = Math.floor(totalHours / 24);
        const totalYears = Math.floor(totalDays / 365);

        if (totalYears >= 1) {
          const remainingDays = totalDays - totalYears * 365;
          setTime(`${totalYears}Y ${remainingDays}D`);
        } else if (totalDays >= 1) {
          const remainingHours = totalHours - totalDays * 24;
          setTime(`${totalDays}D ${remainingHours}H`);
        } else {
          const hours = totalHours;
          const minutes = Math.floor((totalSeconds / 60) % 60);
          const seconds = totalSeconds % 60;
          setTime(
            `${hours.toString().padStart(2, "0")}:${minutes
              .toString()
              .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
          );
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [channel?.openDate, channel?.isLive]);

  return time;
}
