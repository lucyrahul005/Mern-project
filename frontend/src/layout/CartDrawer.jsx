import { useEffect } from "react";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import { FaTrash } from "react-icons/fa";
import "./CartDrawer.css";

function CartDrawer({ visible, close }) {
  const { cart, removeFromCart, getTotal } = useCart();
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

  const subtotal = getTotal();
  const tax = subtotal * 0.18;
  const total = subtotal + tax;

  return (
    <div className={`cart-overlay ${visible ? "show" : ""}`} onClick={close}>
      <div
        className={`cart-drawer ${visible ? "open" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="cart-header">
          <h3>Your Cart</h3>
          <span className="close-btn" onClick={close}>
            ✕
          </span>
        </div>

        {/* Empty */}
        {cart.length === 0 && (
          <p className="empty-text">No items in cart yet.</p>
        )}

        {/* Items */}
        {cart.map((item) => (
          <div key={item._id} className="cart-item">
            <div>
              <h4>{item.name}</h4>
              <p>
                ₹{item.price} × {item.quantity}
              </p>
            </div>

            <FaTrash
              className="delete-icon"
              onClick={() => removeFromCart(item._id)}
            />
          </div>
        ))}

        {/* Totals */}
        {cart.length > 0 && (
          <div className="cart-footer">
            <p>Subtotal: ₹{subtotal.toFixed(2)}</p>
            <p>Tax (18%): ₹{tax.toFixed(2)}</p>
            <h4>Total: ₹{total.toFixed(2)}</h4>

            <button
              className="checkout-btn"
              onClick={() => {
                close();
                navigate("/checkout");
              }}
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CartDrawer;
