import { useContext } from "react";
import { SpotifyContext } from "../context/spotify";

export function useSpotify() {
  const context = useContext(SpotifyContext);
  if (!context) {
    throw new Error("useSpotify must be used within SpotifyProvider");
  }
  return context;
}
