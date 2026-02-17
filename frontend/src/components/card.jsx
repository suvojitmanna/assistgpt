import { useContext } from "react";
import { UserDataContext } from "../context/userContext";
import { toast } from "react-toastify";

const Card = ({ image }) => {
  const { setBackendImage, setFrontendImage, selectedImage, setSelectedImage } =
    useContext(UserDataContext);

  const handleSelect = () => {
    setSelectedImage(image);
    setBackendImage(null);
    setFrontendImage(null);

    toast.success("Avatar selected ✨", {
      autoClose: 1500,
    });
  };

  return (
    <div
      className={`w-[90px] xs:w-[100px] sm:w-[110px] md:w-[130px] lg:w-[150px] h-[150px] xs:h-[170px] sm:h-[190px] md:h-[220px] lg:h-[250px] bg-[#030326] border-2 border-[#0000ff72] rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-blue-950 cursor-pointer hover:border-4 hover:border-[#c0dbdb] transition-all duration-300 ${
        selectedImage === image
          ? "border-4 border-[#1fd7d7] shadow-2xl shadow-blue-950"
          : ""
      }`}
      onClick={handleSelect}
    >
      <img src={image} alt="avatar" className="h-full w-full object-cover" />
    </div>
  );
};

export default Card;
