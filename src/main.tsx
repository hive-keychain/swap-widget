import { Theme, ThemeContext } from "@theme-context";
import React, { useEffect, useState } from "react";
import { App } from "./app";

export const Main = () => {
  const [theme, setTheme] = useState<Theme>();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    setTheme(Theme.DARK);
    setReady(true);
  };

  const toggleTheme = () => {
    setTheme((oldTheme) => {
      return oldTheme === Theme.DARK ? Theme.LIGHT : Theme.DARK;
    });
  };

  return (
    <>
      {ready && theme && (
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
          <div className={`theme ${theme}`}>
            <App />
          </div>
        </ThemeContext.Provider>
      )}
    </>
  );
};
