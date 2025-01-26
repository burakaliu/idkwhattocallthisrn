use std::time::{Duration, Instant};

pub struct Timer {
    duration: Duration,
    start: Option<Instant>,
    paused: bool,
    elapsed: Duration,
}

impl Timer {
    pub fn new(seconds: u64) -> Self {
        Timer {
            duration: Duration::new(seconds, 0),
            start: None,
            paused: false,
            elapsed: Duration::new(0, 0),
        }
    }

    pub fn play(&mut self) {
        if self.paused {
            self.start = Some(Instant::now() - self.elapsed);
            self.paused = false;
        } else if self.start.is_none() {
            self.start = Some(Instant::now());
        }
    }

    pub fn pause(&mut self) {
        if let Some(start) = self.start {
            self.elapsed = start.elapsed();
            self.paused = true;
            self.start = None;
        }
    }

    pub fn time_left(&self) -> u64 {
        let remaining = if let Some(start) = self.start {
            let elapsed = start.elapsed();
            if elapsed >= self.duration {
                Duration::new(0, 0)
            } else {
                self.duration - elapsed
            }
        } else {
            if self.elapsed >= self.duration {
                Duration::new(0, 0)
            } else {
                self.duration - self.elapsed
            }
        };

        remaining.as_secs()
    }
}
