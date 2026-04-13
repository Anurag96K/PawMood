# 🔐 Fixing Google Sign-In on Android

To make the Google Login redirect back to your app, you need to configure **Deep Links**.
I have updated your code to handle them, but there are **2 steps you must do manually**:

## Step 1: Update Supabase Dashboard
1.  Go to your **Supabase Dashboard** -> **Authentication** -> **URL Configuration**.
2.  In **Redirect URLs**, add this exact URL:
    *   `com.pawmood.app://google-auth`
3.  Click **Save**.

## Step 2: Edit Android Manifest
You need to tell Android that your app handles `com.pawmood.app://` links.

1.  Open this file in your editor:
    `e:\paw-pal-insights-main\PewMood\android\app\src\main\AndroidManifest.xml`
2.  Find the main `<activity>` tag (it usually has `android:name="com.getcapacitor.BridgeActivity"`).
3.  Inside that `<activity>` tag, add this new `<intent-filter>` block:

```xml
            <!-- Deep Link for Supabase Auth -->
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="com.pawmood.app" android:host="google-auth" />
            </intent-filter>
```

## Step 3: Rebuild App
After saving the changes:
1.  Run: `npx cap sync`
2.  Run: `npx cap open android`
3.  Re-run the app in Android Studio.

Now, when you login, the browser will ask "Open with PawMood?" (or do it automatically), and you will be logged in! 
