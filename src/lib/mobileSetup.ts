import type { LucideIcon } from "lucide-react";
import { Bot, Code2, MessageSquareText, Rocket, Shield, Smartphone, Zap } from "lucide-react";

export type MobileAppId = "react-native" | "react-native-expo";

export interface MobileAppOption {
  id: MobileAppId;
  title: string;
  language: string;
  framework: string;
  platform: string;
  description: string;
  publishTarget: string;
  icon: LucideIcon;
}

export const MOBILE_APP_OPTIONS: MobileAppOption[] = [
  {
    id: "react-native",
    title: "React Native",
    language: "TypeScript",
    framework: "React Native CLI (bare workflow)",
    platform: "Android + iOS",
    description: "Full native control with your own native modules and build setup.",
    publishTarget:
      "Build a signed Android App Bundle and an iOS archive from your native project.",
    icon: Smartphone,
  },
  {
    id: "react-native-expo",
    title: "React Native Expo",
    language: "TypeScript",
    framework: "Expo (managed workflow)",
    platform: "Android + iOS",
    description: "Fastest setup — no native build config, cloud builds with EAS.",
    publishTarget: "Run `eas build` to ship Android and iOS builds from the cloud.",
    icon: Rocket,
  },
];

export const MOBILE_STEP_ICONS = [Rocket, Bot, Shield, Code2, MessageSquareText, Zap] as const;

export const getMobileSetupSteps = (app: MobileAppOption) => {
  const shared = [
    {
      title: "Select your chatbot",
      detail: `Copy the bot ID into your app. The same bot, training and AutoFlow are used as the web widget.`,
    },
    {
      title: "Use the native chat endpoint",
      detail:
        "The app sends its current native screen context to WebotMe. No API secret is placed in the app bundle.",
    },
    {
      title: "Add the local TypeScript client",
      detail:
        "Copy the local native-sdk source into your project during this first integration phase. It is not published as an npm package yet.",
    },
    {
      title: "Register native screens and actions",
      detail:
        "Expose visible text, buttons, forms and routes so AutoFlow can choose the next native action.",
    },
  ];

  if (app.id === "react-native-expo") {
    return [
      {
        title: "Create your Expo app",
        detail: "Run `npx create-expo-app MyApp` and start it with `npx expo start`.",
      },
      ...shared,
      {
        title: "Test & publish with EAS",
        detail: app.publishTarget,
      },
    ];
  }

  return [
    {
      title: "Create your React Native app",
      detail:
        "Run `npx @react-native-community/cli init MyApp` and open it in Android Studio / Xcode.",
    },
    ...shared,
    {
      title: "Test & publish",
      detail: app.publishTarget,
    },
  ];
};
