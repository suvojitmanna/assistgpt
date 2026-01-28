import React, { useContext, useEffect, useRef, useState } from "react";
import { UserDataContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import ai from "../assets/ai.gif";
import user from "../assets/user.gif";

function Home() {
  const { userData, serverURL, setUserData, getGeminiResponse } =
  useContext(UserDataContext);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [listening, setListening] = useState(false);
  const [userText,setUserText] = useState("");
  const [aiText,setAiText] = useState("");  
  const isSpeackingRef = useRef(false);
  const recognitionRef = useRef(null);
  const isRecognizingRef = useRef(false);

  const synth = window.speechSynthesis;

  const handleLogout = async () => {
    try {
      setLoading(true);

      await axios.get(`${serverURL}/api/auth/signout`, {
        withCredentials: true,
      });

      toast.success("Logged out successfully 👋");
    } catch (error) {
      console.log(
        "Logout request error:",
        error.response?.data || error.message,
      );
      toast.error("Session ended. Logging out...");
    } finally {
      setUserData(null);
      setLoading(false);
      navigate("/signin");
    }
  };

  const startRecognition = () => {
    try {
      recognitionRef.current.start();
      setListening(true);
    } catch (error) {
        if(!(error.message .includes("started"))) {
            console.error("Recognition start error:", error);
        }
    }
};

  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ben-IN";
    const voices = window.speechSynthesis.getVoices();
    const bengaliVoice = voices.find(v => v.lang === "bn-IN");
    if (bengaliVoice) {
      utterance.voice = bengaliVoice;
    }
    isSpeackingRef.current = true;
    utterance.onend = () => {
      setAiText("");
      isSpeackingRef.current = false;
      startRecognition();
    };
    synth.speak(utterance);
  };

  const handleCommand = (data) => {
    const { type, userInput, response } = data;
    speak(response);
    if (type === "google-search") {
      const query = encodeURIComponent(userInput);
      window.open(`https://www.google.com/search?q=${query}`, "_blank");
    } else if (type === "youtube-search" || type === "youtube-play") {
      const query = encodeURIComponent(userInput);
      window.open(
        `https://www.youtube.com/results?search_query=${query}`,
        "_blank",
      );
    } else if (type === "instagram-open") {
      window.open(`https://www.instagram.com/`, "_blank");
    } else if (type === "facebook-open") {
      window.open(`https://www.facebook.com/`, "_blank");
    } else if (type === "calculator-open") {
      window.open(`https://www.online-calculator.com/`, "_blank");
    } else if (type === "get-news") {
      window.open(`https://news.google.com/`, "_blank");
    } else if (type === "weather-show") {
      const query = encodeURIComponent(userInput);
      window.open(`https://www.weather.com/weather/today/l/${query}`, "_blank");
    }
  };

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.log("Speech Recognition not supported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = "en-US";

    recognitionRef.current = recognition;

    const safeRecognition = () => {
      if (!isSpeackingRef.current && !isRecognizingRef.current) {
        try {
          recognition.start();
          console.log("Recognition started");
        } catch (error) {
          if (error.message !== "recognition has already started") {
            console.error("Recognition start error:", error);
          }
        }
      }
    };

    recognition.onstart = () => {
      console.log("Voice recognition activated");
      isRecognizingRef.current = true;
      setListening(true);
    };

    recognition.onend = () => {
      console.log("Voice recognition deactivated");
      isRecognizingRef.current = false;
      setListening(false);

      if (!isSpeackingRef.current) {
        setTimeout(() => {
          safeRecognition();
        }, 1000);
      }
    };

    recognition.onerror = (event) => {
  // 🟢 This happens when user doesn't speak — totally normal
  if (event.error === "no-speech") {
    console.log("No speech detected, restarting...");
    isRecognizingRef.current = false;
    setListening(false);

    if (!isSpeackingRef.current) {
      setTimeout(() => {
        safeRecognition();
      }, 500);
    }
    return;
  }

  // 🔴 Real errors
  console.error("Recognition error:", event.error);
  isRecognizingRef.current = false;
  setListening(false);

  if (event.error !== "not-allowed" && !isSpeackingRef.current) {
    setTimeout(() => {
      safeRecognition();
    }, 1000);
  }
};

    recognition.onresult = async (event) => {
      const current = event.resultIndex;
      const transcript = event.results[current][0].transcript;
      console.log("Voice Input:", transcript);

      if (
        transcript.toLowerCase().includes(userData.assistantName.toLowerCase())
      ) {
        setAiText("");
        setUserText(transcript);
        recognition.stop();
        isRecognizingRef.current = false;
        setListening(false);
        const data = await getGeminiResponse(transcript);
        console.log("data from gemini:", data);
        handleCommand(data);
        setAiText(data.response);
      }
    }

    const fallback = setInterval(() => {
        if (!isRecognizingRef.current && !isSpeackingRef.current) {
            safeRecognition();
        }
    }, 10000);
    safeRecognition();

    return () => {
      recognition.stop();
      setListening(false);
      isRecognizingRef.current = false;
      clearInterval(fallback);
    }

  }, []);

  return (
    <div className="w-full min-h-[100vh] bg-gradient-to-t from-[#090909] to-[#090993] flex justify-center items-center flex-col py-6 px-3">
      <div className="absolute top-[20px] right-[20px] flex gap-3">
        <button
          className="w-[100px] h-[40px] bg-white text-black rounded-full text-sm font-semibold hover:bg-gray-200 transition cursor-pointer disabled:opacity-60"
          onClick={handleLogout}
          disabled={loading}
        >
          {loading ? "Logging out..." : "Logout"}
        </button>

        <button
          className="px-4 h-[40px] bg-white text-black rounded-full text-sm font-semibold hover:bg-gray-200 transition cursor-pointer"
          onClick={() => navigate("/customize")}
        >
          Customize
        </button>
      </div>

      <div className="w-[300px] h-[400px] flex justify-center items-center overflow-hidden rounded-4xl shadow-4xl">
        <img
          src={userData?.assistantImage || "/default-avatar.png"}
          alt="Assistant"
          className="h-full w-full object-cover"
        />
      </div>

      <h1 className="text-white text-center text-[22px] sm:text-[26px] md:text-[28px] lg:text-[30px] p-4 mb-6">
        Welcome
        I'M{" "}
        <span className="text-blue-300">
          {userData?.assistantName || "Your Assistant"}
        </span>
      </h1>
      {!aiText && <img src={user} className="w-[200px]" />}
      {aiText && <img src={ai} className="w-[200px]" />}
    <h1 className="text-white text-center text-[18px] sm:text-[20px] md:text-[22px] lg:text-[24px] p-4 mb-6">{userText? userText : aiText? aiText : null} </h1>
      <p className="text-gray-300 text-sm">
        {!aiText ? "🎤 Listening..." : "💤 Waiting for wake word..."}
      </p>
    </div>
  );
}

export default Home;
