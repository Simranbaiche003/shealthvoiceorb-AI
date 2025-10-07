import { useState, useRef, useEffect } from "react";
import { VoiceOrb } from "./VoiceOrb";
import logo from "@/assets/shealth-logo.png";
import { useToast } from "@/hooks/use-toast";

type VoiceState = "idle" | "listening" | "processing" | "speaking";

const stateMessages = {
  idle: "Tap to speak",
  listening: "Listening...",
  processing: "Analyzing your request...",
  speaking: "Shealth.ai is speaking...",
};

// N8N Webhook URL - Your backend endpoint
const N8N_WEBHOOK_URL = "https://simranbaicheshealthai.app.n8n.cloud/webhook/shealth-api";

export const VoiceAssistant = () => {
  const [state, setState] = useState<VoiceState>("idle");
  const { toast } = useToast();
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log('User said:', transcript);
        handleUserSpeech(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        toast({
          title: "Error",
          description: "Could not recognize speech. Please try again.",
          variant: "destructive",
        });
        setState("idle");
      };

      recognitionRef.current.onend = () => {
        console.log('Speech recognition ended');
      };
    } else {
      toast({
        title: "Not Supported",
        description: "Speech recognition is not supported in this browser.",
        variant: "destructive",
      });
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleUserSpeech = async (transcript: string) => {
    setState("processing");

    try {
      // Send the transcript to your n8n webhook
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: transcript,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from backend");
      }

      const data = await response.json();
      console.log('Backend response:', data);

      // Speak the response
      const responseText = data.response || data.message || "I didn't get a response from the backend.";
      speakResponse(responseText);

    } catch (error) {
      console.error('Error communicating with backend:', error);
      toast({
        title: "Error",
        description: "Failed to communicate with the backend.",
        variant: "destructive",
      });
      setState("idle");
    }
  };

  const speakResponse = (text: string) => {
    setState("speaking");

    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      synthesisRef.current = new SpeechSynthesisUtterance(text);
      synthesisRef.current.lang = 'en-US';
      synthesisRef.current.rate = 1.0;
      synthesisRef.current.pitch = 1.0;

      synthesisRef.current.onend = () => {
        console.log('Speech synthesis finished');
        setState("idle");
      };

      synthesisRef.current.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setState("idle");
      };

      window.speechSynthesis.speak(synthesisRef.current);
    } else {
      // Fallback: just show the text
      toast({
        title: "Response",
        description: text,
      });
      setState("idle");
    }
  };

  const handleOrbClick = () => {
    if (state === "idle") {
      if (!recognitionRef.current) {
        toast({
          title: "Not Supported",
          description: "Speech recognition is not available in this browser. Please use Chrome, Edge, or Safari.",
          variant: "destructive",
        });
        return;
      }

      setState("listening");
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting recognition:', error);
        toast({
          title: "Error",
          description: "Could not start voice recognition.",
          variant: "destructive",
        });
        setState("idle");
      }
    } else if (state === "speaking") {
      // Stop speaking if clicked during speech
      window.speechSynthesis.cancel();
      setState("idle");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-8 relative overflow-hidden">
      {/* Ambient background effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[100px] animate-pulse [animation-delay:1s]" />

      {/* Header */}
      <header className="w-full max-w-4xl flex flex-col items-center gap-4 animate-fade-in-up">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Shealth.ai" className="w-12 h-12" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Shealth.ai
          </h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Your Smart Health Insurance Assistant
        </p>
      </header>

      {/* Main voice interface */}
      <main className="flex-1 flex flex-col items-center justify-center gap-12 w-full max-w-4xl">
        {/* Voice Orb */}
        <div
          onClick={handleOrbClick}
          className="cursor-pointer transform transition-transform hover:scale-105 active:scale-95"
        >
          <VoiceOrb state={state} />
        </div>

        {/* Status message */}
        <div className="glass-card px-8 py-4 rounded-full animate-fade-in-up">
          <p className="text-xl font-medium text-center min-w-[300px]">
            {stateMessages[state]}
          </p>
        </div>

        {/* Hint text */}
        {state === "idle" && (
          <p className="text-sm text-muted-foreground animate-fade-in-up [animation-delay:0.3s]">
            Say "Hey Shealth" or tap the orb to start
          </p>
        )}

        {/* Optional info cards */}
        {state === "idle" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mt-8 animate-fade-in-up [animation-delay:0.6s]">
            <div className="glass p-6 rounded-2xl hover:glass-card transition-all cursor-pointer group">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Check Coverage</h3>
              <p className="text-sm text-muted-foreground">
                Ask about your insurance benefits
              </p>
            </div>

            <div className="glass p-6 rounded-2xl hover:glass-card transition-all cursor-pointer group">
              <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <svg
                  className="w-6 h-6 text-secondary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Book Appointments</h3>
              <p className="text-sm text-muted-foreground">
                Schedule with in-network providers
              </p>
            </div>

            <div className="glass p-6 rounded-2xl hover:glass-card transition-all cursor-pointer group">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <svg
                  className="w-6 h-6 text-accent"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Track Claims</h3>
              <p className="text-sm text-muted-foreground">
                Monitor your claim status
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-sm text-muted-foreground animate-fade-in-up [animation-delay:0.9s]">
        Powered by Shealth.ai
      </footer>
    </div>
  );
};
