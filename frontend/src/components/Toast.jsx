import { useEffect } from "react";

function Toast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return <div style={toastStyle}>{message}</div>;
}

const toastStyle = {
  position: "fixed",
  top: "20px",
  right: "20px",
  background: "#111",
  color: "#fff",
  padding: "14px 22px",
  borderRadius: "8px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
  fontSize: "14px",
  zIndex: 9999,
  animation: "fadeIn 0.3s ease",
};

export default Toast;
