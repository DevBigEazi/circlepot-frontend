import React, { useState, useEffect } from "react";

interface CountdownTimerProps {
  deadline: bigint; // Unix timestamp in seconds
  colors: any;
  onExpire?: () => void;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({
  deadline,
  colors,
  onExpire,
}) => {
  const calculateTimeRemaining = (): TimeRemaining => {
    const now = Math.floor(Date.now() / 1000); // Current time in seconds
    const deadlineSeconds = Number(deadline);
    const difference = deadlineSeconds - now;

    if (difference <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isExpired: true,
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
