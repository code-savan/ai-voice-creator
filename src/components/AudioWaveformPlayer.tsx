import { useEffect, useRef, useState, useMemo } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Download,
  Repeat,
  Share2,
  Check,
  RotateCw,
  FastForward,
  Rewind,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { formatTime, downloadWavFile } from "../utils/audio";
import { VOICES } from "../data/voices";

interface AudioWaveformPlayerProps {
  audioUrl: string | null;
  base64Audio?: string | null;
  voiceName?: string;
  styleLabel?: string;
  textSnippet?: string;
  duration?: number;
  onReplay?: () => void;
}

export function AudioWaveformPlayer({
  audioUrl,
  base64Audio,
  voiceName = "Kore",
  styleLabel = "Natural",
  textSnippet = "",
  duration = 0,
}: AudioWaveformPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showFullText, setShowFullText] = useState(false);
  const [wavePeaks, setWavePeaks] = useState<number[]>([]);

  // Find voice avatar gradient
  const voiceObj = useMemo(() => {
    return VOICES.find((v) => v.id.toLowerCase() === voiceName.toLowerCase()) || VOICES[0];
  }, [voiceName]);

  // Generate waveform peaks on new audio
  useEffect(() => {
    if (!audioUrl) {
      setWavePeaks([]);
      return;
    }

    const numBars = 80;
    const peaks: number[] = [];
    let prev = 0.45;
    for (let i = 0; i < numBars; i++) {
      const envelope = Math.sin((i / numBars) * Math.PI);
      const rand = Math.random() * 0.7 + 0.3;
      const val = Math.max(0.18, Math.min(1.0, (prev * 0.35 + rand * 0.65) * (envelope * 0.75 + 0.25)));
      peaks.push(val);
      prev = val;
    }
    setWavePeaks(peaks);
    setCurrentTime(0);
    setIsPlaying(false);
  }, [audioUrl]);

  // Handle Play/Pause
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((e) => console.error("Playback error:", e));
    }
  };

  // Skip -5 seconds
  const handleSkipBackward = () => {
    if (!audioRef.current) return;
    const newTime = Math.max(0, audioRef.current.currentTime - 5);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Skip +5 seconds
  const handleSkipForward = () => {
    if (!audioRef.current) return;
    const maxTime = audioDuration || audioRef.current.duration || 100;
    const newTime = Math.min(maxTime, audioRef.current.currentTime + 5);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Replay from beginning
  const handleRestart = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    setCurrentTime(0);
    audioRef.current.play().catch(() => {});
  };

  // Audio Event Listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setAudioDuration(audio.duration);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  // Update playback parameters
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.loop = isLooping;
    }
  }, [playbackRate, volume, isMuted, isLooping]);

  // Handle Seek from timeline or waveform
  const handleSeek = (progressRatio: number) => {
    if (!audioRef.current) return;
    const target = Math.max(0, Math.min(1, progressRatio)) * (audioDuration || 1);
    audioRef.current.currentTime = target;
    setCurrentTime(target);
  };

  // Canvas visualizer rendering with ResizeObserver support
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || wavePeaks.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Resize canvas to match display container
    if (containerRef.current) {
      canvas.width = containerRef.current.clientWidth * (window.devicePixelRatio || 1);
      canvas.height = 70 * (window.devicePixelRatio || 1);
    }

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const totalBars = wavePeaks.length;
      const barWidth = Math.max(2.5, (width / totalBars) * 0.65);
      const gap = (width - totalBars * barWidth) / Math.max(1, totalBars - 1);
      const currentProgress = audioDuration > 0 ? currentTime / audioDuration : 0;
      const activeBarIndex = Math.floor(currentProgress * totalBars);

      for (let i = 0; i < totalBars; i++) {
        const x = i * (barWidth + gap);
        let peak = wavePeaks[i];

        // Animated dynamic bounce while playing
        if (isPlaying) {
          const distanceToActive = Math.abs(i - activeBarIndex);
          if (distanceToActive < 8) {
            const dynamicScale = Math.sin(Date.now() / 100 + i * 0.6) * 0.28;
            peak = Math.min(1.0, Math.max(0.18, peak + dynamicScale));
          }
        }

        const barHeight = Math.max(8 * (window.devicePixelRatio || 1), peak * (height - 12));
        const y = (height - barHeight) / 2;
        const isPast = i <= activeBarIndex;

        if (isPast) {
          ctx.fillStyle = document.documentElement.classList.contains("dark") ? "#f4f4f5" : "#18181b"; // zinc-100 or zinc-900
        } else {
          ctx.fillStyle = document.documentElement.classList.contains("dark") ? "rgba(244, 244, 245, 0.2)" : "rgba(24, 24, 27, 0.2)";
        }

        ctx.beginPath();
        const radius = barWidth / 2;
        ctx.roundRect(x, y, barWidth, barHeight, radius);
        ctx.fill();
      }

      if (isPlaying) {
        animationFrameRef.current = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [wavePeaks, currentTime, audioDuration, isPlaying]);

  const handleDownload = () => {
    const filename = `speech-${voiceName.toLowerCase()}-${Date.now()}.wav`;
    if (base64Audio) {
      downloadWavFile(base64Audio, filename);
    } else if (audioUrl) {
      const a = document.createElement("a");
      a.href = audioUrl;
      a.download = filename;
      a.click();
    }
  };

  const handleCopySnippet = () => {
    if (textSnippet) {
      navigator.clipboard.writeText(textSnippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!audioUrl) {
    return (
      <div className="flex flex-col items-center justify-center p-8 sm:p-10 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/40 text-center">
        <div className="w-14 h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 text-zinc-600 dark:text-zinc-400 flex items-center justify-center mb-3.5 shadow-xs">
          <Volume2 className="w-7 h-7" />
        </div>
        <h3 className="text-sm sm:text-base font-bold text-zinc-800 dark:text-zinc-200">
          Studio Audio Player
        </h3>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-sm mt-1 leading-relaxed">
          Your generated high-fidelity audio will appear here with timeline seeking, waveform visualization, speed rates, and WAV export.
        </p>
      </div>
    );
  }

  const progressPercent = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-200/90 dark:border-zinc-900/80 bg-white dark:bg-zinc-900 shadow-md p-4 sm:p-5.5 flex flex-col gap-4.5 transition-all">
      {/* Hidden native audio element */}
      <audio ref={audioRef} src={audioUrl} preload="auto" />

      {/* Top Bar: Voice & Status Badge + Actions */}
      <div className="flex items-center justify-between flex-wrap gap-2.5">
        <div className="flex items-center gap-2.5">
          {/* Avatar & Pulse Indicator */}
          <div className="relative">
            <div
              className={`w-9 h-9 rounded-xl bg-gradient-to-br ${voiceObj.avatarColor} text-white flex items-center justify-center font-bold text-sm shadow-xs`}
            >
              {voiceName.charAt(0)}
            </div>
            {isPlaying && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white dark:border-zinc-900"></span>
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white">
                {voiceName}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 font-semibold capitalize border border-zinc-200/60 dark:border-zinc-800/60">
                {styleLabel}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
              <span className="font-medium">24kHz Studio Quality WAV</span>
              <span>•</span>
              <span className="font-mono text-[11px] text-zinc-600 dark:text-zinc-400 font-semibold">
                {formatTime(currentTime)} / {formatTime(audioDuration)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons: Copy Text & Download */}
        <div className="flex items-center gap-1.5">
          {textSnippet && (
            <button
              id="player-copy-text-btn"
              type="button"
              onClick={handleCopySnippet}
              title="Copy transcript text"
              className="min-h-[36px] px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-xs font-semibold flex items-center gap-1.5"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Share2 className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
            </button>
          )}

          <button
            id="player-download-wav-btn"
            type="button"
            onClick={handleDownload}
            title="Download uncompressed studio WAV file"
            className="min-h-[36px] flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 hover:opacity-90 text-white dark:text-zinc-900 text-xs font-bold shadow-sm transition-all active:scale-95"
          >
            <Download className="w-4 h-4 stroke-[2.2]" />
            <span>Download WAV</span>
          </button>
        </div>
      </div>

      {/* Interactive Waveform Container */}
      <div
        ref={containerRef}
        id="waveform-interactive-container"
        className="relative w-full h-18 sm:h-20 bg-zinc-900/5 dark:bg-zinc-950/80 rounded-2xl p-2 cursor-pointer flex items-center justify-center overflow-hidden border border-zinc-200/80 dark:border-zinc-800 group shadow-inner"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const ratio = clickX / rect.width;
          handleSeek(ratio);
        }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
          style={{ width: "100%", height: "100%" }}
        />

        {/* Floating Scrubber Handle */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-zinc-900 dark:bg-zinc-100 shadow-sm pointer-events-none transition-all"
          style={{ left: `${progressPercent}%` }}
        >
          <div className="w-3 h-3 bg-zinc-900 dark:bg-zinc-100 border-2 border-white dark:border-black rounded-full -ml-[5px] -mt-1 shadow-sm" />
        </div>

        {/* Hover Hint */}
        <div className="absolute inset-0 bg-black/5 dark:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-end justify-end p-2">
          <span className="text-[10px] text-zinc-600 font-mono bg-white/90 dark:bg-zinc-800/90 px-1.5 py-0.5 rounded shadow-sm">
            Tap anywhere to seek
          </span>
        </div>
      </div>

      {/* Primary Timeline Scrubber Slider (High touch target for mobile) */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono font-semibold text-zinc-900 dark:text-zinc-100 min-w-[36px]">
          {formatTime(currentTime)}
        </span>
        <div className="relative flex-1 flex items-center py-1">
          <input
            id="player-timeline-slider"
            type="range"
            min="0"
            max={audioDuration || 1}
            step="0.05"
            value={currentTime}
            onChange={(e) => handleSeek(parseFloat(e.target.value) / (audioDuration || 1))}
            className="w-full h-2 rounded-lg bg-zinc-200 dark:bg-zinc-700 accent-zinc-900 dark:accent-zinc-100 cursor-pointer"
          />
        </div>
        <span className="text-xs font-mono font-medium text-zinc-600 dark:text-zinc-400 min-w-[36px] text-right">
          {formatTime(audioDuration)}
        </span>
      </div>

      {/* Playback Controls Row */}
      <div className="flex items-center justify-between flex-wrap gap-3 pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
        {/* Main Controls: Play, Rewind 5s, Forward 5s, Restart */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Main Play / Pause Button (Min 48px touch target) */}
          <button
            id="player-main-play-toggle"
            type="button"
            onClick={togglePlay}
            className="min-w-[48px] min-h-[48px] rounded-full bg-zinc-900 dark:bg-zinc-100 hover:opacity-90 active:scale-95 text-white dark:text-zinc-900 flex items-center justify-center shadow-sm transition-transform"
            title={isPlaying ? "Pause audio" : "Play audio"}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          {/* Skip Backward 5s */}
          <button
            id="player-skip-back-5s"
            type="button"
            onClick={handleSkipBackward}
            title="Rewind 5 seconds"
            className="min-w-[40px] min-h-[40px] rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center transition-colors text-xs font-semibold"
          >
            <Rewind className="w-4 h-4" />
          </button>

          {/* Skip Forward 5s */}
          <button
            id="player-skip-forward-5s"
            type="button"
            onClick={handleSkipForward}
            title="Fast forward 5 seconds"
            className="min-w-[40px] min-h-[40px] rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center transition-colors text-xs font-semibold"
          >
            <FastForward className="w-4 h-4" />
          </button>

          {/* Replay from start */}
          <button
            id="player-restart-btn"
            type="button"
            onClick={handleRestart}
            title="Replay from start"
            className="min-w-[40px] min-h-[40px] rounded-xl text-zinc-600 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Speed, Loop, and Volume Controls */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Speed Presets */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-xl text-xs font-medium border border-zinc-200/50 dark:border-zinc-700/50">
            {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
              <button
                key={rate}
                id={`speed-btn-${rate}x`}
                type="button"
                onClick={() => setPlaybackRate(rate)}
                className={`min-h-[30px] px-2 py-1 rounded-lg transition-all text-xs ${
                  playbackRate === rate
                    ? "bg-white dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 shadow-xs font-bold"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>

          {/* Loop Toggle */}
          <button
            id="player-loop-toggle"
            type="button"
            onClick={() => setIsLooping(!isLooping)}
            title={isLooping ? "Disable Loop" : "Enable Loop"}
            className={`min-w-[36px] min-h-[36px] rounded-xl flex items-center justify-center transition-colors ${
              isLooping
                ? "bg-zinc-100 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 font-semibold"
                : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            }`}
          >
            <Repeat className="w-4 h-4" />
          </button>

          {/* Volume Slider & Mute Toggle */}
          <div className="flex items-center gap-1.5 pl-1 border-l border-zinc-200 dark:border-zinc-800">
            <button
              id="player-mute-toggle"
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              title={isMuted ? "Unmute" : "Mute"}
              className="min-w-[32px] min-h-[32px] rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 flex items-center justify-center"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-500" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              id="player-volume-slider"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                if (isMuted) setIsMuted(false);
              }}
              className="w-14 sm:w-18 accent-zinc-600 h-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-700 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Spoken Text Accordion / Preview */}
      {textSnippet && (
        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
          <button
            type="button"
            onClick={() => setShowFullText(!showFullText)}
            className="flex items-center justify-between w-full text-left text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-600 transition-colors"
          >
            <span>Spoken Transcript</span>
            {showFullText ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
          <p
            className={`text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed ${
              showFullText ? "" : "line-clamp-2"
            }`}
          >
            {textSnippet}
          </p>
        </div>
      )}
    </div>
  );
}
