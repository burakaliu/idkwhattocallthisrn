import React, { useEffect, useState, useRef } from 'react';
import { invoke } from "@tauri-apps/api/core";
import { CountdownCircleTimer } from 'react-countdown-circle-timer';

interface TimerState {
  start_time: number | null;
  duration: number;
  elapsed: number;
  is_paused: boolean;
}

const Timer: React.FC = () => {
  const [minutes, setMinutes] = useState<number>(() => {
    const saved = localStorage.getItem('timerMinutes');
    return saved ? parseInt(saved) : 5;
  });
  const [timerState, setTimerState] = useState<TimerState | null>(null);
  const [key, setKey] = useState(0); // Force timer re-render
  
  // Initialize timer state on mount
  useEffect(() => {
    const initializeTimerState = async () => {
      try {
        const currentState = await invoke<TimerState>('get_timer_state');
        if (currentState.duration > 0) {
          setTimerState(currentState);
          setMinutes(Math.ceil(currentState.duration / (60 * 1000)));
          setKey(prev => prev + 1); // Force timer reset
        }
      } catch (error) {
        console.error('Failed to get timer state:', error);
      }
    };

    initializeTimerState();
  }, []);

  useEffect(() => {
    localStorage.setItem('timerMinutes', minutes.toString());
  }, [minutes]);

  // Poll timer state from backend
  useEffect(() => {
    const intervalId = setInterval(async () => {
      try {
        const newState = await invoke<TimerState>('get_timer_state');
        if (newState.duration > 0) {
          setTimerState(prevState => {
            // Only update if there's a meaningful change
            if (!prevState || 
                prevState.elapsed !== newState.elapsed || 
                prevState.is_paused !== newState.is_paused) {
              return newState;
            }
            return prevState;
          });
        }
      } catch (error) {
        console.error('Failed to poll timer state:', error);
      }
    }, 100);

    return () => clearInterval(intervalId);
  }, []);

  const handleStart = async () => {
    try {
      const newState = await invoke<TimerState>('start_timer', { minutes });
      setTimerState(newState);
      setKey(prev => prev + 1); // Force timer reset
    } catch (error) {
      console.error('Failed to start timer:', error);
    }
  };

  const handlePause = async () => {
    try {
      const newState = await invoke<TimerState>('pause_timer');
      setTimerState(newState);
    } catch (error) {
      console.error('Failed to pause timer:', error);
    }
  };

  const handleResume = async () => {
    try {
      const newState = await invoke<TimerState>('resume_timer');
      setTimerState(newState);
    } catch (error) {
      console.error('Failed to resume timer:', error);
    }
  };

  const getRemainingTime = () => {
    if (!timerState) return minutes * 60;
    const remainingMs = Math.max(0, timerState.duration - timerState.elapsed);
    return remainingMs / 1000;
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      {(!timerState || timerState.duration === 0) ? (
        <div className="flex gap-2 items-center">
          <input
            type="number"
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
            className="w-20 p-2 border rounded"
            min="1"
          />
          <button
            onClick={handleStart}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Start Timer
          </button>
        </div>
      ) : (
        <>
          <CountdownCircleTimer
            key={key}
            isPlaying={!timerState.is_paused}
            duration={timerState.duration / 1000}
            colors={['#004777', '#F7B801', '#A30000', '#A30000']}
            colorsTime={[7, 5, 2, 0]}
            initialRemainingTime={getRemainingTime()}
          >
            {({ remainingTime }) => {
              const minutes = Math.floor(remainingTime / 60);
              const seconds = Math.floor(remainingTime % 60);
              return `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }}
          </CountdownCircleTimer>
          
          <button
            onClick={timerState.is_paused ? handleResume : handlePause}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            {timerState.is_paused ? 'Resume' : 'Pause'}
          </button>
        </>
      )}
    </div>
  );
};

export default Timer;