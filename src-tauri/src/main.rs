use notify_rust::Notification;
use rodio::{Decoder, OutputStream, Sink};
use std::{
    collections::HashMap,
    fs::File,
    io::BufReader,
    time::{Duration, SystemTime, UNIX_EPOCH},
};
use std::sync::Arc;
use std::thread;
use std::time::Duration as StdDuration;
use std::sync::Mutex;
use tauri::{command, State};
use tokio::time::sleep;
use std::path::PathBuf;
use std::fs;
use serde_json;
use chrono::{Utc, DateTime};
use tauri::{Manager, AppHandle}; // Needed for Tauri events


#[derive(Debug, serde::Serialize, serde::Deserialize)]
struct Settings {
    customization: Customization,
    general: General,
    notifications: Notifications,
    launch: Launch,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
struct Customization {
    theme: Theme,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
struct Theme {
    primary: String,
    secondary: String,
    accent: String,
    background: String,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
struct General {
    timer_defaults: TimerDefaults,
    hide_window_when_timer_starts: bool,
    show_at_break_start: bool,
    minimize_to_tray: bool,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
struct TimerDefaults {
    work_duration: String,
    break_duration: String,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
struct Notifications {
    enabled: bool,
    sound: bool,
    show_notification_before_break: bool,
    notification_sound: String,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
struct Launch {
    launch_at_startup: bool,
    show_window_at_launch: bool,
    start_timer_at_launch: bool,
}

#[derive(Debug)]
struct TimerState {
    start_time: Option<DateTime<Utc>>,
    duration: Option<Duration>,
    notified: bool, // Prevent multiple notifications
}

impl TimerState {
    fn new() -> Self {
        TimerState {
            start_time: None,
            duration: None,
            notified: false, // Prevent multiple notifications
        }
    }

    fn start_timer(&mut self, minutes: i64) {
        self.start_time = Some(Utc::now() + Duration::from_secs(1)); 
        self.duration = Some(Duration::from_secs(chrono::Duration::minutes(minutes).num_seconds() as u64));
    }

    fn get_remaining_time(&self) -> Option<i64> {
        if let (Some(start), Some(duration)) = (self.start_time, self.duration) {
            let elapsed = Utc::now().signed_duration_since(start);
            let remaining = chrono::Duration::from_std(duration).unwrap() - elapsed;
            return Some(remaining.num_seconds().max(0)); // Ensure it doesn't go negative
        }
        None
    }
    
    fn has_timer_ended(&mut self) -> bool {
        if let Some(remaining) = self.get_remaining_time() {
            if remaining == 0 && !self.notified {
                self.notified = true;
                return true;
            }
        }
        false
    }
}

fn main() {
    tauri::Builder::default()
    .manage(Mutex::new(TimerState::new())) 
    .invoke_handler(tauri::generate_handler![
            save_settings,
            load_settings,
            send_notification,
            start_timer,
            get_remaining_time,
        ])
        .setup(|app| {
            let app_handle = app.handle().clone(); // Clone the handle for the thread

            thread::spawn(move || {
                let timer_state = app_handle.state::<Mutex<TimerState>>().clone();
                loop {
                    {
                        let mut timer = timer_state.lock().unwrap();
                        if timer.has_timer_ended() {
                            println!("Timer ended! Sending notification...");
                            tauri::async_runtime::block_on(send_notification()).unwrap();
                        }
                    }
                    thread::sleep(StdDuration::from_secs(1)); // Check every second
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
async fn start_timer(state: State<'_, Mutex<TimerState>>, minutes: i64) -> Result<(), String> {
    let mut timer = state.lock().unwrap();
    timer.start_timer(minutes);
    Ok(())
}

#[tauri::command]
async fn get_remaining_time(state: State<'_, Mutex<TimerState>>) -> Result<Option<i64>, String> {
    let timer = state.lock().unwrap();
    Ok(timer.get_remaining_time())
}


#[command]
async fn send_notification() -> Result<(), String> {
    println!("send_notification called");
    // Notification code remains the same
    Notification::new()
        .summary("Time's up!")
        .body("Your timer has finished.")
        .icon("assets/notification_icon.jpg")
        .show()
        .map_err(|e| e.to_string())?;

    // Play sound
    if let Ok((_stream, stream_handle)) = OutputStream::try_default() {
        let sink = Sink::try_new(&stream_handle).map_err(|e| e.to_string())?;
        let file = File::open("assets/notification.mp3").map_err(|e| e.to_string())?;
        let source = Decoder::new(BufReader::new(file)).map_err(|e| e.to_string())?;
        sink.append(source);
        sink.sleep_until_end();
    }

    Ok(())
}

#[command]
async fn save_settings(settings: Settings) -> Result<(), String> {
    // Implementation from your settings module
    println!("save_settings called");
    Ok(())
}

#[command]
async fn load_settings() -> Result<Settings, String> {
    // Default settings matching `SettingsPage`
    println!("load_settings called");
    Ok(Settings {
        customization: Customization {
            theme: Theme {
                primary: "#3B82F6".to_string(),
                secondary: "#10B981".to_string(),
                accent: "#10B981".to_string(),
                background: "#FFFFFF".to_string(),
            },
        },
        notifications: Notifications {
            enabled: true,
            sound: true,
            show_notification_before_break: true,
            notification_sound: "default".to_string(),
        },
        launch: Launch {
            launch_at_startup: false,
            show_window_at_launch: true,
            start_timer_at_launch: false,
        },
        general: General {
            timer_defaults: TimerDefaults {
                work_duration: "25".to_string(),
                break_duration: "5".to_string(),
            },
            hide_window_when_timer_starts: false,
            show_at_break_start: true,
            minimize_to_tray: true,
        },
    })
}

