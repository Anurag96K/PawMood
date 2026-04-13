#  App Store Security & "Untrusted Developer" Warnings
## Why does my iPhone say "Untrusted Developer"?

When you install an app onto your iPhone via Xcode or a file (IPA) without using the App Store or TestFlight, you will likely see a popup saying **"Untrusted Developer"** or **"Unable to Verify App"**.

### The Reasons:
1.  **No Apple Developer Account**: You are likely using a free Apple ID to sign the app. Apple considers these "personal" and untrusted by default to prevent malware.
2.  **Sideloading**: Use of cables/Xcode to install puts the app in a "development" state, which requires manual trust approval on the device.
3.  **Not in App Store**: The app hasn't gone through Apple's strict Review Process.

---

## ✅ How to Fix It (Step-by-Step)

The only professional way to remove these warnings and distribute to users is to **Enroll in the Apple Developer Program** and use **TestFlight**.

### Step 1: Enroll in Apple Developer Program ($99/year)
*Required for App Store distribution.*
1.  Go to [developer.apple.com](https://developer.apple.com/).
2.  Click **Account** and sign in.
3.  Click **"Join the Apple Developer Program"** and pay the enrollment fee.
4.  *Note: Verification can take 48 hours.*

### Step 2: Configure Signing in Xcode
*This tells Apple "I am a verified developer".*
1.  Open your project in **Xcode** (`ios/App/App.xcworkspace`).
2.  Click on the root **App** icon in the left file navigator.
3.  Select the **"Signing & Capabilities"** tab.
4.  Under **Team**, select your verified **Apple Developer Account**.
    *   *If you don't see it, go to Xcode Preferences > Accounts to add it.*
5.  Ensure **"Automatically manage signing"** is CHECKED.

### Step 3: Upload to TestFlight (Internal Testing)
*This is the "Magic Fix". Apps from TestFlight are trusted automatically.*
1.  In Xcode, select **Any iOS Device (arm64)** as the target.
2.  Go to **Product** > **Archive**.
3.  Once the archive finishes, the **Organizer** window will open.
4.  Click **Distribute App** > **App Store Connect** > **Upload**.
5.  Once uploaded, go to [App Store Connect](https://appstoreconnect.apple.com).
6.  Go to **My Apps** > Select App > **TestFlight**.
7.  Add yourself (and friends) as testers. You will get an email to install the "TestFlight" app.
8.  **Result**: Installing from TestFlight generates **NO WARNINGS**. It works exactly like a real App Store app.

---

## ⚡ Temporary Bypass (For Local Development)
If you are just testing on your own phone with a cable and don't want to pay $99 yet:

1.  Plug your iPhone into your Mac.
2.  Run the app from Xcode.
3.  When the "Untrusted Developer" popup appears:
    *   Go to **Settings** on your iPhone.
    *   **General** > **VPN & Device Management** (or "Profiles & Device Management").
    *   Under "Developer App", tap your email address.
    *   Tap **"Trust [Your Email]"**.
4.  You can now open the app. You must do this again if you delete and reinstall the app.
