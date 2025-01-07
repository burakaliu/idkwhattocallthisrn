import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { CountdownCircleTimer } from "react-countdown-circle-timer";
import { Play, Pause } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

interface TimerSettings {
  customization: {
    theme: {
      primary: string;
      secondary: string;
      accent: string;
    };
  };
  general: {
    timer_defaults: {
      work_duration: number;
      break_duration: number;
    };
  };
}

interface TimerState {
  remaining_time: number;
  last_updated: number;
  is_playing: boolean;
}

const TimerPage: React.FC = () => {
  const [initialTime, setInitialTime] = useState<number>(2);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [themeColors, setThemeColors] = useState<
    TimerSettings["customization"]["theme"]
  >({
    primary: "#004777",
    secondary: "#F7B801",
    accent: "#10B981",
  });

  const [dimensions, setDimensions] = useState({
    timerSize: 0,
    strokeWidth: 0,
    fontSize: 0,
    buttonSize: 0,
  });

  useEffect(() => {
    const fetchTimerState = async () => {
      try {
        const state = await invoke<TimerState>("load_timer_state");
        if (state.remaining_time > 0) {
          const now = Math.floor(Date.now() / 1000);
          const elapsed = now - state.last_updated;
          const newTime = Math.max(0, state.remaining_time - elapsed);
          setInitialTime(newTime / 60); // Convert back to minutes
          setIsPlaying(state.is_playing);
        }
      } catch (error) {
        console.error("Failed to load timer state:", error);
      }
    };

    fetchTimerState();
  }, []);

  // Handle responsive sizing (remaining code unchanged)
  useEffect(() => {
    const calculateDimensions = () => {
      const minDimension = Math.min(window.innerWidth, window.innerHeight);
      const containerSize = minDimension * 0.8;

      const timerSize = Math.min(containerSize, 600);
      const strokeWidth = timerSize * 0.1;
      const fontSize = timerSize * 0.2;
      const buttonSize = timerSize * 0.15;

      setDimensions({
        timerSize,
        strokeWidth,
        fontSize,
        buttonSize,
      });
    };

    calculateDimensions();
    window.addEventListener("resize", calculateDimensions);
    return () => window.removeEventListener("resize", calculateDimensions);
  }, []);

  const formatTime = ({ remainingTime }: { remainingTime: number }) => {
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    const paddedSeconds = seconds < 10 ? `0${seconds}` : seconds;
    return `${minutes}:${paddedSeconds}`;
  };

  const handlePlayPause = () => {
    setIsPlaying((prev) => {
      const newState = !prev;
      saveTimerState(initialTime * 60, newState);
      return newState;
    });
  };

  const saveTimerState = async (time: number, playing: boolean) => {
    try {
      await invoke("save_timer_state", {
        state: {
          remaining_time: time,
          is_playing: playing,
          last_updated: Math.floor(Date.now() / 1000),
        },
      });
    } catch (error) {
      console.error("Failed to save timer state:", error);
    }
  };

  // Periodically save timer state
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlaying) {
        saveTimerState(initialTime * 60, isPlaying);
      }
    }, 100); // Save every 5 seconds

    return () => clearInterval(interval);
  }, [isPlaying, initialTime]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div
        className="relative flex flex-col items-center"
        style={{ width: dimensions.timerSize, height: dimensions.timerSize }}
      >
        <CountdownCircleTimer
          isPlaying={isPlaying}
          duration={initialTime * 60}
          colors={[`#${themeColors.primary}`, `#${themeColors.secondary}`]}
          colorsTime={[initialTime * 60, 0]}
          size={dimensions.timerSize}
          strokeLinecap="round"
          strokeWidth={dimensions.strokeWidth}
          initialRemainingTime={2 * 60}
          onComplete={() => {
            return { shouldRepeat: false };
          }}
        >
          {({ remainingTime }) => (
            <div
              className="flex flex-col items-center justify-center"
              style={{ gap: dimensions.strokeWidth * 0.5 }}
            >
              <div
                className="timer-text font-bold"
                style={{ fontSize: dimensions.fontSize }}
              >
                {formatTime({ remainingTime })}
              </div>
              <button
                onClick={handlePlayPause}
                className="rounded-full p-2 transition-colors duration-200"
                style={{
                  backgroundColor: themeColors.accent,
                  width: dimensions.buttonSize,
                  height: dimensions.buttonSize,
                }}
              >
                {isPlaying ? (
                  <Pause
                    size={dimensions.buttonSize * 0.6}
                    className="text-white mx-auto"
                  />
                ) : (
                  <Play
                    size={dimensions.buttonSize * 0.6}
                    className="text-white mx-auto"
                  />
                )}
              </button>
            </div>
          )}
        </CountdownCircleTimer>
      </div>
    </div>
  );
};

export default TimerPage;
