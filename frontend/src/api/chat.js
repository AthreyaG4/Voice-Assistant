import API_BASE_URL from "./ApiBase";

export async function chat(audioBlob) {
  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.webm");

  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) throw new Error("Transcription failed");
  return await response.json();
}
