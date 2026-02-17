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

  const recognitionRef = useRef(null);
  const isRecognizingRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const chatEndRef = useRef(null);

  const synth = window.speechSynthesis;

  const MAX_REPLIES = 10;
  const replyCount = userData?.replyCount || 0;
  const limitReached = replyCount >= MAX_REPLIES;

  // ================= MOBILE UNLOCK =================
  useEffect(() => {
    const unlock = () => {
      synth.resume();
    };

    window.addEventListener("click", unlock);
    return () => window.removeEventListener("click", unlock);
  }, []);

  // ================= SPEAK =================
  const speak = (text) => {
  if (!text) return;

  const synth = window.speechSynthesis;

  // Stop recognition safely
  if (recognitionRef.current) {
    try {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
    } catch {}
  }

  // DO NOT use cancel here
  synth.resume();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";

  utterance.onstart = () => {
    isSpeakingRef.current = true;
  };

  utterance.onend = () => {
    isSpeakingRef.current = false;

    // Restart recognition AFTER speech fully finishes
    setTimeout(() => {
      startRecognition();
    }, 1200);
  };

  utterance.onerror = (e) => {
    console.log("Speech error:", e);
    isSpeakingRef.current = false;
  };

  synth.speak(utterance);
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

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
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
      const transcript = event.results[event.resultIndex][0].transcript;

      const assistantTrigger =
        userData?.assistantName?.toLowerCase() || "assistant";

      if (transcript.toLowerCase().includes(assistantTrigger)) {
        recognition.stop();

        if (limitReached) {
          const limitMsg = "⚠️ Your free limit is over. Try next working day.";
          setMessages((prev) => [
            ...prev,
            { role: "assistant", text: limitMsg },
          ]);
          speak(limitMsg);
          return;
        }

        setMessages((prev) => [...prev, { role: "user", text: transcript }]);

        setLoadingAI(true);

        const data = await getGeminiResponse(transcript);

        setLoadingAI(false);

        if (data?.response) {
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

              // SPEAK ONLY ONCE
              speak(data.response);
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

  // ================= LOGOUT =================
  const handleLogout = async () => {
    try {
      setLoading(true);

      await axios.get(`${serverURL}/api/auth/signout`, {
        withCredentials: true,
      });

      toast.success("Logged out successfully 👋");
    } catch (error) {
      toast.error("Session ended. Logging out...");
    } finally {
      setUserData(null);
      setLoading(false);
      navigate("/signin");
    }
  };

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
            {replyCount} / {MAX_REPLIES}
          </span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ease-out ${
              limitReached ? "bg-red-500" : "bg-blue-400"
            }`}
            style={{
              width: `${(replyCount / MAX_REPLIES) * 100}%`,
            }}
          />
        </div>
      </div>
      {limitReached && (
        <p className="text-red-400 text-xs sm:text-sm mt-2 text-center animate-pulse">
          Daily limit reached
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
