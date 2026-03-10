import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) return savedTheme;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
  });

  // Apply theme to document when it changes
  useEffect(() => {
    const htmlElement = document.documentElement;
    const bodyElement = document.body;
    
    // Apply to both html and body elements
    htmlElement.setAttribute("data-theme", theme);
    bodyElement.setAttribute("data-theme", theme);
    
    // Force reflow to ensure CSS variables are applied
    htmlElement.classList.remove("light-mode", "dark-mode");
    htmlElement.classList.add(theme === "dark" ? "dark-mode" : "light-mode");
    
    localStorage.setItem("theme", theme);
    console.log(`🎨 Theme changed to: ${theme}`);
    console.log("📊 All page elements should now reflect the new theme");
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};
