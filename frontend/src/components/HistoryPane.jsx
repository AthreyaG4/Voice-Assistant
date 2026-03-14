import { useEffect, useRef } from "react";

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

function MicIcon({ className = "" }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <rect
        x="9"
        y="2"
        width="6"
        height="13"
        rx="3"
        fill="currentColor"
        opacity="0.9"
      />
      <path
        d="M5 10a7 7 0 0 0 14 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <line
        x1="12"
        y1="19"
        x2="12"
        y2="23"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CommandCard({ entry, index }) {
  return (
    <div className="bg-[rgba(74,222,128,0.04)] border border-[rgba(74,222,128,0.09)] rounded-[10px] p-3 flex flex-col gap-[10px] animate-[cardIn_0.3s_cubic-bezier(0.34,1.3,0.64,1)_both]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[9px]">
          <div className="w-7 h-7 rounded-[7px] bg-[rgba(74,222,128,0.1)] border border-[rgba(74,222,128,0.12)] flex items-center justify-center text-[rgba(74,222,128,0.7)] shrink-0">
            <MicIcon />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-sans text-[0.78rem] font-medium text-[rgba(134,239,172,0.75)]">
              Command #{index + 1}
            </span>
            <span className="font-sans text-[0.68rem] text-[rgba(74,222,128,0.35)]">
              {formatDuration(entry.duration)}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="font-sans text-[0.68rem] text-[rgba(134,239,172,0.25)]">
            {formatTime(entry.timestamp)}
          </span>
          <span className="font-sans text-[0.65rem] font-medium tracking-[0.06em] uppercase text-[rgba(234,179,8,0.55)] bg-[rgba(234,179,8,0.07)] border border-[rgba(234,179,8,0.12)] rounded-full px-[7px] py-px">
            pending
          </span>
        </div>
      </div>
      <div className="pt-1 border-t border-[rgba(74,222,128,0.06)]">
        <p className="font-sans text-[0.75rem] text-[rgba(134,239,172,0.2)] italic">
          Waiting for assistant response...
        </p>
      </div>
    </div>
  );
}

export default function HistoryPane({ entries }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries]);

  return (
    <div className="w-[300px] shrink-0 flex flex-col bg-[#080f0a] border-l border-[rgba(74,222,128,0.08)]">
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[rgba(74,222,128,0.07)] shrink-0">
        <span className="font-sans text-[0.75rem] font-semibold tracking-[0.14em] uppercase text-[rgba(134,239,172,0.35)]">
          Activity
        </span>
        {entries.length > 0 && (
          <span className="font-sans text-[0.7rem] font-medium text-[rgba(74,222,128,0.5)] bg-[rgba(74,222,128,0.08)] border border-[rgba(74,222,128,0.12)] rounded-full px-2 py-px">
            {entries.length}
          </span>
        )}
      </div>

      <div className="history-list flex-1 overflow-y-auto p-3 flex flex-col gap-2 scrollbar-thin">
        {entries.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-10 px-5 gap-[10px]">
            <div className="mb-1 text-[rgba(74,222,128,0.2)]">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <rect
                  x="9"
                  y="2"
                  width="6"
                  height="13"
                  rx="3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                  opacity="0.4"
                />
                <path
                  d="M5 10a7 7 0 0 0 14 0"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.4"
                />
                <line
                  x1="12"
                  y1="19"
                  x2="12"
                  y2="23"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  opacity="0.4"
                />
              </svg>
            </div>
            <p className="font-sans text-[0.85rem] font-medium text-[rgba(134,239,172,0.3)]">
              No commands yet
            </p>
            <p className="font-sans text-[0.75rem] text-[rgba(134,239,172,0.18)] text-center leading-relaxed">
              Tap the blob to start recording a task
            </p>
          </div>
        ) : (
          entries.map((entry, i) => (
            <CommandCard key={entry.id} entry={entry} index={i} />
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
