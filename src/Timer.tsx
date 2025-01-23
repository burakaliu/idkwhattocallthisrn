import React, { useEffect, useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { CountdownCircleTimer } from "react-countdown-circle-timer";

const Timer: React.FC = () => {
  const [minutes, setMinutes] = useState<number>(() => {
    const saved = localStorage.getItem("timerMinutes");
    return saved ? parseInt(saved) : 5;
  });
  const [key, setKey] = useState<number>(0); // Force timer re-render
  const [remainingTime, setRemainingTime] = useState<number | null>(null);

  // Initialize timer state on mount
  useEffect(() => {
    const fetchRemainingTime = async () => {
      const timeLeft = await invoke<number>("get_time_left");
      setRemainingTime(timeLeft);
    };
    fetchRemainingTime();
  }, []);

  useEffect(() => {
    localStorage.setItem("timerMinutes", minutes.toString());
  }, [minutes]);

  const handleStart = async () => {
    console.log("minutes", minutes);
    try {
      const newState = await invoke<null>("start_timer", {
        seconds: minutes * 60,
      });
      const time_left = await invoke<number>("get_time_left");
      setRemainingTime(time_left);
      setKey((prevKey) => prevKey + 1); // Force timer re
    } catch (error) {
      console.error("Failed to start timer:", error);
    }
  };

  const getTimeLeft = async () => {
    try {
      const timeLeft = await invoke<number>("get_time_left");
      console.log("timeLeft", timeLeft);
      return timeLeft;
    } catch (error) {
      console.error("Failed to get time left:", error);
    }
    return 0;
  };

  return (
    <>
      <div className="flex flex-col items-center gap-4 p-4">
        {remainingTime !== null ? (
          <CountdownCircleTimer
            key={key}
            isPlaying={true}
            duration={minutes * 60} // Adjust duration as needed
            colors={["#004777", "#F7B801", "#A30000", "#A30000"]}
            colorsTime={[7, 5, 2, 0]}
            initialRemainingTime={remainingTime} // Use the updated value
          >
            {({ remainingTime }) => remainingTime}
          </CountdownCircleTimer>
        ) : (
          <p>Loading...</p> // Placeholder while remainingTime is being fetched
        )}
        <button
          onClick={handleStart}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          test
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
