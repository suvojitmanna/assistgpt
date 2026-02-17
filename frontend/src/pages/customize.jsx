import { useRef, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/card";
import image1 from "../assets/image1.png";
import image2 from "../assets/image2.jpg";
import image4 from "../assets/image4.png";
import image5 from "../assets/image5.png";
import image6 from "../assets/image6.jpeg";
import image7 from "../assets/image7.jpeg";
import image8 from "../assets/authBg.png";
import { MdOutlineFileUpload } from "react-icons/md";
import { RiImageAddLine } from "react-icons/ri";
import { UserDataContext } from "../context/userContext";
import { IoMdArrowRoundBack } from "react-icons/io";
import { toast } from "react-toastify";

function Customize() {
  const navigate = useNavigate();

  const {
    backendImage,
    setBackendImage,
    frontendImage,
    setFrontendImage,
    selectedImage,
    setSelectedImage,
  } = useContext(UserDataContext);

  const inputImage = useRef(null);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (frontendImage) URL.revokeObjectURL(frontendImage);

      setBackendImage(file);
      setFrontendImage(URL.createObjectURL(file));
      setSelectedImage("input");

      toast.success("Image uploaded successfully ✨", { autoClose: 1500 });

      event.target.value = "";
    }
  };

  useEffect(() => {
    return () => {
      if (frontendImage) URL.revokeObjectURL(frontendImage);
    };
  }, [frontendImage]);

  const handleNext = () => {
    if (!selectedImage) {
      toast.info("Please select or upload an image first");
      return;
    }
    navigate("/customize2");
  };

  return (
    <div className="w-full min-h-[100vh] bg-gradient-to-t from-[#090909] to-[#090993] flex justify-center items-center flex-col py-6 px-3 xs:px-4 sm:py-8 sm:px-5 md:px-6">
      <IoMdArrowRoundBack
        className="absolute top-[20px] left-[20px] text-white w-[22px] h-[22px] hover:opacity-70 transition-opacity cursor-pointer"
        onClick={() => navigate("/")}
      />

      <h1 className="text-white text-center text-[20px] sm:text-[26px] md:text-[28px] lg:text-[30px] p-4 mb-6">
        Select Your <span className="text-blue-300"> Assistant Image </span>
      </h1>

      <div className="w-full max-w-[90%] lg:max-w-[60%] flex justify-center items-center flex-wrap gap-3">
        <Card image={image1} />
        <Card image={image2} />
        <Card image={image4} />
        <Card image={image5} />
        <Card image={image6} />
        <Card image={image7} />
        <Card image={image8} />

        {/* Upload Card */}
        <div
          className={`relative w-[100px] sm:w-[120px] md:w-[140px] lg:w-[150px] h-[170px] sm:h-[200px] md:h-[230px] lg:h-[250px] bg-[#030326] border-2 rounded-2xl overflow-hidden cursor-pointer flex items-center justify-center transition-all duration-300
          ${
            selectedImage === "input"
              ? "border-4 border-[#1fd7d7] shadow-2xl shadow-blue-950"
              : "border-[#0000ff72] hover:border-[#c0dbdb] hover:shadow-2xl hover:shadow-blue-950"
          }`}
          onClick={() => inputImage.current.click()}
        >
          {!frontendImage && (
            <RiImageAddLine className="text-white w-[28px] h-[28px]" />
          )}

          {frontendImage && (
            <img
              src={frontendImage}
              alt="Uploaded"
              className="w-full h-full object-cover"
            />
          )}

          <MdOutlineFileUpload className="absolute bottom-2 right-2 text-white w-[18px] h-[18px] opacity-80" />
        </div>

        <input
          type="file"
          accept="image/*"
          ref={inputImage}
          hidden
          onChange={handleImageUpload}
        />
      </div>

      <button
        onClick={handleNext}
        className="mt-8 w-[110px] h-[45px] bg-white text-black rounded-full font-semibold hover:bg-gray-200 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
      >
        Next
      </button>
    </div>
  );
}

export default Customize;
