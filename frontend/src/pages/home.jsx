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
  const [timeLeft, setTimeLeft] = useState("");
  const [currentTime, setCurrentTime] = useState("");

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

  const formatMessageTime = (isoTime) => {
    if (!isoTime) return "";

    const date = new Date(isoTime);

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();

      setCurrentTime(
        now.toLocaleString([], {
          weekday: "short",
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getRestoreTime = () => {
    const now = new Date();

    const tomorrowMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
    );

    return tomorrowMidnight.toLocaleString([], {
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ================= LIMIT TIMER  =================
  useEffect(() => {
    if (!limitReached) {
      setTimeLeft("");
      return;
    }

    const interval = setInterval(() => {
      const now = new Date();

      // Tomorrow at 00:00
      const tomorrowMidnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
      );

      const remaining = tomorrowMidnight - now;

      if (remaining <= 0) {
        setTimeLeft("00h 00m 00s");
        clearInterval(interval);

        // Optional: refresh user automatically
        window.location.reload();

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
  }, [limitReached]);

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
  const speak = (text, redirectUrl = null) => {
  if (!("speechSynthesis" in window)) return;

  const synth = window.speechSynthesis;

  // Stop recognition safely
  if (recognitionRef.current && isRecognizingRef.current) {
    try {
      recognitionRef.current.stop();
    } catch (e) {}
  }

  synth.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";

  utterance.onstart = () => {
    isSpeakingRef.current = true;
  };

  utterance.onend = () => {
    isSpeakingRef.current = false;

    if (redirectUrl) {
      window.location.href = redirectUrl;
    } else {
      // ✅ Force restart listening
      setTimeout(() => {
        if (!isRecognizingRef.current) {
          startRecognition();
        }
      }, 500);
    }
  };

  utterance.onerror = () => {
    isSpeakingRef.current = false;
  };

  synth.speak(utterance);
};


  // ================= HANDLE COMMAND =================
  const handleCommand = (data) => {
    const { type, userInput, response } = data;

    const query = encodeURIComponent(userInput);

    const routes = {
      "google-search": `https://www.google.com/search?q=${query}`,
      "youtube-search": `https://www.youtube.com/results?search_query=${query}`,
      "youtube-play": `https://www.youtube.com/results?search_query=${query}`,
      "instagram-open": `https://www.instagram.com/`,
      "facebook-open": `https://www.facebook.com/`,
      "linkedin-search": `https://www.linkedin.com/search/results/all/?keywords=${query}`,
      "calculator-open": `https://www.online-calculator.com/`,
      "get-news": `https://news.google.com/`,
      "weather-show": `https://www.google.com/search?q=weather+${query}`,
    };

    const url = routes[type] || null;

    // ✅ Speak first, redirect after speech ends
    speak(response, url);
  };

  // ================= VOICE =================
  const startRecognition = () => {
    if (
      !recognitionRef.current ||
      isRecognizingRef.current ||
      isSpeakingRef.current
    )
      return;

    try {
      recognitionRef.current.start();
    } catch (e) {
      console.error("Recognition start error:", e);
    }
  };

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech Recognition not supported in this browser");
      return;
    }

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

      // STEP 1: Wake word detection
      if (!isActivatedRef.current && transcript.includes(assistantTrigger)) {
        isActivatedRef.current = true;
        speak("Yes");
        return;
      }

      // STEP 2: After wake word → treat next speech as command
      if (isActivatedRef.current && !processingRef.current) {
        processingRef.current = true;
        isActivatedRef.current = false;

        if (limitReached) {
          const limitMsg = `⚠️ Your free limit is over. Try next ${timeLeft} later.`;

          console.log(timeLeft);

          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              text: limitMsg,
              time: new Date().toISOString(),
            },
          ]);
          speak(limitMsg);
          processingRef.current = false;
          return;
        }

        const now = new Date().toISOString();

        setLoadingAI(true);

        try {
          const data = await getGeminiResponse(transcript);

          if (data) {
            setUserData((prev) => ({
              ...prev,
              replyCount: (prev.replyCount || 0) + 1,
              lastReset: data.lastReset ?? prev.lastReset,
              messages: [
                ...(prev.messages || []),
                { role: "user", text: transcript, time: now },
                { role: "assistant", text: data.response, time: now },
              ],
            }));

            setMessages((prev) => [
              ...prev,
              { role: "user", text: transcript, time: now },
              { role: "assistant", text: data.response, time: now },
            ]);

            handleCommand(data);
          }
        } catch (err) {
          console.error("Gemini Error:", err);
          toast.error("Something went wrong");
        } finally {
          setLoadingAI(false);
          processingRef.current = false;
        }
      }
    };

    startRecognition();
    return () => {
      recognition.stop();
      window.speechSynthesis.cancel();
    };
  }, [userData?.assistantName]);

  // ================= AUTO SCROLL =================
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingText, loadingAI]);

  const formatDateLabel = (dateString) => {
    if (!dateString) return "";

    const messageDate = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();

    yesterday.setDate(today.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return "Today";
    }

    if (messageDate.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }

    return messageDate.toLocaleDateString([], {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div
      className={`w-full min-h-screen bg-gradient-to-t from-black to-[#090993]
      flex flex-col items-center  relative transition-all duration-700
      ${messages.length === 0 ? "justify-center" : "justify-start py-6"}`}
    >
      {/* STICKY HEADER (BOX + BUTTONS) */}
      <div className="w-full sticky top-0  bg-gradient-to-b ">
        <div className="max-w-9xl mx-auto flex items-start justify-between px-6 py-6">
          {/* LEFT SIDE - TIME BOX */}
          <div
            className={`w-full max-w-[500px] rounded-2xl p-6 shadow-xl backdrop-blur-md border transition-all duration-500 ${
              limitReached
                ? "bg-gradient-to-r from-red-500/10 to-red-600/10 border-red-500/40"
                : "bg-gradient-to-r from-blue-500/10 to-blue-600/10 border-blue-500/40"
            }`}
          >
            <div
              className={`text-center font-semibold text-sm mb-4 ${
                limitReached ? "text-red-400" : "text-blue-400"
              }`}
            >
              {limitReached
                ? "⚠ Daily Free Limit Reached"
                : "🚀 Enjoy your Assistant!"}
            </div>

            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-gray-400 text-[11px]">Current</p>
                <p className="text-white font-medium">{currentTime}</p>
              </div>

              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-gray-400 text-[11px]">Restores</p>
                <p className="text-blue-300 font-medium">{getRestoreTime()}</p>
              </div>

              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-gray-400 text-[11px]">Remaining</p>
                <p
                  className={`font-bold ${
                    limitReached
                      ? "text-red-400 animate-pulse"
                      : "text-green-400"
                  }`}
                >
                  {limitReached
                    ? timeLeft
                    : `${MAX_REPLIES - animatedCount} left`}
                </p>
              </div>
            </div>
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
          </div>

          {/* RIGHT SIDE - BUTTONS */}
          <div className="flex gap-3 mt-5 p-6">
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
                } catch {
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
        </div>
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
        Welcome I'M{" "}
        <span className="text-blue-300">
          {userData?.assistantName || "Your Assistant"}
        </span>
      </h1>

      <p className="text-gray-300 text-xs sm:text-sm mt-6">
        {listening ? "🎤 Listening..." : "💤 Waiting for wake word..."}
      </p>

      {/* Chat */}
      <div className="w-full max-w-2xl mt-6 bg-white/10 backdrop-blur-xl rounded-3xl p-4 sm:p-6 shadow-2xl border border-white/20 flex flex-col gap-4 overflow-y-auto max-h-[350px] sm:max-h-[450px] auto-scroll">
        {messages.map((msg, index) => {
          const showDate =
            index === 0 ||
            new Date(messages[index - 1].time).toDateString() !==
              new Date(msg.time).toDateString();

          return (
            // 🔥 IMPORTANT RETURN HERE
            <React.Fragment key={index}>
              {showDate && (
                <div className="text-center text-xs text-gray-400 my-2">
                  {formatDateLabel(msg.time)}
                </div>
              )}

              <div
                className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${
                  msg.role === "user"
                    ? "self-end items-end"
                    : "self-start items-start"
                }`}
              >
                <div
                  className={`px-4 py-3 rounded-2xl shadow-md ${
                    msg.role === "user"
                      ? "bg-white text-black"
                      : "bg-blue-600 text-white"
                  }`}
                >
                  {msg.text}
                </div>

                {msg.time && (
                  <span className="text-[10px] text-gray-400 mt-1 px-2">
                    {formatMessageTime(msg.time)}
                  </span>
                )}
              </div>
            </React.Fragment>
          );
        })}
        {loadingAI && (
          <div className="flex flex-col max-w-[75%] self-start">
            <div className="px-4 py-3 rounded-2xl shadow-md bg-blue-600 text-white animate-pulse">
              🔎 Searching...
            </div>
          </div>
        )}
      </div>
      <div ref={chatEndRef} />
    </div>
  );
}

export default Home;
