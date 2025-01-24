use notify_rust::Notification;
use rodio::{Decoder, OutputStream, Sink};
use serde_json;
use core::time;
use std::fs;
use std::path::PathBuf;
use std::{
    collections::HashMap,
    fs::File,
    io::BufReader,
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};
use tauri::{command, State, Manager};
use tokio::time::sleep;
mod timer;
use settings::Settings;
use std::sync::{Arc, Barrier, Mutex};
use std::thread;
use timer::Timer;
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

#[tokio::main]
async fn main() {
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
        .setup(|app| {
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let mut is_done = true;
                loop {
                    //println!("This runs once every second.");
                    //if time left is 0, send notification
                    let state = handle.state::<AppState>();
                    let time_left = {
                        let timer = state.0.lock().unwrap();
                        timer.time_left()
                    };

                    //print!("Time left: {}", time_left);
                    if time_left == 0 && !is_done {
                        print!("Time's up!");
                        send_notification().await.unwrap();
                        is_done = true;
                    } else if time_left != 0 {
                        print!("Time left: {}", time_left);
                        is_done = false;
                    }
                    sleep(Duration::from_secs(1)).await;
                }
            });
            Ok(())
        })
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
        .timeout(5000)
        .show()
        .map_err(|e| e.to_string())?;

    // Play sound
    println!("Playing notification sound...");
    let barrier = Arc::new(Barrier::new(2));
    let barrier_clone = barrier.clone();

    std::thread::spawn(move || {
        let (_stream, handle) = rodio::OutputStream::try_default().expect("Failed to initialize output stream");
        let sink = rodio::Sink::try_new(&handle).expect("Failed to create audio sink");

        let file = std::fs::File::open("assets/Chime.mp3").expect("Failed to open audio file");
        let decoder = rodio::Decoder::new(std::io::BufReader::new(file)).expect("Failed to decode audio file");

        sink.append(decoder);
        sink.sleep_until_end(); // Block until sound finishes playing
        println!("Sound has played!");

        barrier_clone.wait(); // Notify the main thread
    });

    barrier.wait();
    /* 
    if let Ok((_stream, stream_handle)) = OutputStream::try_default() {
        let sink = Sink::try_new(&stream_handle).map_err(|e| e.to_string())?;
        let file = File::open("assets/notification.mp3").map_err(|e| e.to_string())?;
        let source = Decoder::new(BufReader::new(file)).map_err(|e| e.to_string())?;
        sink.append(source);
        sink.sleep_until_end();
    }
    */
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

#[command]
fn play_notification_sound() {
    println!("Playing notification sound...");
    let barrier = Arc::new(Barrier::new(2));
    let barrier_clone = barrier.clone();

    std::thread::spawn(move || {
        let (_stream, handle) =
            rodio::OutputStream::try_default().expect("Failed to initialize output stream");
        let sink = rodio::Sink::try_new(&handle).expect("Failed to create audio sink");

        let file = std::fs::File::open("src/assets/Chime.mp3").expect("Failed to open audio file");
        let decoder = rodio::Decoder::new(std::io::BufReader::new(file))
            .expect("Failed to decode audio file");

        sink.append(decoder);
        sink.sleep_until_end(); // Block until sound finishes playing
        println!("Sound has played!");

        barrier_clone.wait(); // Notify the main thread
    });

    barrier.wait(); // Wait for the spawned thread
}
