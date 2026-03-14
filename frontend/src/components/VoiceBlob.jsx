import { useRef, useState, useEffect, useCallback } from "react";

const NUM_RIDGES = 10;
const IDLE_RADIUS = 120;
const RIDGE_AMPLITUDE = 28;
const RIDGE_RADIUS = IDLE_RADIUS + RIDGE_AMPLITUDE;
const BLOB_CENTER = 200;
const SVG_SIZE = 400;

function polarToCartesian(cx, cy, r, angle) {
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  };
}

function buildIdleBlobPath(t) {
  const points = 8;
  const angleStep = (Math.PI * 2) / points;
  const radii = [
    IDLE_RADIUS + 12 * Math.sin(t * 1.1),
    IDLE_RADIUS + 8 * Math.cos(t * 0.9 + 1),
    IDLE_RADIUS + 14 * Math.sin(t * 1.3 + 2),
    IDLE_RADIUS + 6 * Math.cos(t * 0.7 + 0.5),
    IDLE_RADIUS + 11 * Math.sin(t * 1.0 + 3),
    IDLE_RADIUS + 9 * Math.cos(t * 1.2 + 1.5),
    IDLE_RADIUS + 13 * Math.sin(t * 0.8 + 4),
    IDLE_RADIUS + 7 * Math.cos(t * 1.4 + 2.5),
  ];

  const pts = radii.map((r, i) => {
    const angle = angleStep * i - Math.PI / 2;
    return polarToCartesian(BLOB_CENTER, BLOB_CENTER, r, angle);
  });

  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length; i++) {
    const next = pts[(i + 1) % pts.length];
    const curr = pts[i];
    const mx = (curr.x + next.x) / 2;
    const my = (curr.y + next.y) / 2;
    d += ` Q ${curr.x} ${curr.y} ${mx} ${my}`;
  }
  d += " Z";
  return d;
}

function buildRecordingBlobPath(t, audioLevel) {
  const totalPoints = NUM_RIDGES * 2;
  const angleStep = (Math.PI * 2) / totalPoints;
  const boost = 1 + audioLevel * 0.6;

  const pts = [];
  for (let i = 0; i < totalPoints; i++) {
    const angle = angleStep * i - Math.PI / 2;
    const isPeak = i % 2 === 0;
    let r;
    if (isPeak) {
      const ridgeIdx = i / 2;
      const wave = Math.sin(t * 2.5 + ridgeIdx * 0.8) * 6 * boost;
      r = RIDGE_RADIUS + wave;
    } else {
      const wave = Math.cos(t * 2.0 + i * 0.5) * 3;
      r = IDLE_RADIUS - 8 + wave;
    }
    pts.push(polarToCartesian(BLOB_CENTER, BLOB_CENTER, r, angle));
  }

  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length; i++) {
    const next = pts[(i + 1) % pts.length];
    const curr = pts[i];
    const mx = (curr.x + next.x) / 2;
    const my = (curr.y + next.y) / 2;
    d += ` Q ${curr.x} ${curr.y} ${mx} ${my}`;
  }
  d += " Z";
  return d;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerpPath(idlePts, recordPts, alpha) {
  if (alpha <= 0) return idlePts;
  if (alpha >= 1) return recordPts;

  const totalPoints = NUM_RIDGES * 2;
  const idleAngleStep = (Math.PI * 2) / 8;
  const recAngleStep = (Math.PI * 2) / totalPoints;

  const idleFullPts = Array.from({ length: 8 }, (_, i) => {
    const angle = idleAngleStep * i - Math.PI / 2;
    return polarToCartesian(BLOB_CENTER, BLOB_CENTER, IDLE_RADIUS, angle);
  });

  const recFullPts = Array.from({ length: totalPoints }, (_, i) => {
    const angle = recAngleStep * i - Math.PI / 2;
    const isPeak = i % 2 === 0;
    const r = isPeak ? RIDGE_RADIUS : IDLE_RADIUS - 8;
    return polarToCartesian(BLOB_CENTER, BLOB_CENTER, r, angle);
  });

  const pts = recFullPts.map((rp, i) => {
    const idleIdx = Math.round((i / totalPoints) * 8) % 8;
    const ip = idleFullPts[idleIdx];
    return {
      x: lerp(ip.x, rp.x, alpha),
      y: lerp(ip.y, rp.y, alpha),
    };
  });

  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length; i++) {
    const next = pts[(i + 1) % pts.length];
    const curr = pts[i];
    const mx = (curr.x + next.x) / 2;
    const my = (curr.y + next.y) / 2;
    d += ` Q ${curr.x} ${curr.y} ${mx} ${my}`;
  }
  d += " Z";
  return d;
}

