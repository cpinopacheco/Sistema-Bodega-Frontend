import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import "./index.css"

// Use a safer way to get the root element that works in both client and server environments
const rootElement = document.getElementById("root")

// Only render if we're in the browser
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}
