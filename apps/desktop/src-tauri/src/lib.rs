use std::panic;
use std::sync::{Arc, Mutex};

use once_cell::sync::OnceCell;
use tauri::{Emitter, Manager, WindowEvent};
use tauri_plugin_shell::process::{CommandChild, CommandEvent};
use tauri_plugin_shell::ShellExt;

// Global storage for sidecar child
static SERVER_CHILD: OnceCell<Arc<Mutex<Option<CommandChild>>>> = OnceCell::new();

pub fn run() {
    // 🔥 Kill sidecar on panic
    panic::set_hook(Box::new(|info| {
        eprintln!("🔥 PANIC: {info}");

        if let Some(child) = SERVER_CHILD.get() {
            if let Some(child) = child.lock().unwrap().take() {
                let _ = child.kill();
                eprintln!("🛑 Sidecar killed due to panic");
            }
        }
    }));

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        // 🧹 Kill sidecar when window closes
        .on_window_event(|_window, event| {
            if let WindowEvent::CloseRequested { .. } = *event {
                if let Some(child) = SERVER_CHILD.get() {
                    if let Some(child) = child.lock().unwrap().take() {
                        let _ = child.kill();
                        println!("🛑 Sidecar killed on app exit");
                    }
                }
            }
        })
        .setup(|app| {
            let handle = app.handle();

            let is_dev = cfg!(debug_assertions);
            println!("🧭 Running in {} mode", if is_dev { "DEV" } else { "PROD" });

            // --- App data dir ---
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("failed to get app data dir");
            std::fs::create_dir_all(&app_data_dir)?;

            let db_path = app_data_dir.join("invoice.db");

            println!("📁 App data dir: {:?}", app_data_dir);
            println!("🗄️ DB path: {:?}", db_path);

            // --- Resources / migrations ---
            let resource_dir = app
                .path()
                .resource_dir()
                .expect("failed to get resource dir");

            let migrations_dir = resource_dir.join("resources/migrations");

            println!("📦 Resource dir: {:?}", resource_dir);
            println!("📂 Migrations dir: {:?}", migrations_dir);

            let fonts_dir = resource_dir.join("resources/fonts");

            println!("🔤 Fonts dir: {:?}", fonts_dir);

            // ⛔ DEV MODE: do NOT spawn sidecar
            if is_dev {
                println!("🧪 DEV mode → skipping sidecar (use external bun server)");
                return Ok(());
            }

            // --- Resolve sidecar ---
            let sidecar = match handle.shell().sidecar("server") {
                Ok(cmd) => {
                    println!("✅ Sidecar binary resolved");
                    cmd
                }
                Err(e) => {
                    eprintln!("❌ Sidecar resolve failed: {:?}", e);
                    handle
                        .emit("sidecar:error", format!("resolve failed: {e:?}"))
                        .ok();
                    return Ok(());
                }
            }
            .envs([
                ("BETTER_AUTH_URL", "http://localhost:3000"),
                ("CORS_ORIGIN", "http://localhost:3001,http://localhost:1420"),
                ("ENV", "production"),
                ("SEED", "false"),
                ("DATABASE_URL", &db_path.to_string_lossy()),
                ("MIGRATIONS_DIR", &migrations_dir.to_string_lossy()),
                ("FONTS_DIR", &fonts_dir.to_string_lossy()),
                ("VITE_DISABLE_AUTH", "true"),
                ("TARGET", "desktop"),
            ]);

            // --- Spawn sidecar ---
            let (mut rx, child) = match sidecar.spawn() {
                Ok(pair) => {
                    println!("🚀 Server sidecar spawned");
                    handle.emit("sidecar:status", "started").ok();
                    pair
                }
                Err(e) => {
                    eprintln!("❌ Sidecar spawn failed: {:?}", e);
                    handle
                        .emit("sidecar:error", format!("spawn failed: {e:?}"))
                        .ok();
                    return Ok(());
                }
            };

            // Store child globally
            SERVER_CHILD.set(Arc::new(Mutex::new(Some(child)))).ok();

            // --- Pipe logs ---
            let app_handle = handle.clone();
            tauri::async_runtime::spawn(async move {
                while let Some(event) = rx.recv().await {
                    match event {
                        CommandEvent::Stdout(bytes) => {
                            let msg = String::from_utf8_lossy(&bytes).trim().to_string();
                            println!("[server] {}", msg);
                            app_handle.emit("sidecar:stdout", msg).ok();
                        }
                        CommandEvent::Stderr(bytes) => {
                            let msg = String::from_utf8_lossy(&bytes).trim().to_string();
                            eprintln!("[server] {}", msg);
                            app_handle.emit("sidecar:stderr", msg).ok();
                        }
                        CommandEvent::Terminated(payload) => {
                            eprintln!("🛑 Sidecar exited: {:?}", payload);
                            app_handle
                                .emit("sidecar:terminated", format!("{payload:?}"))
                                .ok();
                        }
                        _ => {}
                    }
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
