import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import "./styles/index.scss";


async function enableMocking() {
  if (import.meta.env.DEV) {
    const { worker } = await import("../mocks/browser");
    await worker.start({
      onUnhandledRequest: "warn",
    });
  }
}


enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>,
  );
});