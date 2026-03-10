import {
  FaPizzaSlice,
  FaHamburger,
  FaIceCream,
  FaDrumstickBite,
  FaCoffee,
} from "react-icons/fa";
import "./CategoryStrip.css";
import { useNavigate } from "react-router-dom"; // ✅ ADD THIS

const categories = [
  { name: "Pizza", value: "pizza", icon: <FaPizzaSlice /> },
  { name: "Burgers", value: "burger", icon: <FaHamburger /> },
  { name: "Desserts", value: "dessert", icon: <FaIceCream /> },
  { name: "Chicken", value: "chicken", icon: <FaDrumstickBite /> },
  { name: "Drinks", value: "drinks", icon: <FaCoffee /> },
];

function CategoryStrip() {
  const navigate = useNavigate(); // ✅ INIT

  const handleClick = (category) => {
    navigate(`/products?category=${category}`); // ✅ NAVIGATE
  };

  return (
    <div className="category-strip">
      {categories.map((cat, index) => (
        <div
          key={index}
          className="category-card"
          onClick={() => handleClick(cat.value)} // ✅ CLICK FIX
        >
          <div className="category-icon">{cat.icon}</div>
          <p>{cat.name}</p>
        </div>
      ))}
    </div>
  );
}

export default CategoryStrip;