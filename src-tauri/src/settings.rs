use std::fs;
use tauri_api::path::app_dir;

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct Settings {
    customization: Customization,
    general: General,
    notifications: Notifications,
    launch: Launch,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct Customization {
    theme: Theme,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct Theme {
    primary: String,
    secondary: String,
    accent: String,
    background: String,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct General {
    timer_defaults: TimerDefaults,
    hide_window_when_timer_starts: bool,
    show_at_break_start: bool,
    minimize_to_tray: bool,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct TimerDefaults {
    work_duration: String,
    break_duration: String,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct Notifications {
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


#[tauri::command]
pub async fn save(settings: Settings) -> Result<(), String> {
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
pub async fn load() -> Result<Settings, String> {
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
