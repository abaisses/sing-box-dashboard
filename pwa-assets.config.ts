import { defineConfig, minimal2023Preset } from "@vite-pwa/assets-generator/config";

// The assets generator pads maskable/apple icons onto a white background by
// default; override to the dark brand fill so the OS mask doesn't expose white
// corners on this dark icon.
export default defineConfig({
  preset: {
    ...minimal2023Preset,
    maskable: {
      ...minimal2023Preset.maskable,
      resizeOptions: { fit: "contain", background: "#eceff1" },
    },
    apple: {
      ...minimal2023Preset.apple,
      resizeOptions: { fit: "contain", background: "#eceff1" },
    },
  },
  images: ["public/favicon.svg"],
});
