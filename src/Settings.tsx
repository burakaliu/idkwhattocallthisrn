import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Save } from "lucide-react";

// Enhanced settings interface with new options
interface Settings {
  customization: {
    theme: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
    };
  };
  notifications: {
    enabled: boolean;
    sound: boolean;
    // New notification preferences
    show_notification_before_break: boolean;
    notification_sound: "default" | "bell" | "chime";
  };
  launch: {
    // New launch-related settings
    launch_at_startup: boolean;
    show_window_at_launch: boolean;
    start_timer_at_launch: boolean;
  };
  general: {
    timer_defaults: {
      work_duration: string;
      break_duration: string;
    };
    // New general settings
    hide_window_when_timer_starts: boolean;
    show_at_break_start: boolean;
    minimize_to_tray: boolean;
  };
}

const SettingsPage: React.FC = () => {
  // Initialize with expanded default settings
  const [settings, setSettings] = useState<Settings>({
    customization: {
      theme: {
        primary: "#3B82F6",
        secondary: "#10B981",
        accent: "#FBBF24",
        background: "#FFFFFF",
      },
    },
    notifications: {
      enabled: true,
      sound: true,
      show_notification_before_break: true,
      notification_sound: "default",
    },
    launch: {
      launch_at_startup: false,
      show_window_at_launch: true,
      start_timer_at_launch: false,
    },
    general: {
      timer_defaults: {
        work_duration: "25",
        break_duration: "5",
      },
      hide_window_when_timer_starts: false,
      show_at_break_start: true,
      minimize_to_tray: true,
    },
  });

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle"
  );

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await invoke<Settings>("load_settings");
        if (savedSettings) {
          await setSettings(savedSettings);
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaveStatus("saving");
    try {
      if (settings) {
        await invoke("save_settings", { settings: settings });
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      setSaveStatus("idle");
    }
  };

  if (!settings) {
    return <div>Loading settings...</div>;
  }

  const handleColorChange = (
    key: keyof Settings["customization"]["theme"],
    value: string
  ) => {
    setSettings((prev) => ({
      ...prev,
      customization: {
        ...prev.customization,
        theme: {
          ...prev.customization.theme,
          [key]: value,
        },
      },
    }));
  };

  return (
    <>
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {settings !== null ? (
          <div>
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">Settings</h1>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save size={20} />
                {saveStatus === "saving"
                  ? "Saving..."
                  : saveStatus === "saved"
                  ? "Saved!"
                  : "Save Changes"}
              </button>
            </div>

            <section className="space-y-4 CustomizationSection">
              <h2 className="text-xl font-semibold">Customization</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    Primary Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.customization.theme.primary}
                      onChange={(e) =>
                        handleColorChange("primary", e.target.value)
                      }
                      className="h-10 w-20"
                    />
                    <input
                      type="text"
                      value={settings.customization.theme.primary}
                      onChange={(e) =>
                        handleColorChange("primary", e.target.value)
                      }
                      className="px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    Secondary Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.customization.theme.secondary}
                      onChange={(e) =>
                        handleColorChange("secondary", e.target.value)
                      }
                      className="h-10 w-20"
                    />
                    <input
                      type="text"
                      value={settings.customization.theme.secondary}
                      onChange={(e) =>
                        handleColorChange("secondary", e.target.value)
                      }
                      className="px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-4 LaunchSection">
              <h2 className="text-xl font-semibold">Launch Settings</h2>
              <div className="space-y-3">
                {/* TODO: Implement auto-launch functionality using tauri-plugin-autostart */}
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.launch.launch_at_startup}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        launch: {
                          ...prev.launch,
                          launch_at_startup: e.target.checked,
                        },
                      }))
                    }
                    className="h-4 w-4 rounded"
                  />
                  <span>Launch at computer startup</span>
                </label>

                {/* TODO: Implement window visibility management using tauri window API */}
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.launch.show_window_at_launch}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        launch: {
                          ...prev.launch,
                          show_window_at_launch: e.target.checked,
                        },
                      }))
                    }
                    className="h-4 w-4 rounded"
                  />
                  <span>Show window at launch</span>
                </label>

                {/* TODO: Implement auto-start timer functionality */}
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.launch.start_timer_at_launch}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        launch: {
                          ...prev.launch,
                          start_timer_at_launch: e.target.checked,
                        },
                      }))
                    }
                    className="h-4 w-4 rounded"
                  />
                  <span>Start timer at launch</span>
                </label>
              </div>
            </section>

            <section className="space-y-4 NotificationsSection">
              <h2 className="text-xl font-semibold">Notifications</h2>
              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.notifications.enabled}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        notifications: {
                          ...prev.notifications,
                          enabled: e.target.checked,
                        },
                      }))
                    }
                    className="h-4 w-4 rounded"
                  />
                  <span>Enable Notifications</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.notifications.sound}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        notifications: {
                          ...prev.notifications,
                          sound: e.target.checked,
                        },
                      }))
                    }
                    className="h-4 w-4 rounded"
                  />
                  <span>Enable Sound</span>
                </label>

                {/* TODO: Implement notification sound selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    Notification Sound
                  </label>
                  <select
                    value={settings.notifications.notification_sound}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        notifications: {
                          ...prev.notifications,
                          notificationSound: e.target.value as
                            | "default"
                            | "bell"
                            | "chime",
                        },
                      }))
                    }
                    className="px-3 py-2 border rounded-lg w-full"
                  >
                    <option value="default">Default</option>
                    <option value="bell">Bell</option>
                    <option value="chime">Chime</option>
                  </select>
                </div>
              </div>
            </section>

            <section className="space-y-4 GeneralSection">
              <h2 className="text-xl font-semibold">General Settings</h2>
              <div className="space-y-4">
                {/* Timer Defaults */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">
                      Work Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={settings.general.timer_defaults.work_duration}
                      onChange={(e) => {
                        const newDuration = parseInt(e.target.value).toString();
                        setSettings((prev) => ({
                          ...prev,
                          general: {
                            ...prev.general,
                            timer_defaults: {
                              ...prev.general.timer_defaults,
                              work_duration: newDuration,
                            },
                          },
                        }));
                      }}
                      className="px-3 py-2 border rounded-lg w-full"
                      min="1"
                      max="60"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">
                      Break Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={settings.general.timer_defaults.break_duration}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          general: {
                            ...prev.general,
                            timer_defaults: {
                              ...prev.general.timer_defaults,
                              break_duration: parseInt(
                                e.target.value
                              ).toString(),
                            },
                          },
                        }))
                      }
                      className="px-3 py-2 border rounded-lg w-full"
                      min="1"
                      max="30"
                    />
                  </div>
                </div>

                {/* Window Behavior */}
                <div className="space-y-3">
                  {/* TODO: Implement window visibility management using tauri window API */}
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.general.hide_window_when_timer_starts}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          general: {
                            ...prev.general,
                            hide_window_when_timer_starts: e.target.checked,
                          },
                        }))
                      }
                      className="h-4 w-4 rounded"
                    />
                    <span>Hide window when timer starts</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.general.show_at_break_start}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          general: {
                            ...prev.general,
                            show_at_break_start: e.target.checked,
                          },
                        }))
                      }
                      className="h-4 w-4 rounded"
                    />
                    <span>Show window at start of break</span>
                  </label>

                  {/* TODO: Implement system tray functionality using tauri system tray API */}
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.general.minimize_to_tray}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          general: {
                            ...prev.general,
                            minimize_to_tray: e.target.checked,
                          },
                        }))
                      }
                      className="h-4 w-4 rounded"
                    />
                    <span>Minimize to system tray</span>
                  </label>
                </div>
              </div>
            </section>
          </div>
        ) : (
          <p>Loading...</p> // Placeholder while remainingTime is being fetched
        )}
      </div>
    </>
  );
};

export default SettingsPage;
