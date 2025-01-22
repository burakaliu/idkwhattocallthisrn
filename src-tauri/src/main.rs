use notify_rust::Notification;
use rodio::{Decoder, OutputStream, Sink};
use std::{
    collections::HashMap,
    fs::File,
    io::BufReader,
    time::{Instant, Duration, SystemTime, UNIX_EPOCH},
};
use tauri::{command, State};
use tokio::time::sleep;
use std::path::PathBuf;
use std::fs;
use serde_json;
mod timer;
use timer::Timer;
use std::thread;
use std::sync::{Arc, Barrier, Mutex};


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

struct AppState(Mutex<Timer>);

#[tauri::command]
fn start_timer(state: State<AppState>, seconds: u64) {
    let mut timer = state.0.lock().unwrap();
    *timer = Timer::new(seconds);
    timer.play();
}

#[tauri::command]
fn stop_timer(state: State<AppState>) {
    let mut timer = state.0.lock().unwrap();
    timer.pause();
}

#[tauri::command]
fn get_time_left(state: State<AppState>) -> u64 {
    let timer = state.0.lock().unwrap();
    println!("Time left: {:?}", timer.time_left());
    timer.time_left()
}

fn main() {
    let mut timer = Timer::new(2);

    // Start the timer
    println!("Starting the timer...");
    timer.play();

    while timer.time_left() != 0 {
        println!("Time left: {:?}", timer.time_left());
        thread::sleep(Duration::new(1, 0));
    }

    println!("sending notification now!");

    tauri::Builder::default()
    .manage(AppState(Mutex::new(Timer::new(0)))) // Initial timer state
    .invoke_handler(tauri::generate_handler![
            save_settings,
            load_settings,
            send_notification,
            start_timer,
            stop_timer,
            get_time_left
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[command]
async fn send_notification() -> Result<(), String> {
    // Notification code remains the same
    Notification::new()
        .summary("Time's up!")
        .body("Your timer has finished.")
        .icon("assets/notification_icon.png")
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


