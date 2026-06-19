
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "./i18n.ts";
  import "./styles/index.css";
  import "leaflet/dist/leaflet.css";
  import "pannellum/build/pannellum.css";

  createRoot(document.getElementById("root")!).render(<App />);
  