export default function VoiceBlob({ onRecordingComplete, message }) {
  const [recording, setRecording] = useState(false);
  const [morphAlpha, setMorphAlpha] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [status, setStatus] = useState("tap to record");
  const [blobPath, setBlobPath] = useState("");
  const [hovered, setHovered] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const rafRef = useRef(null);
  const startTimeRef = useRef(0);
  const morphStartRef = useRef(0);
  const morphDirectionRef = useRef(0);
  const currentAlphaRef = useRef(0);
  const recordingRef = useRef(false);
  const audioLevelRef = useRef(0);
  const recordingStartRef = useRef(0);

  const animate = useCallback((now) => {
    if (!startTimeRef.current) startTimeRef.current = now;
    const t = (now - startTimeRef.current) / 1000;

    const MORPH_DURATION = 400;
    if (morphDirectionRef.current !== 0) {
      const elapsed = now - morphStartRef.current;
      const raw = elapsed / MORPH_DURATION;
      const progress = Math.min(raw, 1);
      const eased =
        progress < 0.5
          ? 2 * progress * progress
          : -1 + (4 - 2 * progress) * progress;

      if (morphDirectionRef.current === 1) {
        currentAlphaRef.current = eased;
      } else {
        currentAlphaRef.current = 1 - eased;
      }

      if (progress >= 1) morphDirectionRef.current = 0;
      setMorphAlpha(currentAlphaRef.current);
    }

    const alpha = currentAlphaRef.current;
    let path;

    if (alpha < 0.05) {
      path = buildIdleBlobPath(t);
    } else if (alpha > 0.95) {
      path = buildRecordingBlobPath(t, audioLevelRef.current);
    } else {
      const idlePath = buildIdleBlobPath(t);
      const recPath = buildRecordingBlobPath(t, audioLevelRef.current);
      path = lerpPath(idlePath, recPath, alpha);
    }

    setBlobPath(path);
    rafRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [animate]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      const pollLevel = () => {
        if (!recordingRef.current) return;
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        audioLevelRef.current = avg / 128;
        setAudioLevel(audioLevelRef.current);
        requestAnimationFrame(pollLevel);
      };

      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        audioContextRef.current?.close();
      };

      mediaRecorderRef.current.start();
      recordingRef.current = true;
      recordingStartRef.current = Date.now();
      morphDirectionRef.current = 1;
      morphStartRef.current = performance.now();
      setRecording(true);
      setStatus("recording...");
      pollLevel();
    } catch (err) {
      setStatus("mic access denied");
      console.error(err);
    }
  };

  const stopRecording = () => {
    const duration = Math.round(
      (Date.now() - recordingStartRef.current) / 1000,
    );
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    recordingRef.current = false;
    audioLevelRef.current = 0;
    morphDirectionRef.current = -1;
    morphStartRef.current = performance.now();
    setRecording(false);
    setAudioLevel(0);
    setStatus("tap to record");

    if (onRecordingComplete) {
      onRecordingComplete({ duration, timestamp: new Date() });
    }
  };

  const handleBlobClick = () => {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const gradientId = "blobGrad";
  const glowId = "blobGlow";
  const filterGlowId = "filterGlow";

  return (
    <div className="flex flex-col items-center justify-center select-none">
      <div
        className={[
          "cursor-pointer flex items-center justify-center rounded-full",
          "[transition:transform_0.25s_cubic-bezier(0.34,1.56,0.64,1),filter_0.25s_ease]",
          "active:[transition:transform_0.1s_ease,filter_0.1s_ease] active:scale-[0.96] active:brightness-100",
          hovered ? "scale-[1.09] brightness-125" : "scale-100",
        ].join(" ")}
        onClick={handleBlobClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <svg
          width={SVG_SIZE}
          height={SVG_SIZE}
          viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
          style={{ overflow: "visible" }}
        >
          <defs>
            <radialGradient id={gradientId} cx="40%" cy="35%" r="65%">
              <stop
                offset="0%"
                stopColor={recording ? "#d9f99d" : "#4ade80"}
                stopOpacity="1"
              />
              <stop
                offset="55%"
                stopColor={recording ? "#65a30d" : "#16a34a"}
                stopOpacity="1"
              />
              <stop
                offset="100%"
                stopColor={recording ? "#1a2e05" : "#052e16"}
                stopOpacity="1"
              />
            </radialGradient>
            <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
              <stop
                offset="0%"
                stopColor={recording ? "#bef264" : "#86efac"}
                stopOpacity="0.5"
              />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
            <filter
              id={filterGlowId}
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
            >
              <feGaussianBlur
                stdDeviation={recording ? "18" : "10"}
                result="blur"
              />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <ellipse
            cx={BLOB_CENTER}
            cy={BLOB_CENTER}
            rx={IDLE_RADIUS + 40}
            ry={IDLE_RADIUS + 40}
            fill={`url(#${glowId})`}
            style={{
              opacity:
                0.6 +
                morphAlpha * 0.3 +
                audioLevel * 0.2 +
                (hovered ? 0.35 : 0),
            }}
          />

          {blobPath && (
            <>
              <path
                d={blobPath}
                fill={`url(#${gradientId})`}
                filter={`url(#${filterGlowId})`}
                style={{
                  opacity: 0.3,
                  transform: "scale(1.04)",
                  transformOrigin: `${BLOB_CENTER}px ${BLOB_CENTER}px`,
                }}
              />
              <path
                d={blobPath}
                fill={`url(#${gradientId})`}
                style={{ cursor: "pointer" }}
              />
            </>
          )}
        </svg>
      </div>

      <p className="mt-7 font-sans text-[0.9rem] font-normal tracking-[0.12em] lowercase text-[rgba(134,239,172,0.4)] transition-colors duration-[400ms]">
        {status}
      </p>
      <p className="mt-7 font-sans text-[0.9rem] font-normal tracking-[0.12em] lowercase text-[rgba(134,239,172,0.4)] transition-colors duration-[400ms]">
        {message}
      </p>
    </div>
  );
}
