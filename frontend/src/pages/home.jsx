import React, { useContext, useEffect, useRef, useState } from "react";
import { UserDataContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

function Home() {
  const { userData, serverURL, setUserData, getGeminiResponse } =
    useContext(UserDataContext);

  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [typingText, setTypingText] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
  const [listening, setListening] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(false);

  const recognitionRef = useRef(null);
  const isRecognizingRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const chatEndRef = useRef(null);

  const MAX_REPLIES = 10;
  const replyCount = userData?.replyCount || 0;
  const limitReached = replyCount >= MAX_REPLIES;

  // ================= UNLOCK SPEECH =================
  const unlockSpeech = () => {
    const synth = window.speechSynthesis;

    synth.resume();

    const test = new SpeechSynthesisUtterance("Voice ready");
    test.volume = 1; // MUST NOT be 0
    synth.speak(test);

    setSpeechEnabled(true);
  };

  // ================= SAFE SPEAK FUNCTION =================
  const speak = (text) => {
    if (!text || !speechEnabled) return;

    const synth = window.speechSynthesis;

    if (synth.speaking) synth.cancel();
    synth.resume();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onstart = () => {
      isSpeakingRef.current = true;
    };

    utterance.onend = () => {
      isSpeakingRef.current = false;
      setTimeout(() => startRecognition(), 600);
    };

    utterance.onerror = () => {
      isSpeakingRef.current = false;
    };

    const speakWhenReady = () => {
      const voices = synth.getVoices();

      if (!voices.length) {
        setTimeout(speakWhenReady, 300);
        return;
      }

      utterance.voice =
        voices.find(v => v.lang.includes("en")) || voices[0];

      synth.speak(utterance);
    };

    speakWhenReady();
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

    recognition.onerror = () => {
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
          const msg = "Your daily limit is over.";
          setMessages(prev => [...prev, { role: "assistant", text: msg }]);
          speak(msg);
          return;
        }

        setMessages(prev => [...prev, { role: "user", text: transcript }]);
        setLoadingAI(true);

        const data = await getGeminiResponse(transcript);
        setLoadingAI(false);

        if (data?.response) {
          let i = 0;
          setTypingText("");

          const interval = setInterval(() => {
            if (i < data.response.length) {
              setTypingText(prev => prev + data.response[i]);
              i++;
            } else {
              clearInterval(interval);
              setMessages(prev => [
                ...prev,
                { role: "assistant", text: data.response }
              ]);
              setTypingText("");
              speak(data.response);
            }
          }, 20);
        }
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
      onClick={unlockSpeech}
      className={`w-full min-h-screen bg-gradient-to-t from-black to-[#090993]
      flex flex-col items-center px-4 relative transition-all duration-700
      ${messages.length === 0 ? "justify-center" : "justify-start py-6"}`}
    >
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
          ? "👆 Tap anywhere once to enable voice"
          : listening
          ? "🎤 Listening..."
          : "💤 Waiting..."}
      </p>
    </div>
  );
}

export default Home;
