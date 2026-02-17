import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import backgroundImage from "../assets/authBg.png";
import { IoEye, IoEyeOff } from "react-icons/io5";
import { UserDataContext } from "../context/UserContext";
import axios from "axios";
import { toast } from "react-toastify";

function Signin() {
  const navigate = useNavigate();
  const { serverURL, setUserData } = useContext(UserDataContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const toastId = toast.loading("Signing in...");

    try {
      const result = await axios.post(
        `${serverURL}/api/auth/signin`,
        { email, password },
        { withCredentials: true }
      );

      setUserData(result.data);

      toast.update(toastId, {
        render: "Welcome back! Login successful 🎉",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

      navigate("/");
    } catch (err) {
      const message = err.response?.data?.message || "Signin failed";

      toast.update(toastId, {
        render: message,
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });

      setUserData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="w-full h-screen bg-cover bg-center flex items-center justify-center"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <form
        onSubmit={handleSignin}
        className="w-[92%] max-w-[520px] bg-black/20 backdrop-blur-md border border-white/20 rounded-2xl px-6 py-10 flex flex-col gap-6 items-center shadow-[0_30px_80px_rgba(0,0,0,0.85)] transition-all duration-500 hover:bg-blue-400/10 hover:border-blue-400/40 hover:-translate-y-4 hover:shadow-[0_45px_120px_rgba(37,99,235,0.45)]"
      >
        <h1 className="text-white text-3xl font-semibold">
          Welcome back to <span className="text-blue-400">Assist Gpt</span>
        </h1>

        <input
          type="email"
          placeholder="Enter your Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full h-[58px] bg-transparent text-white border border-white/30 rounded-full px-5 outline-none"
          required
        />

        <div className="relative w-full">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter your Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-[58px] bg-transparent text-white border border-white/30 rounded-full px-5 outline-none"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-5 top-1/2 -translate-y-1/2 text-white/70"
          >
            {showPassword ? <IoEyeOff /> : <IoEye />}
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-[50%] h-[50px] bg-blue-600 text-white rounded-full disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <p
          className="text-white/70 text-sm cursor-pointer"
          onClick={() => navigate("/signup")}
        >
          Don’t have an account? <span className="text-blue-400">Register</span>
        </p>
      </form>
    </div>
  );
}

export default Signin;
