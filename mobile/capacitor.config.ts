import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.sheleadsafrica.mobile",
  appName: "She Leads Africa",
  webDir: "dist",
  backgroundColor: "#0056D2",
  android: {
    allowMixedContent: false,
    webContentsDebuggingEnabled: false,
  },
  server: {
    androidScheme: "https",
  },
};

export default config;
