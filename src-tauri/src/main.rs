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
use settings::Settings;
use std::thread;
use std::sync::{Arc, Barrier, Mutex};
mod settings;

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
    settings::save(settings).await?;
    Ok(())
}

#[command]
async fn load_settings() -> Result<Settings, String> {
    // Default settings matching `SettingsPage`
    println!("load_settings called");
    Ok(settings::load().await?)
}


