/** @type {import('tailwindcss').Config} */
const sharedConfig = require("../../packages/config/tailwind.config");

module.exports = {
  ...sharedConfig,
  content: [
    ...sharedConfig.content,
    "./src/**/*.{ts,tsx}",
  ],
};
