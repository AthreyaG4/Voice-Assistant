import { useState } from "react";
import VoiceBlob from "../components/VoiceBlob";
import HistoryPane from "../components/HistoryPane";
import { chat } from "../api/chat";

export default function App() {
  const [entries, setEntries] = useState([]);
  const [message, setMessage] = useState("Empty Message");

  const handleRecordingComplete = async ({ duration, timestamp }) => {
    setEntries((prev) => [...prev, { id: Date.now(), duration, timestamp }]);
    try {
      const response = await chat("What's the time in newyork?");
      const data = await response.json();
      console.log(data);
      setMessage(data.message);
    } catch (err) {
      console.err(err);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#060f09] overflow-hidden">
      <div className="flex-1 flex items-center justify-center min-w-0">
        <VoiceBlob
          onRecordingComplete={handleRecordingComplete}
          message={message}
        />
      </div>
      <HistoryPane entries={entries} />
    </div>
  );
}
