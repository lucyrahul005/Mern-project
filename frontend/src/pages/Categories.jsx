import { useNavigate } from "react-router-dom";

function SideCategory({ visible, close }) {
  const navigate = useNavigate();

  const handleCategoryClick = (category) => {
    navigate(`/products?category=${category}`);
    close();
  };

  return (
    <div
      style={{
        ...styles.overlay,
        left: visible ? "0" : "-100%",
      }}
    >
      <div style={styles.header}>
        <h3>🍔 Food Categories</h3>
        <span style={styles.close} onClick={close}>
          ×
        </span>
      </div>

      <div style={styles.item} onClick={() => handleCategoryClick("pizza")}>
        🍕 Pizza
      </div>

      <div style={styles.item} onClick={() => handleCategoryClick("burger")}>
        🍔 Burger
      </div>

      <div style={styles.item} onClick={() => handleCategoryClick("chicken")}>
        🍗 Chicken
      </div>

      <div style={styles.item} onClick={() => handleCategoryClick("dessert")}>
        🍰 Dessert
      </div>

      <div style={styles.item} onClick={() => handleCategoryClick("drinks")}>
        🥤 Drinks
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: "-100%",
    width: "280px",
    height: "100%",
    background: "rgba(0,0,0,0.9)",
    color: "#fff",
    padding: "20px",
    transition: "0.3s ease",
    zIndex: 1000,
    backdropFilter: "blur(10px)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
  },
  close: {
    cursor: "pointer",
    fontSize: "22px",
  },
  item: {
    padding: "15px 10px",
    cursor: "pointer",
    borderRadius: "8px",
    transition: "0.3s",
  },
};

export default SideCategory;