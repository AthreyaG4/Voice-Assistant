import API_BASE_URL from "./ApiBase";

export async function getStatus() {
  const response = await fetch(`${API_BASE_URL}/spotify/status`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) throw new Error("Network response was not ok");

  return await response.json();
}

export function spotifyLogin() {
  window.location.href = `${API_BASE_URL}/spotify/login`;
}
