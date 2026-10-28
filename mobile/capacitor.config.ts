import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.sheleadsafrica.mobile",
  appName: "She Leads Africa",
  webDir: "dist",
  backgroundColor: "#0056D2",
  android: {
    allowMixedContent: false,
    webContentsDebuggingEnabled: true, // chrome://inspect on a USB-connected phone for live debugging
  },
  server: {
    androidScheme: "https",
  },
};

export default config;
