import {
  FaLaptop,
  FaTshirt,
  FaMobileAlt,
  FaHeart,
  FaTimes,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import "./SideCategory.css";

function SideCategory({ visible, close }) {
  const navigate = useNavigate();

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (visible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [visible]);

  const handleNavigate = (category) => {
    navigate(`/products?category=${category}`);
    close(); // close drawer after navigation
  };

  return (
    <div className={`side-overlay ${visible ? "show" : ""}`} onClick={close}>
      <div
        className={`side-drawer ${visible ? "open" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="side-header">
          <h3>Shop by Category</h3>
          <FaTimes className="close-icon" onClick={close} />
        </div>

        {/* Categories */}
        <ul className="category-list">
          <li onClick={() => handleNavigate("electronics")}>
            <FaLaptop /> Electronics
          </li>

          <li onClick={() => handleNavigate("fashion")}>
            <FaTshirt /> Fashion
          </li>

          <li onClick={() => handleNavigate("mobiles")}>
            <FaMobileAlt /> Mobiles
          </li>

          <li onClick={() => handleNavigate("beauty")}>
            <FaHeart /> Beauty
          </li>
        </ul>
      </div>
    </div>
  );
}

export default SideCategory;
