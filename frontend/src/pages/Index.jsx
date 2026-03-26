import { useState } from "react";
import VoiceBlob from "../components/VoiceBlob";
import HistoryPane from "../components/HistoryPane";
import { chat } from "../api/chat";

export default function App() {
  const [entries, setEntries] = useState([]);
  const [message, setMessage] = useState("Empty Message");

  const handleRecordingComplete = async ({
    duration,
    timestamp,
    audioBlob,
  }) => {
    setEntries((prev) => [...prev, { id: Date.now(), duration, timestamp }]);
    try {
      const data = await chat(audioBlob);
      setMessage(data.message);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (content) => {
    try {
      const response = await chat(content);
      const data = await response.json();
      setMessage(data.message);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#060f09] overflow-hidden">
      <div className="flex-1 flex items-center justify-center min-w-0">
        <VoiceBlob
          onRecordingComplete={handleRecordingComplete}
          message={message}
          onSubmit={handleSubmit}
        />
      </div>
      <HistoryPane entries={entries} />
    </div>
  );
}
