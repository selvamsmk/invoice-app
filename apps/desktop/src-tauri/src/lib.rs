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
            let fonts_dir = resource_dir.join("resources/fonts");

            println!("📦 Resource dir: {:?}", resource_dir);
            println!("📂 Migrations dir: {:?}", migrations_dir);
            println!("🔤 Fonts dir: {:?}", fonts_dir);

            // ⛔ DEV MODE: do NOT spawn sidecar
            if is_dev {
                println!("🧪 DEV mode → skipping sidecar (use external bun server)");
                return Ok(());
            }

            // --- Check resource files exist ---
            if !migrations_dir.exists() {
                eprintln!("❌ Migrations directory not found: {:?}", migrations_dir);
                handle
                    .emit("sidecar:error", "Migrations not bundled. Try rebuilding the app.")
                    .ok();
                return Ok(());
            }

            if !fonts_dir.exists() {
                eprintln!("⚠️  Fonts directory not found: {:?}", fonts_dir);
            }

            println!("✅ Resources verified");

            let db_path_env = db_path.to_string_lossy().to_string();
            let migrations_dir_env = migrations_dir.to_string_lossy().to_string();
            let fonts_dir_env = fonts_dir.to_string_lossy().to_string();

            println!("🔧 Sidecar env DATABASE_URL={}", db_path_env);

            // --- Resolve sidecar ---
            let sidecar = match handle.shell().sidecar("server") {
                Ok(cmd) => {
                    println!("✅ Sidecar binary resolved");
                    cmd
                }
                Err(e) => {
                    eprintln!("❌ Sidecar resolve failed: {:?}", e);
                    let err_msg = format!("Sidecar binary not found. Make sure to run: bun run build:tauri:prep. Error: {e:?}");
                    handle.emit("sidecar:error", err_msg.clone()).ok();
                    return Ok(());
                }
            }
            .env("BETTER_AUTH_URL", "http://localhost:3000")
            .env("CORS_ORIGIN", "http://localhost:3001,http://localhost:1420")
            .env("ENV", "production")
            .env("SEED", "false")
            .env("DATABASE_URL", db_path_env)
            .env("MIGRATIONS_DIR", migrations_dir_env)
            .env("FONTS_DIR", fonts_dir_env)
            .env("VITE_DISABLE_AUTH", "true")
            .env("TARGET", "desktop");

            // --- Spawn sidecar ---
            let (mut rx, child) = match sidecar.spawn() {
                Ok(pair) => {
                    println!("🚀 Server sidecar spawned (PID: {:?})", pair.1.pid());
                    handle.emit("sidecar:status", "started").ok();
                    pair
                }
                Err(e) => {
                    eprintln!("❌ Sidecar spawn failed: {:?}", e);
                    let err_msg = format!("SPAWN_FAILED: {e:?}");
                    handle.emit("sidecar:error", err_msg.clone()).ok();
                    eprintln!("💥 {}", err_msg);
                    return Ok(());
                }
            };

            // Store child globally
            SERVER_CHILD.set(Arc::new(Mutex::new(Some(child)))).ok();

            // --- Pipe logs & detect startup ---
            let app_handle = handle.clone();
            tauri::async_runtime::spawn(async move {
                let mut startup_complete = false;
                let mut startup_started = false;
                
                let startup_result = tokio::time::timeout(
                    tokio::time::Duration::from_secs(15),
                    async {
                        while let Some(event) = rx.recv().await {
                            match event {
                                CommandEvent::Stdout(bytes) => {
                                    let msg = String::from_utf8_lossy(&bytes).trim().to_string();
                                    if !msg.is_empty() {
                                        println!("[server] {}", msg);
                                        app_handle.emit("sidecar:stdout", msg.clone()).ok();
                                        startup_started = true;
                                        
                                        // Detect successful startup
                                        if msg.contains("Server running") || msg.contains("listening") || msg.contains("🚀") {
                                            startup_complete = true;
                                            app_handle.emit("sidecar:status", "healthy").ok();
                                            println!("✅ Sidecar is healthy and listening");
                                            return;
                                        }
                                    }
                                }
                                CommandEvent::Stderr(bytes) => {
                                    let msg = String::from_utf8_lossy(&bytes).trim().to_string();
                                    if !msg.is_empty() {
                                        eprintln!("[server] {}", msg);
                                        app_handle.emit("sidecar:stderr", msg.clone()).ok();
                                    }
                                }
                                CommandEvent::Terminated(payload) => {
                                    eprintln!("🛑 Sidecar exited (code: {:?})", payload.code);
                                    if !startup_complete {
                                        let err = if startup_started {
                                            format!("Sidecar crashed during startup. Check logs above. Exit code: {:?}", payload.code)
                                        } else {
                                            format!("Sidecar failed to start (no output). Exit code: {:?}. Check database permissions and port 3000 availability.", payload.code)
                                        };
                                        app_handle.emit("sidecar:error", err).ok();
                                    } else {
                                        app_handle.emit("sidecar:terminated", format!("{payload:?}")).ok();
                                    }
                                    return;
                                }
                                _ => {}
                            }
                        }
                    }
                ).await;
                
                if startup_result.is_err() {
                    if !startup_complete && startup_started {
                        eprintln!("⚠️  Sidecar startup timeout (15s) - may still be initializing");
                        app_handle.emit("sidecar:status", "slow-startup").ok();
                    } else if !startup_started {
                        eprintln!("❌ Sidecar produced no output for 15s - likely crashed immediately");
                        app_handle.emit("sidecar:error", "Sidecar produced no startup output. Check database file and permissions.".to_string()).ok();
                    }
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
