import { useEffect, useState } from "react";

type VoiceState = "idle" | "listening" | "processing" | "speaking";

interface VoiceOrbProps {
  state: VoiceState;
}

export const VoiceOrb = ({ state }: VoiceOrbProps) => {
  const [waves, setWaves] = useState<number[]>([]);

  useEffect(() => {
    if (state === "listening" || state === "speaking") {
      // Generate random wave heights
      const interval = setInterval(() => {
        setWaves(Array.from({ length: 5 }, () => Math.random()));
      }, 100);
      return () => clearInterval(interval);
    } else {
      setWaves([]);
    }
  }, [state]);

  const getOrbStyles = () => {
    switch (state) {
      case "idle":
        return "animate-pulse-glow";
      case "listening":
        return "shadow-[0_0_40px_hsl(174_100%_37%_/_0.6)]";
      case "processing":
        return "animate-spin-glow shadow-[0_0_50px_hsl(206_96%_62%_/_0.7)]";
      case "speaking":
        return "shadow-[0_0_60px_hsl(174_100%_37%_/_0.8)]";
    }
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* Ripple effects for listening state */}
      {state === "listening" && (
        <>
          <div className="absolute w-64 h-64 rounded-full border-2 border-primary/30 animate-ripple" />
          <div className="absolute w-64 h-64 rounded-full border-2 border-primary/30 animate-ripple [animation-delay:0.5s]" />
        </>
      )}

      {/* Main orb */}
      <div
        className={`relative w-48 h-48 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center transition-all duration-500 ${getOrbStyles()}`}
      >
        {/* Inner glow */}
        <div className="absolute inset-4 rounded-full bg-gradient-to-br from-primary/50 to-secondary/50 blur-xl" />

        {/* Microphone icon for idle */}
        {state === "idle" && (
          <svg
            className="w-16 h-16 text-white relative z-10"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
        )}

        {/* Wave visualization for listening/speaking */}
        {(state === "listening" || state === "speaking") && (
          <div className="flex items-center justify-center gap-1 relative z-10">
            {waves.map((height, i) => (
              <div
                key={i}
                className="w-2 bg-white rounded-full transition-all duration-100 animate-wave"
                style={{
                  height: `${20 + height * 40}px`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Processing spinner */}
        {state === "processing" && (
          <div className="relative z-10">
            <div className="flex gap-2">
              <div className="w-3 h-3 bg-white rounded-full animate-bounce [animation-delay:0s]" />
              <div className="w-3 h-3 bg-white rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-3 h-3 bg-white rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
      </div>

      {/* Outer glow ring */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 blur-2xl -z-10" />
    </div>
  );
};
