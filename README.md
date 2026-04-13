# PawPal Insights

Analyze your pet's mood with AI and keep track of their emotional well-being.

## Project info

PawPal Insights is a mobile-first application designed for pet parents to understand their pets better through AI-powered mood analysis of photos.

## Getting Started

### Prerequisites

- Node.js & npm installed

### Local Development

1.  **Clone the repository**:
    ```sh
    git clone <YOUR_GIT_URL>
    cd <YOUR_PROJECT_NAME>
    ```

2.  **Install dependencies**:
    ```sh
    npm install
    ```

3.  **Setup Environment Variables**:
    Create a `.env` file based on `.env.example` and add your Supabase credentials.

4.  **Start the development server**:
    ```sh
    npm run dev
    ```

## Technologies Used

- **Vite** & **TypeScript**
- **React**
- **Supabase** (Auth, Database, Storage, Edge Functions)
- **shadcn-ui** & **Tailwind CSS**
- **Capacitor** (for Mobile App)

## Deployment

### Web
Build the project using `npm run build` and deploy to any static hosting provider.

### Mobile
Use Capacitor to build for Android or iOS:
```sh
npx cap add android
npx cap sync
npx cap open android
```
