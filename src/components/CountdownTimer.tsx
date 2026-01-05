import React, { useState, useEffect } from "react";

interface CountdownTimerProps {
  deadline: bigint; // Unix timestamp in seconds
  colors: any;
  onExpire?: () => void;
  showLateTime?: boolean; // If true, show "Late by X" when expired
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  isLate?: boolean; // indicates if we're past deadline
  lateDays?: number;
  lateHours?: number;
  lateMinutes?: number;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({
  deadline,
  colors,
  onExpire,
  showLateTime = false,
}) => {
  const calculateTimeRemaining = (): TimeRemaining => {
    const now = Math.floor(Date.now() / 1000); // Current time in seconds
    const deadlineSeconds = Number(deadline);
    const difference = deadlineSeconds - now;

    if (difference <= 0) {
      // Calculate how late we are
      const lateDifference = Math.abs(difference);
      const lateDays = Math.floor(lateDifference / (60 * 60 * 24));
      const lateHours = Math.floor(
        (lateDifference % (60 * 60 * 24)) / (60 * 60)
      );
      const lateMinutes = Math.floor((lateDifference % (60 * 60)) / 60);

      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isExpired: true,
        isLate: true,
        lateDays,
        lateHours,
        lateMinutes,
      };
    }

    const days = Math.floor(difference / (60 * 60 * 24));
    const hours = Math.floor((difference % (60 * 60 * 24)) / (60 * 60));
    const minutes = Math.floor((difference % (60 * 60)) / 60);
    const seconds = difference % 60;

    return {
      days,
      hours,
      minutes,
      seconds,
      isExpired: false,
      isLate: false,
    };
  };

  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(
    calculateTimeRemaining()
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const newTime = calculateTimeRemaining();
      setTimeRemaining(newTime);

      if (newTime.isExpired && onExpire) {
        onExpire();
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [deadline, onExpire]);

  if (timeRemaining.isExpired) {
    // Show "Late by" time if enabled
    if (showLateTime && timeRemaining.isLate) {
      const { lateDays = 0, lateHours = 0, lateMinutes = 0 } = timeRemaining;

      let lateText = "Late by ";
      if (lateDays > 0) {
        lateText += `${lateDays}d ${lateHours}h`;
      } else if (lateHours > 0) {
        lateText += `${lateHours}h ${lateMinutes}m`;
      } else {
        lateText += `${lateMinutes}m`;
      }

      return (
        <div
          className="text-xs sm:text-sm font-semibold"
          style={{ color: "#EF4444" }}
        >
          {lateText}
        </div>
      );
    }

    // Default expired message
    return (
      <div
        className="text-xs sm:text-sm font-semibold"
        style={{ color: "#EF4444" }}
      >
        Deadline Passed
      </div>
    );
  }

  const formatUnit = (value: number, label: string) => {
    if (value === 0) return null;
    return (
      <span className="inline-flex items-baseline gap-0.5">
        <span
          className="font-bold text-sm sm:text-base"
          style={{ color: colors.text }}
        >
          {value}
        </span>
        <span
          className="text-[10px] sm:text-xs opacity-70"
          style={{ color: colors.textLight }}
        >
          {label}
        </span>
      </span>
    );
  };

  return (
    <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
      {timeRemaining.days > 0 && formatUnit(timeRemaining.days, "d")}
      {(timeRemaining.days > 0 || timeRemaining.hours > 0) &&
        formatUnit(timeRemaining.hours, "h")}
      {(timeRemaining.days > 0 ||
        timeRemaining.hours > 0 ||
        timeRemaining.minutes > 0) &&
        formatUnit(timeRemaining.minutes, "m")}
      {timeRemaining.days === 0 && formatUnit(timeRemaining.seconds, "s")}
    </div>
  );
};

export default CountdownTimer;
