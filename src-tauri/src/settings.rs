use serde::{Deserialize, Serialize};
use std::fs;
use tauri_api::path::app_dir;
use tauri::State;

#[derive(Serialize, Deserialize, Clone)]
pub struct Theme {
    primary: String,
    secondary: String,
    background: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Notifications {
    enabled: bool,
    sound: bool,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct TimerDefaults {
    work_duration: i32,
    break_duration: i32,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Settings {
    theme: Theme,
    notifications: Notifications,
    timer_defaults: TimerDefaults,
}

#[tauri::command]
pub async fn save_settings(settings: Settings) -> Result<(), String> {
    // Convert settings to JSON string
    let settings_json = serde_json::to_string(&settings)
        .map_err(|e| e.to_string())?;
    
    // Get the app config directory using tauri_api
    let app_dir = app_dir()
        .ok_or("Failed to get app directory")?;
    
    // Create settings file path
    let settings_path = app_dir.join("settings.json");
    
    // Create directory if it doesn't exist
    fs::create_dir_all(app_dir)
        .map_err(|e| e.to_string())?;
    
    // Write settings to file
    fs::write(settings_path, settings_json)
        .map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub async fn load_settings() -> Result<Settings, String> {
    // Get the app config directory using tauri_api
    let app_dir = app_dir()
        .ok_or("Failed to get app directory")?;
    
    // Create settings file path
    let settings_path = app_dir.join("settings.json");
    
    // Read and parse settings file
    let settings_json = fs::read_to_string(settings_path)
        .map_err(|e| e.to_string())?;
    
    let settings: Settings = serde_json::from_str(&settings_json)
        .map_err(|e| e.to_string())?;
    
    Ok(settings)
}
