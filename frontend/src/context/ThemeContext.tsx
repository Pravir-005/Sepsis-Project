import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type Theme = "dark" | "light" | "system";

interface ThemeCtx {
    theme: Theme;
    toggle: () => void;
    setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeCtx>({ theme: "dark", toggle: () => { }, setTheme: () => { } });

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>(() => {
        return (localStorage.getItem("theme") as Theme) || "dark";
    });

    useEffect(() => {
        let applied = theme;
        if (theme === "system") {
            applied = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        }
        document.documentElement.setAttribute("data-theme", applied);
        localStorage.setItem("theme", theme);
    }, [theme]);

    const toggle = () => setThemeState(t => (t === "dark" ? "light" : "dark"));
    const setTheme = (t: Theme) => setThemeState(t);

    return (
        <ThemeContext.Provider value={{ theme, toggle, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
