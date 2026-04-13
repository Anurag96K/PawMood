# 🛡️ Google Play Protect & "Risky App" Warnings
## Why is my app showing as "Risky"?

If you see a warning saying **"Blocked by Play Protect"** or **"Unsafe App"** when installing your APK, do not panic. This is normal for new apps during development.

### The Reasons:
1.  **Unknown Developer**: Your app is signed with a "Debug Key" (used for testing) or a self-signed certificate that Google does not recognize yet.
2.  **Not in Play Store**: The APK was not downloaded from the Google Play Store, so Play Protect hasn't verified it.
3.  **New Package Name**: Google has never seen `com.pawmood.app` before, so it treats it with caution until you verify ownership.

---

## ✅ How to Fix It (Step-by-Step)

To stop these warnings and make your app look professional/safe, you must **Sign the App** and **Upload it to Google Play Console**.

### Step 1: Generate a Release Keystore (The "Key" to your App)
*You only do this ONCE. Keep this file safe! If you lose it, you can never update your app again.*

1.  Open **Android Studio**.
2.  Go to **Build** > **Generate Signed Bundle / APK**.
3.  Select **Android App Bundle (AAB)** (Best for Play Store) or **APK** (For manual sharing). Click **Next**.
4.  Under "Key store path", click **Create new**.
5.  **Fill in the details**:
    *   **Path**: Save it as `release-key.jks` in your project folder.
    *   **Password**: Create a strong password (write it down!).
    *   **Key Alias**: `key0` (default) or `pawmood_key`.
    *   **Certificate**: Fill in "First and Last Name" (or Company) and "Country Code" (e.g., US, IN).
6.  Click **OK**, then **Next**.
7.  Select **Release** (not Debug) and click **Create/Finish**.

### Step 2: Upload to Google Play Console
*This tells Google "I am the real developer and this code is safe."*

1.  Go to your [Google Play Console](https://play.google.com/console).
2.  **Create App** and finish the initial setup details.
3.  Go to **Testing** > **Internal testing** (or Closed testing).
4.  Click **Create new release**.
5.  Upload the `.aab` (App Bundle) file you generated in Step 1.
    *   *Location: `android/app/release/app-release.aab`*
6.  If Google asks for a **Signing Key**, choose "Let Google export and manage your app signing key" (Recommended).

### Step 3: The Scan
Once uploaded, Google will scan your app.
*   **Result**: Once it passes the review (Internal testing review is fast, usually 1-24 hours), Play Protect will recognize your app signature.
*   **Outcome**: When users download it (even the APK), Google will recognize "Oh, this is PawMood by [Your Name]" and will **not** show the scary warning.

---

## ⚡ Temporary Bypass (For Testing Only)
If you just want to install the APK on your own phone *right now* and ignore the warning:

1.  Send the APK to your phone.
2.  When the warning pops up, click **"More Details"** (small arrow).
3.  Click **"Install Anyway"**.
