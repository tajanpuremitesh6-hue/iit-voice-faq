"use client";

import { useState } from "react";

type Source = {
  document_name: string;
  chunk_index: number;
  similarity: number;
};

export default function Home() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);

 const speakText = (text: string) => {
  if (!text || typeof window === "undefined") return;

  // Clean Markdown formatting before speech
  const cleanText = text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`(.*?)`/g, "$1")
    .replace(/#{1,6}\s?/g, "")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/\n{2,}/g, ". ")
    .trim();

  window.speechSynthesis.cancel();

  const speech = new SpeechSynthesisUtterance(cleanText);
  speech.lang = "en-IN";
  speech.rate = 0.95;
  speech.pitch = 1;

  window.speechSynthesis.speak(speech);
};

  const askQuestion = async () => {
    if (!question.trim() || loading) return;

    setLoading(true);
    setAnswer("");
    setSources([]);

    // Stop any previous speech
    if (typeof window !== "undefined") {
      window.speechSynthesis.cancel();
    }

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: question.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Something went wrong");
      }

      setAnswer(data.answer);
      setSources(data.sources || []);

      // Automatically speak the answer
      speakText(data.answer);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Something went wrong.";

      setAnswer(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const startVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => {
      setListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuestion(transcript);
    };

    recognition.onerror = (event: any) => {
      console.log("Speech recognition error:", event.error);
      setListening(false);

      if (event.error === "not-allowed") {
        alert(
          "Microphone permission was blocked. Please allow microphone access."
        );
      } else if (event.error === "no-speech") {
        alert("I didn't hear anything. Please try speaking again.");
      } else {
        alert("Voice recognition error: " + event.error);
      }
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.start();
  };

  const speakAnswer = () => {
    speakText(answer);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-6 py-12">

        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 text-5xl">🎓</div>

          <h1 className="text-4xl font-bold tracking-tight">
            IIT Voice FAQ
          </h1>

          <p className="mt-3 text-slate-400">
            Ask questions about IIT Madras and IIT Roorkee
          </p>
        </div>

        {/* Search Box */}
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-2xl">

            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  askQuestion();
                }
              }}
              placeholder="Ask something about IIT Madras or IIT Roorkee..."
              className="min-h-28 w-full resize-none bg-transparent p-2 text-lg text-white outline-none placeholder:text-slate-600"
            />

            <div className="mt-4 flex items-center justify-between">

              <button
                onClick={startVoiceInput}
                className={`rounded-xl px-4 py-3 transition ${
                  listening
                    ? "bg-red-500 text-white"
                    : "bg-slate-800 text-slate-200 hover:bg-slate-700"
                }`}
              >
                {listening ? "🔴 Listening..." : "🎤 Voice"}
              </button>

              <button
                onClick={askQuestion}
                disabled={loading || !question.trim()}
                className="rounded-xl bg-blue-600 px-6 py-3 font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? "Thinking..." : "Ask →"}
              </button>

            </div>
          </div>
        </div>

        {/* Answer */}
        {answer && (
          <div className="mx-auto mt-10 max-w-3xl">

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  AI Answer
                </h2>

                <button
                  onClick={speakAnswer}
                  className="rounded-lg bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700"
                >
                  🔊 Listen
                </button>
              </div>

              <p className="whitespace-pre-wrap leading-7 text-slate-300">
                {answer}
              </p>

            </div>

            {/* Sources */}
            {sources.length > 0 && (
              <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-6">

                <h3 className="mb-4 font-semibold">
                  📚 Sources
                </h3>

                <div className="space-y-3">
                  {sources.map((source, index) => (
                    <div
                      key={`${source.document_name}-${source.chunk_index}-${index}`}
                      className="rounded-xl bg-slate-800 p-4"
                    >
                      <div className="font-medium">
                        {source.document_name}
                      </div>

                      <div className="mt-1 text-sm text-slate-400">
                        Chunk {source.chunk_index} · Similarity{" "}
                        {(source.similarity * 100).toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )}

          </div>
        )}

        {/* Footer */}
        <div className="mt-16 text-center text-sm text-slate-600">
          Powered by Gemini + Supabase Vector Search
        </div>

      </div>
    </main>
  );
}