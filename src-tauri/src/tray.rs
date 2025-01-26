use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, Runtime,
    image::Image,
};
use tauri_plugin_positioner::WindowExt;
use image::{ImageBuffer, Rgba, RgbaImage, GenericImage};
use std::time::Duration;

use crate::AppState;
use rusttype::{Font, Scale};
use imageproc::drawing::draw_text_mut;
use ab_glyph::{FontArc, ScaleFont};
use image::codecs::png::PngEncoder;
use image::ColorType;
use std::io::Cursor;

fn generate_time_icon<'a>(time_left: u64) -> Image<'a> {
    let width = 32;
    let height = 32;
    let mut img = RgbaImage::from_pixel(width, height, Rgba([255, 255, 255, 0]));

    // Load a font using ab_glyph
    let font_data = include_bytes!("../assets/DejaVuSans.ttf") as &[u8];
    let font = FontArc::try_from_slice(font_data).expect("Error constructing Font");

    // Convert time_left to minutes and seconds
    let minutes = time_left / 60;
    let seconds = time_left % 60;
    let time_text = format!("{:02}:{:02}", minutes, seconds);

    println!("time_text: {:?}", time_text);

    // Draw the time text onto the image
    let scale = Scale::uniform(12.0);
    let text_color = Rgba([0, 0, 0, 255]);
    draw_text_mut(&mut img, text_color, 2, 10, 12.0, &font, &time_text);

    // Encode the image as PNG
    let mut buffer = Cursor::new(Vec::new());
    let encoder = PngEncoder::new(&mut buffer);
    image::DynamicImage::ImageRgba8(img.clone()) // Clone the image for saving
        .write_to(&mut buffer, image::ImageFormat::Png)
        .expect("Failed to encode image");

    // Save the image to a file for preview
    img.save("preview.png").expect("Failed to save image");

    // Use from_bytes to create the Image
    Image::from_bytes(&buffer.into_inner()).expect("Failed to create image")
}

pub fn init_macos_menu_extra<R: Runtime>(app: &tauri::AppHandle<R>) -> tauri::Result<()> {
    let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&quit_i])?;

    let app_handle = app.clone(); // Clone the app handle here
    tauri::async_runtime::spawn(async move {
        loop {
            let state = app_handle.state::<AppState>();
            let time_left = {
                let timer = state.0.lock().unwrap();
                timer.time_left()
            };

            let icon = generate_time_icon(time_left);
            println!("icon updated with time left: {:?}", time_left);

            // Update the tray icon with the new icon
            let result = TrayIconBuilder::with_id("menu_extra")
                .icon(icon)
                .icon_as_template(true)
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(move |app, event| match event.id.as_ref() {
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    let app = tray.app_handle();

                    tauri_plugin_positioner::on_tray_event(app.app_handle(), &event);

                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        if let Some(window) = app.get_webview_window("main") {
                            if !window.is_visible().unwrap_or(false) {
                              let _ = window.move_window(tauri_plugin_positioner::Position::TrayBottomCenter);
                              let _ = window.show();
                              let _ = window.set_focus();
                            } else {
                              let _ = window.hide();
                            }
                        }
                    }
                })
                .build(&app_handle); // Use the cloned app handle here

            if let Err(e) = result {
                println!("Failed to update tray icon: {:?}", e);
            }

            // Update every second
            tokio::time::sleep(Duration::from_secs(1)).await;
        }
    });

    Ok(())
}