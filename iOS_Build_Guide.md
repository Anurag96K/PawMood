# 🍏 Building PawMood for iOS (Cloud CI/CD)

This guide will help you generate a native iOS IPA for **PawMood** using GitHub Actions. Because building for iOS requires macOS and Xcode, we use a cloud-based CI/CD pipeline to avoid the need for a local Mac.

## ✅ Prerequisites

1. **Apple Developer Account**: You must be enrolled in the Apple Developer Program (requires an annual fee).
2. **GitHub Repository**: The code must be pushed to a GitHub repository where you can run Actions.

---

## 🔑 Step 1: Gather iOS Signing Credentials

To build an installable `.ipa` file (via ad-hoc, development, or app-store), you need to provide signing certificates and profiles to GitHub Actions.
You will need to use a Mac (or cloud Mac service) at least once to generate these via Xcode or Keychain Access, or export them from an existing developer machine.

You need the following items:
1. **P12 Certificate**: Your iOS Distribution or Development certificate exported as a `.p12` file.
2. **Certificate Password**: The password you set when exporting the `.p12` file.
3. **Provisioning Profile**: The `.mobileprovision` file tied to your App ID (`com.pawmood.app`).
4. **Apple Team ID**: Your 10-character Apple Developer Team ID (e.g., `ABC123DEFG`).

---

## 🔒 Step 2: Configure GitHub Secrets

You need to add the following secrets to your GitHub repository before running the build.
Go to **Settings > Secrets and variables > Actions > New repository secret**.

Convert your `.p12` and `.mobileprovision` files to Base64 (so they can be stored as text secrets).
*(On Mac/Linux: `base64 -i cert.p12 -o cert_base64.txt`)*
*(On Windows PowerShell: `[Convert]::ToBase64String([IO.File]::ReadAllBytes("path\to\cert.p12")) | Set-Content cert_base64.txt`)*

Add these exactly as named:
- `APPLE_TEAM_ID` : Your Team ID.
- `IOS_CERTIFICATE_P12_BASE64` : The Base64 string of your `.p12` file.
- `IOS_CERTIFICATE_PASSWORD` : The password of the `.p12` file.
- `IOS_PROVISION_PROFILE_BASE64` : The Base64 string of your `.mobileprovision` file.
- `IOS_PROFILE_NAME` : The exact name of your provisioning profile file *(without the .mobileprovision extension, or exactly how it's referenced in Xcode)*.
- `KEYCHAIN_PASSWORD` : A random password used temporarily by the CI runner (e.g., `temporary_password_123`).

---

## 🚀 Step 3: Trigger the Build

Once your secrets are set up, you can trigger the build directly from the GitHub interface.

1. Go to the **Actions** tab in your GitHub repository.
2. Click on **Build Signed iOS IPA** on the left sidebar.
3. Click the **Run workflow** dropdown button on the right.
4. Select your **Export method** (e.g., `app-store`, `ad-hoc`, `development`, `enterprise`). *Note: Ensure your provisioning profile matches the export method you select.*
5. Click the **Run workflow** button.

---

## 📦 Step 4: Download Your IPA

1. Wait for the build to finish (usually 10-15 minutes).
2. Once the workflow run completes with a green checkmark, scroll down to the **Artifacts** section at the bottom of the summary page.
3. Download the `PewMood-ios-ipa` artifact.
4. Extracted, you will find your `.ipa` file ready to be uploaded to App Store Connect (using Transporter or fastlane) or distributed to test devices depending on your signing profile.

---

## 🛠️ Troubleshooting

- **"Missing one or more required iOS signing secrets"**: Ensure all required secrets are added to the GitHub repository and are named correctly.
- **"Code Signing Error"**: Make sure the provisioning profile matches the Certificate `.p12` and the `com.pawmood.app` bundle ID. Also verify the chosen export method is correct.
- **"Base64 Decode Error"**: When converting to Base64, make sure there are no newlines breaking the string.
