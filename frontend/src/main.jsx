import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App";
import "./styles/global.css";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import { ThemeProvider } from "./context/ThemeContext";

// ✅ Initialize theme on app load
const initializeTheme = () => {
  const savedTheme = localStorage.getItem("theme") || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);
};

initializeTheme();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <CartProvider>
          <WishlistProvider>
            <App />
            {/* 🔥 Professional Toast System */}
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 2000,
                style: {
                  background: "var(--card)",
                  color: "var(--text)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  padding: "12px 16px",
                  fontSize: "14px",
                },
              }}
            />
          </WishlistProvider>
        </CartProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
