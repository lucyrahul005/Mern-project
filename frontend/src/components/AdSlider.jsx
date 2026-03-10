import { useEffect, useState } from "react";
import "./AdSlider.css";
import { useNavigate } from "react-router-dom";

const slides = [
  {
    title: "Delicious Food Delivered Fast 🍔",
    subtitle: "Hot & fresh meals at your doorstep",
    image:
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38",
  },
  {
    title: "Craving Something Tasty? 🍕",
    subtitle: "Order your favorites now",
    image:
      "https://plus.unsplash.com/premium_photo-1683657860906-d49d1bb37aab?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8a2ZjfGVufDB8fDB8fHww",
  },
  {
    title: "Sweet Treats & Desserts 🍩",
    subtitle: "Indulge your cravings",
    image:
      "https://images.unsplash.com/photo-1551024601-bec78aea704b",
  },
];

function AdSlider() {
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="slider">
      <div
        className="slider-bg"
        style={{ backgroundImage: `url(${slides[index].image})` }}
      />

      <div className="slider-overlay" />

      <div className="slider-content">
        <h1>{slides[index].title}</h1>
        <p className="subtitle">{slides[index].subtitle}</p>
        <button onClick={() => navigate("/products")}>
          Order Now 🍔
        </button>
      </div>

      <div className="dots">
        {slides.map((_, i) => (
          <span
            key={i}
            className={i === index ? "dot active" : "dot"}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </div>
  );
}

export default AdSlider;