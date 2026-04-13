# AGENTS

## Project
- Name: PawMood / PawPal Insights
- Type: Capacitor + Ionic-style mobile app built with Vite, React, TypeScript, Tailwind, and Supabase
- Native targets present: `ios/`, `android/`

## Primary Goal
- Build and maintain the iOS version of PawMood.
- Prefer cloud build providers such as GitHub Actions for compilation and packaging.

## Working Rules
- Treat this as a mobile-first Capacitor project, not a pure web app.
- For mobile changes, keep Capacitor web assets and native shells in sync.
- Prefer commands that fit the existing project scripts: `npm run build`, then Capacitor sync steps.
- Avoid assuming local macOS/Xcode access; cloud or remote macOS build automation is the expected path for iOS artifacts.

## Build Notes
- Web output directory: `dist`
- Capacitor app id: `com.pawmood.app`
- Capacitor app name: `PawMood`
- Typical refresh flow: build web assets, then sync Capacitor platforms.

## iOS Cloud Build Direction
- Use GitHub Actions or another cloud CI provider capable of macOS runners.
- Expected high-level pipeline: install deps, build web app, sync Capacitor iOS project, resolve Swift packages/CocoaPods if needed, archive/sign on macOS.
- Keep signing-related secrets and certificates out of the repo; consume them from CI secrets.

## Repo Observations
- `ios/App/App.xcodeproj` already exists.
- `node_modules/` is present.
- Existing docs include `Mobile_Build_Guide.md`, but it is Android-oriented and may need an iOS companion.
