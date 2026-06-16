import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { HandbookProvider } from "./lib/handbook.jsx";
import { CardsProvider } from "./lib/cardsData.jsx";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <CardsProvider>
      <HandbookProvider>
        <App />
      </HandbookProvider>
    </CardsProvider>
  </React.StrictMode>
);
