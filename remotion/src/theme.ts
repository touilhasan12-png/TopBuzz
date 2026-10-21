import { loadFont } from "@remotion/google-fonts/Archivo";
import { loadFont as loadMono } from "@remotion/google-fonts/IBMPlexMono";

export const { fontFamily: ARCHIVO } = loadFont("normal", {
  weights: ["500", "700", "900"],
  subsets: ["latin"],
});
export const { fontFamily: MONO } = loadMono("normal", {
  weights: ["400", "600"],
  subsets: ["latin"],
});

export const C = {
  bg: "#050A14",
  bg2: "#0A1424",
  ink: "#E9EEF5",
  dim: "#8FA3BC",
  red: "#E0242E",
  blue: "#4DA3FF",
  amber: "#E8A33D",
  teal: "#35C2B1",
  line: "rgba(143,163,188,0.22)",
};

export const FPS = 30;
export const W = 1920;
export const H = 1080;
