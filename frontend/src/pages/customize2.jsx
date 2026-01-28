import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserDataContext } from "../context/UserContext";
import axios from "axios";
import { IoMdArrowRoundBack } from "react-icons/io";
import { toast } from "react-toastify";

const Customize2 = () => {
  const { userData, backendImage, selectedImage, serverURL, setUserData } =
    useContext(UserDataContext);

  const [assistantName, setAssistantName] = useState(
    userData?.assistantName || ""
  );
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleUpdateAssistant = async () => {
    if (!assistantName.trim()) {
      toast.info("Please enter an assistant name");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("assistantName", assistantName);

      if (backendImage) {
        formData.append("assistantImage", backendImage);
      } else if (selectedImage) {
        formData.append("imageUrl", selectedImage);
      }

      const result = await axios.post(
        `${serverURL}/api/user/update`,
        formData,
        { withCredentials: true }
      );

      setUserData(result.data);

      toast.success("Assistant created successfully! 🎉", {
        autoClose: 1500,
      });

      navigate("/"); // go to home
    } catch (error) {
      toast.error("Failed to update assistant. Please try again.");
      console.error("Error updating assistant:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-[100vh] bg-gradient-to-t from-[#090909] to-[#090993] flex justify-center items-center flex-col py-6 px-3 sm:px-5 md:px-6 relative">
      <IoMdArrowRoundBack
        className="absolute top-[20px] left-[20px] text-white w-[22px] h-[22px] hover:opacity-70 transition-opacity cursor-pointer"
        onClick={() => navigate("/customize")}
      />

      <h1 className="text-white text-center text-[20px] sm:text-[26px] md:text-[28px] lg:text-[30px] p-4 mb-6">
        Enter Your <span className="text-blue-300">Assistant Name</span>
      </h1>

      <input
        type="text"
        placeholder="e.g: Assistant GPT"
        className="w-full max-w-[500px] h-[45px] bg-transparent text-white border border-white/30 rounded-full px-5 text-[15px] outline-none"
        value={assistantName}
        onChange={(e) => setAssistantName(e.target.value)}
      />

      {assistantName && (
        <button
          className="mt-6 px-8 py-3 bg-white text-black rounded-full text-sm sm:text-base font-semibold hover:bg-gray-200 transition-all duration-300 disabled:opacity-60 cursor-pointer"
          disabled={loading}
          onClick={handleUpdateAssistant}
        >
          {loading ? "Creating..." : "Finally create your Assistant"}
        </button>
      )}
    </div>
  );
};

export default Customize2;
