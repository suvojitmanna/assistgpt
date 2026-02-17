import React, { useContext, useEffect, useRef, useState } from "react";
import { UserDataContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

function Home() {
  const { userData, serverURL, setUserData, getGeminiResponse } =
    useContext(UserDataContext);

  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [typingText, setTypingText] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
  const [listening, setListening] = useState(false);
  const [animatedCount, setAnimatedCount] = useState(0);
  const [limitStartTime, setLimitStartTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [speechEnabled, setSpeechEnabled] = useState(false);

  const recognitionRef = useRef(null);
  const isRecognizingRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const chatEndRef = useRef(null);

  const synth = window.speechSynthesis;

  const MAX_REPLIES = 10;
  const replyCount = userData?.replyCount || 0;
  const limitReached = replyCount >= MAX_REPLIES;

  // ================= UNLOCK SPEECH (ALL DEVICES) =================
  const unlockSpeech = () => {
    if (speechEnabled) return;

    const utterance = new SpeechSynthesisUtterance(" ");
    utterance.volume = 0.1;
    synth.speak(utterance);

    setSpeechEnabled(true);
    console.log("🔓 Speech Enabled");
  };

  // ================= LOAD HISTORY =================
  useEffect(() => {
    if (userData?.messages) {
      setMessages(userData.messages);
    }
  }, [userData?.messages]);

  // ================= ANIMATED COUNTER =================
  useEffect(() => {
    let start = animatedCount;
    let end = replyCount;
    if (start === end) return;

    const duration = 400;
    const incrementTime = 20;
    const steps = duration / incrementTime;
    const increment = (end - start) / steps;

    const interval = setInterval(() => {
      start += increment;
      if ((increment > 0 && start >= end) || (increment < 0 && start <= end)) {
        start = end;
        clearInterval(interval);
      }
      setAnimatedCount(Math.round(start));
    }, incrementTime);

    return () => clearInterval(interval);
  }, [replyCount]);

  // ================= SAFE SPEAK FUNCTION =================
  const speak = (text) => {
    if (!text || !speechEnabled) return;

    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 1;
    utterance.pitch = 1;

    const loadVoice = () => {
      const voices = synth.getVoices();

      if (!voices.length) {
        setTimeout(loadVoice, 200);
        return;
      }

      utterance.voice =
        voices.find((v) => v.lang.includes("en")) || voices[0];

      utterance.onstart = () => {
        isSpeakingRef.current = true;
      };

      utterance.onend = () => {
        isSpeakingRef.current = false;
        setTimeout(startRecognition, 400);
      };

      utterance.onerror = () => {
        isSpeakingRef.current = false;
        startRecognition();
      };

      synth.speak(utterance);
    };

    loadVoice();
  };

  // ================= HANDLE COMMAND =================
  const handleCommand = (data) => {
    const { type, userInput, response } = data;
    speak(response);

    setTimeout(() => {
      const query = encodeURIComponent(userInput);

      const routes = {
        "google-search": `https://www.google.com/search?q=${query}`,
        "youtube-search": `https://www.youtube.com/results?search_query=${query}`,
        "youtube-play": `https://www.youtube.com/results?search_query=${query}`,
        "instagram-open": `https://www.instagram.com/`,
        "facebook-open": `https://m.facebook.com/`,
        "linkedin-search": `https://www.linkedin.com/search/results/all/?keywords=${query}`,
        "calculator-open": `https://www.online-calculator.com/`,
        "get-news": `https://news.google.com/`,
        "weather-show": `https://www.google.com/search?q=weather+${query}`,
      };

      if (routes[type]) {
        window.location.href = routes[type];
      }
    }, 1200);
  };

  // ================= START RECOGNITION =================
  const startRecognition = () => {
    if (isRecognizingRef.current || isSpeakingRef.current) return;
    try {
      recognitionRef.current?.start();
    } catch {}
  };

  // ================= VOICE RECOGNITION =================
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.log("Speech Recognition not supported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognitionRef.current = recognition;

    recognition.onstart = () => {
      isRecognizingRef.current = true;
      setListening(true);
    };

    recognition.onend = () => {
      isRecognizingRef.current = false;
      setListening(false);

      if (!isSpeakingRef.current) {
        setTimeout(() => startRecognition(), 1000);
      }
    };

    recognition.onerror = (event) => {
      console.log("Recognition error:", event.error);
      isRecognizingRef.current = false;
      setListening(false);
    };

    recognition.onresult = async (event) => {
      const transcript =
        event.results[event.resultIndex][0].transcript;

      const assistantTrigger =
        userData?.assistantName?.toLowerCase() || "assistant";

      if (transcript.toLowerCase().includes(assistantTrigger)) {
        recognition.stop();

        if (limitReached) {
          const limitMsg = "Your daily limit is over.";
          setMessages((prev) => [
            ...prev,
            { role: "assistant", text: limitMsg },
          ]);
          speak(limitMsg);
          return;
        }

        setMessages((prev) => [
          ...prev,
          { role: "user", text: transcript },
        ]);

        setLoadingAI(true);

        const data = await getGeminiResponse(transcript);
        setLoadingAI(false);

        if (data) {
          setUserData((prev) => ({
            ...prev,
            replyCount: data.replyCount ?? prev.replyCount,
            messages: [
              ...(prev.messages || []),
              { role: "user", text: transcript },
              { role: "assistant", text: data.response },
            ],
          }));

          let i = 0;
          setTypingText("");

          const interval = setInterval(() => {
            if (i < data.response.length) {
              setTypingText((prev) => prev + data.response[i]);
              i++;
            } else {
              clearInterval(interval);
              setMessages((prev) => [
                ...prev,
                { role: "assistant", text: data.response },
              ]);
              setTypingText("");
              handleCommand(data);
            }
          }, 20);
        }
      }
    };

    startRecognition();

    return () => {
      recognition.stop();
      synth.cancel();
    };
  }, [limitReached, userData?.assistantName]);

  // ================= AUTO SCROLL =================
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingText, loadingAI]);

  return (
    <div
      onClick={unlockSpeech}
      className={`w-full min-h-screen bg-gradient-to-t from-black to-[#090993]
      flex flex-col items-center px-4 relative transition-all duration-700
      ${messages.length === 0 ? "justify-center" : "justify-start py-6"}`}
    >
      <div className="w-full flex justify-center sm:justify-end gap-3 sticky top-0 z-50 py-4">
        <button
          className="px-4 py-2 bg-white text-black rounded-full text-sm font-semibold"
          onClick={() => navigate("/customize")}
        >
          Customize
        </button>
      </div>

      <div className="w-[220px] h-[280px] overflow-hidden rounded-3xl shadow-2xl border border-white/20">
        <img
          src={userData?.assistantImage || "/default-avatar.png"}
          alt="Assistant"
          className="h-full w-full object-cover"
        />
      </div>

      <h1 className="text-white text-center text-xl font-semibold mt-6">
        I'M{" "}
        <span className="text-blue-300">
          {userData?.assistantName || "Your Assistant"}
        </span>
      </h1>

      <div className="w-full max-w-2xl mt-6 bg-white/10 backdrop-blur-xl rounded-3xl p-4 flex flex-col gap-4 overflow-y-auto max-h-[400px]">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`px-4 py-2 rounded-2xl ${
              msg.role === "user"
                ? "bg-white text-black self-end"
                : "bg-blue-600 text-white self-start"
            }`}
          >
            {msg.text}
          </div>
        ))}

        {typingText && (
          <div className="bg-blue-600 text-white px-4 py-2 rounded-2xl self-start">
            {typingText}
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      <p className="text-gray-300 text-xs mt-6">
        {!speechEnabled
          ? "👆 Tap once anywhere to enable voice"
          : listening
          ? "🎤 Listening..."
          : "💤 Waiting..."}
      </p>
    </div>
  );
}

export default Home;
