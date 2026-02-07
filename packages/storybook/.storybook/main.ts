import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/nextjs-vite";
import path, { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config: StorybookConfig = {
  stories: ["../stories/**/*.mdx", "../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    getAbsolutePath("@storybook/addon-onboarding"),
    getAbsolutePath("@storybook/addon-a11y"),
    getAbsolutePath("@storybook/addon-docs"),
    getAbsolutePath("@storybook/addon-vitest"),
    getAbsolutePath("@chromatic-com/storybook")
  ],

  framework: {
    name: getAbsolutePath("@storybook/nextjs-vite"),
    options: {},
  },


  viteFinal: async (config) => {
    const { default: tailwindcss } = await import("@tailwindcss/vite");
    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "@schoolerp/ui": path.resolve(__dirname, "../../ui/src"),
        "next/link": path.resolve(__dirname, "../node_modules/next/link"),
        "next/image": path.resolve(__dirname, "../node_modules/next/image"),
      };
    }
    config.plugins = [...(config.plugins || []), tailwindcss()];
    return config;
  }
};
export default config;

function getAbsolutePath(value: string): any {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}
