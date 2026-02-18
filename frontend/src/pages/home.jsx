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

  const recognitionRef = useRef(null);
  const isRecognizingRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const chatEndRef = useRef(null);
  const processingRef = useRef(false);
  const isActivatedRef = useRef(false);

  useEffect(() => {
    const unlockAudio = () => {
      if (!("speechSynthesis" in window)) return;

      const utter = new SpeechSynthesisUtterance("");
      window.speechSynthesis.speak(utter);
      window.speechSynthesis.cancel();

      document.removeEventListener("click", unlockAudio);
      document.removeEventListener("touchstart", unlockAudio);
    };

    document.addEventListener("click", unlockAudio);
    document.addEventListener("touchstart", unlockAudio);

    return () => {
      document.removeEventListener("click", unlockAudio);
      document.removeEventListener("touchstart", unlockAudio);
    };
  }, []);

  const MAX_REPLIES = 10;
  const replyCount = userData?.replyCount || 0;
  const limitReached = replyCount >= MAX_REPLIES;

  // Load history from DB
  useEffect(() => {
    if (userData?.messages) {
      setMessages(userData.messages);
    }
  }, [userData?.messages]);

  // Smooth Animated Counter
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

  // 12 Hour Countdown (Always Starts From 12h)
  useEffect(() => {
    if (replyCount >= MAX_REPLIES) {
      // If timer not already started
      if (!limitStartTime) {
        setLimitStartTime(Date.now());
      }
    } else {
      // Reset everything if below limit
      setLimitStartTime(null);
      setTimeLeft("");
    }
  }, [replyCount]);

  useEffect(() => {
    if (!limitStartTime) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - limitStartTime;
      const remaining = 12 * 60 * 60 * 1000 - elapsed;

      if (remaining <= 0) {
        setTimeLeft("00h 00m 00s");
        clearInterval(interval);
        return;
      }

      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

      setTimeLeft(
        `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(
          2,
          "0",
        )}m ${String(seconds).padStart(2, "0")}s`,
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [limitStartTime]);

  // ================= LOGOUT =================
  const handleLogout = async () => {
    try {
      setLoading(true);
      await axios.get(`${serverURL}/api/auth/signout`, {
        withCredentials: true,
      });
      toast.success("Logged out successfully 👋");
    } catch {
      toast.error("Session ended. Logging out...");
    } finally {
      setUserData(null);
      setLoading(false);
      navigate("/signin");
    }
  };

  // ================= SPEAK =================
  const speak = (text) => {
    if (!("speechSynthesis" in window)) return;

    const synth = window.speechSynthesis;

    // Stop recognition before speaking
    try {
      recognitionRef.current?.stop();
    } catch {}

    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";

    utterance.onstart = () => {
      isSpeakingRef.current = true;
    };

    utterance.onend = () => {
      isSpeakingRef.current = false;

      setTimeout(() => {
        startRecognition();
      }, 150);
    };

    utterance.onerror = () => {
      isSpeakingRef.current = false;
    };

    const voices = synth.getVoices();

    if (!voices.length) {
      speechSynthesis.onvoiceschanged = () => {
        synth.speak(utterance);
      };
    } else {
      synth.speak(utterance);
    }
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
    }, 1000);
  };

  // ================= VOICE =================
  const startRecognition = () => {
    if (isRecognizingRef.current || isSpeakingRef.current) return;
    try {
      recognitionRef.current?.start();
    } catch (e) {
      console.log("Recognition start error caught");
    }
  };

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

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

    recognition.onresult = async (event) => {
      const result = event.results[event.resultIndex];
      const transcript = result[0].transcript.toLowerCase().trim();
      const isFinal = result.isFinal;

      const assistantTrigger =
        userData?.assistantName?.toLowerCase() || "assistant";

      if (!isFinal) return;

      // 🟢 STEP 1: Wake word detection
      if (!isActivatedRef.current && transcript.includes(assistantTrigger)) {
        isActivatedRef.current = true;
        speak("Yes?");
        return;
      }

      // 🟢 STEP 2: After wake word → treat next speech as command
      if (isActivatedRef.current && !processingRef.current) {
        processingRef.current = true;
        isActivatedRef.current = false;

        if (limitReached) {
          const limitMsg = "⚠️ Your free limit is over. Try next working day.";
          setMessages((prev) => [
            ...prev,
            { role: "assistant", text: limitMsg },
          ]);
          speak(limitMsg);
          processingRef.current = false;
          return;
        }

        setMessages((prev) => [...prev, { role: "user", text: transcript }]);

        setLoadingAI(true);

        const data = await getGeminiResponse(transcript);

        setLoadingAI(false);

        if (data) {
          setUserData((prev) => ({
            ...prev,
            replyCount: data.replyCount ?? prev.replyCount,
            lastReset: data.lastReset ?? prev.lastReset,
            messages: [
              ...(prev.messages || []),
              { role: "user", text: transcript },
              { role: "assistant", text: data.response },
            ],
          }));

          setMessages((prev) => [
            ...prev,
            { role: "assistant", text: data.response },
          ]);

          handleCommand(data);
        }

        processingRef.current = false;
      }
    };

    startRecognition();
    return () => {
      recognition.stop();
      window.speechSynthesis.cancel();
    };
  }, [limitReached, userData?.assistantName]);

  // ================= AUTO SCROLL =================
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingText, loadingAI]);

  return (
    <div
      className={`w-full min-h-screen bg-gradient-to-t from-black to-[#090993]
      flex flex-col items-center px-4 relative transition-all duration-700
      ${messages.length === 0 ? "justify-center" : "justify-start py-6"}`}
    >
      {/* Top Buttons */}
      <div
        className="w-full flex flex-wrap justify-center sm:justify-end gap-3 
sticky top-0 z-50 bg-gradient-to-t  
py-4 px-4 "
      >
        <button
          className="px-4 h-[40px] bg-white text-black rounded-full text-sm font-semibold hover:bg-gray-200 transition"
          onClick={handleLogout}
          disabled={loading}
        >
          {loading ? "Logging out..." : "Logout"}
        </button>

        <button
          onClick={async () => {
            try {
              await axios.post(
                `${serverURL}/api/user/clear-history`,
                {},
                { withCredentials: true },
              );
              setMessages([]);
              setUserData((prev) => ({ ...prev, messages: [] }));
              toast.success("History cleared");
            } catch (e) {
              toast.error("Failed to clear history");
            }
          }}
          className="px-4 h-[40px] bg-red-500 text-white rounded-full text-sm font-semibold hover:bg-red-600 transition"
        >
          Clear History
        </button>

        <button
          className="px-4 h-[40px] bg-white text-black rounded-full text-sm font-semibold hover:bg-gray-200 transition"
          onClick={() => navigate("/customize")}
        >
          Customize
        </button>
      </div>

      {/* Avatar */}
      <div className="w-[220px] h-[280px] sm:w-[280px] sm:h-[360px] mt-4 overflow-hidden rounded-3xl shadow-2xl border border-white/20">
        <img
          src={userData?.assistantImage || "/default-avatar.png"}
          alt="Assistant"
          className="h-full w-full object-cover"
        />
      </div>

      {/* Name */}
      <h1 className="text-white text-center text-xl sm:text-2xl font-semibold mt-6">
        I'M{" "}
        <span className="text-blue-300">
          {userData?.assistantName || "Your Assistant"}
        </span>
      </h1>

      {/* Usage Bar */}
      <div className="w-full max-w-[500px] mt-4 px-2">
        <div className="flex justify-between text-xs text-gray-300 mb-1">
          <span>Daily Free Usage</span>
          <span>
            {animatedCount} / {MAX_REPLIES}
          </span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ease-out ${
              limitReached ? "bg-red-500" : "bg-blue-400"
            }`}
            style={{
              width: `${(animatedCount / MAX_REPLIES) * 100}%`,
            }}
          />
        </div>
      </div>
      {limitReached && (
        <p className="text-red-400 text-xs sm:text-sm mt-2 text-center animate-pulse">
          Resets in {timeLeft}
        </p>
      )}

      {/* Chat */}
      <div className="w-full max-w-2xl mt-6 bg-white/10 backdrop-blur-xl rounded-3xl p-4 sm:p-6 shadow-2xl border border-white/20 flex flex-col gap-4 overflow-y-auto max-h-[350px] sm:max-h-[450px]">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`px-4 py-3 rounded-2xl shadow-md max-w-[85%] sm:max-w-[75%] ${
              msg.role === "user"
                ? "bg-white text-black self-end"
                : "bg-blue-600 text-white self-start"
            }`}
          >
            {msg.text}
          </div>
        ))}

        {typingText && (
          <div className="bg-blue-600 text-white px-4 py-3 rounded-2xl self-start max-w-[85%] sm:max-w-[75%]">
            {typingText}
          </div>
        )}

        {loadingAI && (
          <div className="bg-blue-600 text-white px-4 py-3 rounded-2xl animate-pulse self-start">
            Thinking...
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      <p className="text-gray-300 text-xs sm:text-sm mt-6">
        {listening ? "🎤 Listening..." : "💤 Waiting for wake word..."}
      </p>
    </div>
  );
}

export default Home;
