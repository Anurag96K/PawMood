# iOS GitHub Actions Build Setup

This repository now includes `.github/workflows/build-ios.yml` for signed iOS builds on GitHub-hosted macOS runners.

## Required GitHub Secrets

Add these repository secrets before running the workflow:

- `APPLE_TEAM_ID`: Your Apple Developer Team ID.
- `IOS_CERTIFICATE_P12_BASE64`: Base64-encoded Apple Distribution certificate exported as `.p12`.
- `IOS_CERTIFICATE_PASSWORD`: Password used when exporting the `.p12` file.
- `IOS_PROVISION_PROFILE_BASE64`: Base64-encoded iOS provisioning profile (`.mobileprovision`) matching `com.pawmood.app`.
- `IOS_PROFILE_NAME`: The provisioning profile name as shown in Apple Developer / Xcode.
- `KEYCHAIN_PASSWORD`: Any strong temporary password used to create the CI keychain.

Optional repository variable:

- `IOS_EXPORT_METHOD`: Default export type if you do not choose one in `workflow_dispatch`. Typical value: `app-store`.

## Expected Signing Assets

The workflow assumes:

- Bundle identifier: `com.pawmood.app`
- Xcode project: `ios/App/App.xcodeproj`
- Xcode scheme: `App`
- Release signing identity: `Apple Distribution`

## How To Produce Base64 Secrets On Windows

PowerShell examples:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\path\to\certificate.p12"))
[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\path\to\profile.mobileprovision"))
```

Copy each output into the matching GitHub secret without extra quotes or line breaks.

## Notes

- GitHub Actions can build the signed `.ipa`, but you still need valid Apple signing assets created from an Apple Developer account.
- If you want App Store submission later, keep using `app-store` export.
- If you want direct device installs for testing, use `ad-hoc` and a matching ad hoc provisioning profile.
