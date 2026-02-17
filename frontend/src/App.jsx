import { useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { UserDataContext } from "./context/userContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Home from "./pages/home";
import Signin from "./pages/signin";
import Signup from "./pages/signup";
import Customize from "./pages/customize";
import Customize2 from "./pages/customize2";

const App = () => {
  const { userData, authLoading } = useContext(UserDataContext);

  if (authLoading) return null;

  return (
    <>
      {/* Toast Container */}
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />

      <Routes>
        <Route
          path="/"
          element={
            userData ? (
              userData.assistantImage && userData.assistantName ? (
                <Home />
              ) : (
                <Navigate to="/customize" />
              )
            ) : (
              <Navigate to="/signin" />
            )
          }
        />
        <Route
          path="/signup"
          element={!userData ? <Signup /> : <Navigate to="/" />}
        />
        <Route
          path="/signin"
          element={!userData ? <Signin /> : <Navigate to="/" />}
        />
        <Route
          path="/customize"
          element={userData ? <Customize /> : <Navigate to="/signup" />}
        />
        <Route
          path="/customize2"
          element={userData ? <Customize2 /> : <Navigate to="/signup" />}
        />
      </Routes>
    </>
  );
};

export default App;
