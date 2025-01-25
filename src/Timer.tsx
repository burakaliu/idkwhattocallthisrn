import React, { useEffect, useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { CountdownCircleTimer } from "react-countdown-circle-timer";

const Timer: React.FC = () => {
  const [minutes, setMinutes] = useState<number>(() => {
    const saved = localStorage.getItem("timerMinutes");
    return saved ? parseInt(saved) : 5;
  });
  const [key, setKey] = useState<number>(0);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Initialize timer state on mount
  useEffect(() => {
    const fetchRemainingTime = async () => {
      const timeLeft = await invoke<number>("get_time_left");
      setRemainingTime(timeLeft);
      // Only set isPlaying to true if there's active time left
      setIsPlaying(timeLeft > 0);
    };
    fetchRemainingTime();
  }, []);

  useEffect(() => {
    localStorage.setItem("timerMinutes", minutes.toString());
  }, [minutes]);

  const handleStart = async () => {
    try {
      await invoke<null>("start_timer", {
        seconds: minutes * 60,
      });
      const time_left = await invoke<number>("get_time_left");
      setRemainingTime(time_left);
      setIsPlaying(true);
      setKey((prevKey) => prevKey + 1);
    } catch (error) {
      console.error("Failed to start timer:", error);
    }
  };

  const getTimeLeft = async () => {
    try {
      const timeLeft = await invoke<number>("get_time_left");
      setRemainingTime(timeLeft);
      return timeLeft;
    } catch (error) {
      console.error("Failed to get time left:", error);
    }
    return 0;
  };

  const handleMinutesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(event.target.value) || 1;
    setMinutes(Math.max(1, Math.min(60, newValue)));
    setIsPlaying(false);
    setRemainingTime(newValue * 60);
    setKey((prevKey) => prevKey + 1);
  };

  return (
    <>
      <div className="flex flex-col items-center gap-4 p-4">
        {remainingTime !== null ? (
          <CountdownCircleTimer
            key={key}
            isPlaying={isPlaying}
            duration={minutes * 60}
            colors={["#004777", "#F7B801", "#A30000", "#A30000"]}
            colorsTime={[7, 5, 2, 0]}
            initialRemainingTime={remainingTime}
            onComplete={() => {
              setIsPlaying(false);
              return { shouldRepeat: false };
            }}
          >
            {({ remainingTime }) => formatTime(remainingTime)}
          </CountdownCircleTimer>
        ) : (
          <p>Loading...</p>
        )}
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={minutes}
            onChange={handleMinutesChange}
            min="1"
            max="60"
            className="w-20 px-2 py-1 border rounded"
          />
          <span>minutes</span>
        </div>
        <button
          onClick={handleStart}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Start Timer
        </button>
        <p>Minutes: {minutes}</p>
        <button
          onClick={() => getTimeLeft()}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Get Time Left
        </button>
      </div>
    </>
  );
};

export default Timer;

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};
