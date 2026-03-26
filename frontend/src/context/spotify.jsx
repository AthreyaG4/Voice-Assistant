import { createContext, useEffect, useState } from "react";
import * as api from "../api/spotify";

export const SpotifyContext = createContext(null);

export function SpotifyProvider({ children }) {
  const [spotifyConnected, setSpotifyConnected] = useState(false);

  async function fetchStatus() {
    try {
      const response = await api.getStatus();
      setSpotifyConnected(response.connected);
    } catch (err) {
      console.log(err);
    }
  }

  useEffect(() => {
    fetchStatus();
  }, []);

  async function spotifyLogin() {
    api.spotifyLogin();
  }

  return (
    <SpotifyContext.Provider
      value={{
        spotifyConnected,
        setSpotifyConnected,
        spotifyLogin,
      }}
    >
      {children}
    </SpotifyContext.Provider>
  );
}
