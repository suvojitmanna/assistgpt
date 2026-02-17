import axios from "axios";
import { createContext, useEffect, useState } from "react";

export const UserDataContext = createContext();

const UserContext = ({ children }) => {
  const serverURL = import.meta.env.VITE_SERVER_URL;

  const [userData, setUserData] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Assistant image states
  const [frontendImage, setFrontendImage] = useState(null);
  const [backendImage, setBackendImage] = useState(null); 
  const [selectedImage, setSelectedImage] = useState(null);

  const handleCurrentUser = async () => {
    try {
      const result = await axios.get(`${serverURL}/api/user/current`, {
        withCredentials: true,
      });

      // Backend now returns user directly
      setUserData(result.data);
    } catch (error) {
      setUserData(null);
    } finally {
      setAuthLoading(false);
    }
  };

  const getGeminiResponse = async (command) => {
    try {
      const result = await axios.post(
        `${serverURL}/api/user/asktoassistant`,
        { command },
        {
          withCredentials: true,
        },
      );
      return result.data;
    } catch (error) {
      console.error("Error fetching Gemini response:", error);
      throw error;
    }
  };

  useEffect(() => {
    handleCurrentUser(); 
  }, []);

  return (
    <UserDataContext.Provider
      value={{
        serverURL,
        userData,
        setUserData,
        handleCurrentUser,
        authLoading,
        backendImage,
        setBackendImage,
        frontendImage,
        setFrontendImage,
        selectedImage,
        setSelectedImage,
        getGeminiResponse,
      }}
    >
      {children}
    </UserDataContext.Provider>
  );
};

export default UserContext;
