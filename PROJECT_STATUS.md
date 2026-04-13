# Project Status & Changelog

## ✅ Implemented Features

### Authentication & Onboarding
- **Android Native Support**: Configured `AndroidManifest.xml` and initialized the Android project to support native deep links (`com.pawmood.app://`), resolving localhost connection issues.
- **Login Redirect Fix**: Updated `OnboardingFlow.tsx` to automatically redirect authenticated users to the "Pet Setup" screen, preventing the "return to start" loop.
- **Persistent Login State**: `useAuth` and `MobileAuthListener` correctly handle session restoration from deep links.
- **Localized Onboarding**: Logic exists in `LanguageContext`, verified language options in Profile.

### Credit System & Subscriptions
- **Updated Pricing**:
    - Monthly: $8.99 (50 credits)
    - Yearly: $89.90 (70 credits/mo, ~ $7.49/mo)
- **Extra Credits**:
    - 10 Credits: $3.49
    - 20 Credits: $4.99 (Best Value)
    - 30 Credits: $7.99
- **Disclaimer added**: "Extra credits require an active subscription."
- **Purchase Logic**:
    - "Buy Extra Credits" is locked if the user has no active subscription.
    - Shows `SubscriptionRequiredModal` when attempting to buy extra credits without a plan.
- **Profile UI**: "Best Value" badge with slide animation for Yearly plan. Dynamic credit display based on plan and first-month bonus.

### Calendar & Analysis
- **Decorate Mode**: Layout preserves the side-by-side "Decorate" and "Report" buttons in the header.
- **Birthday Theme**: 2.5D background with soft shadows and confetti/balloons implemented (`BirthdayThemeBackground`).
- **Stickers**: Integrated into `CalendarCustomizeModal`.
- **Mood Report**:
    - **Intro Title Logic**: `IntroTitleBlock.tsx` correctly handles pet name lengths.
    - If it fits: `{PetName}'s This Week` (1 line).
    - If long: `{PetName}'s / This Week` (2 lines).
    - "This Week" text size is fixed; Pet Name scales only if needed to prevent clipping.

### Lock Screen / Access Control
- **Unified Logic**: `UnifiedLockScreen` and `UnifiedLockOverlay` ensure consistent design across Home and Calendar.
- **Conditional Copy**:
    - New Users: "Start with 3 free credits ✨"
    - Returning Users: "Start again !" (No "free credits" mention).
- **Home Screen Camera**:
    - Camera is auto-activated when unlocked.
    - Shows white "Camera Ready" placeholder when locked.

## 🗑️ Removed Items
- **"Lovable" Branding**: Removed all dependencies and references.
- **"Reset" and "Done" Buttons**: Verified removed from `CalendarCustomizeModal` (now uses an "X" to close, changes apply immediately).
- **"Change Password"**: Removed from Profile screen (only Google/Apple sign-in supported).
- **"Start with 3 free credits" Section**: Removed from above the Plan section (integrated into Plan logic/copy instead).

## 🛠️ Changes & Fixes
- **Refined UI/Theming**:
    - **Animations**: Added `accordion-down`, `wiggle`, `scale-in` to `tailwind.config.ts`.
    - **Shadows**: "Warm glow" methodology applied to cards and modals.
    - **Pet Name**: Limited to 12 character UI logic in Title Block (visual handling).
- **Bug Fixes**:
    - **White Screen Crash**: Fixed duplicate state declarations in `AuthPage.tsx`.
    - **Infinite Loading**: Added safety timeout in `AuthDrawer.tsx` to reset loading state on app resume.
    - **Deep Link Parsing**: Improved `MobileAuthListener` to parse both hash fragments and query parameters for Supabase tokens.

## ⏳ Pending / Validation Required
- **"Different Account" Login Bugs**: Authentication flow has been rewritten/hardened. Any residual "text not updating" issues should be re-tested with the new APK build.
- **Specific Animation Timings**: "Fireworks" appearing once/day: The logic exists but relies on component state; may re-trigger if the app is fully killed and restarted.
- **"Decorate section slide animation"**: Modal uses framer-motion for slide-up/down. (Needs validation)
