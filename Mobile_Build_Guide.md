# 📱 Building PawMood Mobile App (APK)

This guide will help you convert the **PawMood** web application into a native Android APK using Capacitor.

## ✅ Prerequisites
1.  **Node.js** (Installed)
2.  **Android Studio** (Required for generating the APK)
    *   Download from: [developer.android.com/studio](https://developer.android.com/studio)
    *   During install, ensure "Android SDK" and "Android Virtual Device" are selected.
3.  **Java JDK** (Usually comes with Android Studio).

---

## 🚀 Step 1: Setup Icons & Assets

I have already placed your icon image at:
`e:\paw-pal-insights-main\PewMood\assets\icon.jpg`

To automatically generate all required Android icon sizes (Adaptive Icons, Splash Screens, etc.), we use the assets tool.

**Run this command in your terminal:**
```powershell
npm install @capacitor/assets --save-dev
npx capacitor-assets generate --icon assets/icon.jpg
```
*(If it asks to install the package, say yes/y)*

---

## 🏗️ Step 2: Build the Web App

We need to compile your React code into a `dist` folder that the mobile app will load.

**Run this command:**
```powershell
npm run build
```
*This creates a fresh `dist` folder with your latest code.*

---

## 🔄 Step 3: Sync to Android

Now we copy the `dist` folder and your configuration into the native Android project.

**Run this command:**
```powershell
npx cap add android
npx cap sync
```
*(Note: If `npx cap add android` says "Android platform already exists", just ignore it and run `npx cap sync`)*

---

## 📲 Step 4: Open in Android Studio

This will launch the native Android project.

**Run this command:**
```powershell
npx cap open android
```

---

## 📦 Step 5: Generate the APK (In Android Studio)

Once Android Studio opens:
1.  Wait for the **Gradle Sync** (loading bars at the bottom) to finish.
2.  Go to the top menu: **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
3.  Wait for the build to complete.
4.  A popup will appear: "APK(s) generated successfully". Click **locate**.
5.  You will find `app-debug.apk`. You can transfer this file to your phone and install it!

### 🔒 For Publishing (Signed APK)
If you want to put this on the Play Store, pass it to your friends securely, or remove the "Debug" warning:
1.  Go to **Build > Generate Signed Bundle / APK**.
2.  Choose **APK**.
3.  Create a new **Key Store** (password protected file).
4.  Select `release` build variant.
5.  Finish.

---

## 🛠️ Troubleshooting

- **"White Screen" on launch?**
    - Make sure you ran `npm run build` before `npx cap sync`.
- **"Network Error"?**
    - Ensure your Supabase URL is whitelisted. In `android/app/src/main/AndroidManifest.xml`, ensure `<uses-permission android:name="android.permission.INTERNET" />` exists (it typically does by default).

**Good luck with PawMood! 🐾**
