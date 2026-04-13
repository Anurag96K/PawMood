import { createRoot } from "react-dom/client";
import App from "./App.tsx";

// Font fallbacks (ensures Hangul renders correctly - must import Korean subset)
import "@fontsource/noto-sans-kr/korean-400.css";
import "@fontsource/noto-sans-kr/korean-500.css";
import "@fontsource/noto-sans-kr/korean-600.css";
import "@fontsource/noto-sans-kr/korean-700.css";
import "./index.css";

// Import reset utility for console access
import "./utils/resetAppData";

createRoot(document.getElementById("root")!).render(<App />);
