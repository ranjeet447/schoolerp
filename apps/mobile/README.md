# SchoolERP Mobile App

This project is a **React + Capacitor** shell that wraps the SchoolERP web application to provide a native mobile experience for Android and iOS.

## Features (Native Hooks)
- **Status Bar**: Custom color and style matching the brand.
- **Splash Screen**: Native launch screen support.
- **Network Status**: Offline detection and retry screen.
- **Deep Links**: Native app URL handling.
- **Haptics**: Native vibration feedback.
- **Browser**: In-app browser for external links.

## Prerequisites
- Node.js 18+
- Android Studio (for Android build)
- Xcode (for iOS build - macOS only)

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Build the web assets:
   ```bash
   npm run build
   ```
3. Sync with native platforms:
   ```bash
   npx cap add android
   npx cap add ios
   npx cap sync
   ```

## Development
To run the app in development mode (loading the web app from a live URL):
```bash
npm run dev
```

## Build for Production
1. Build the web app:
   ```bash
   npm run build
   ```
2. Copy assets to native projects:
   ```bash
   npx cap copy
   ```
3. Open in Android Studio/Xcode:
   ```bash
   npx cap open android
   npx cap open ios
   ```
