import { useMemo, useState } from "react";
import "./UserResponsiveDashboard.css";

const QUICK_STATS = [
  { label: "Active Orders", value: "3" },
  { label: "Saved Places", value: "8" },
  { label: "Offers Applied", value: "5" },
  { label: "Wallet Balance", value: "₹620" },
];

const RECENT_ORDERS = [
  { id: "FD-3241", item: "Butter Chicken Bowl", status: "On the way", eta: "18 min" },
  { id: "FD-3242", item: "Veggie Fiesta Pizza", status: "Delivered", eta: "Done" },
  { id: "FD-3243", item: "Paneer Tikka Wrap", status: "Preparing", eta: "26 min" },
];

const FAVORITES = [
  { name: "Spice Hub", tag: "4.7 ★", eta: "30-35 min" },
  { name: "Urban Tadka", tag: "4.6 ★", eta: "25-30 min" },
  { name: "Saffron Lane", tag: "4.5 ★", eta: "28-34 min" },
];

const PRODUCTS = [
  { name: "Lava Cake", price: "₹180", badge: "Dessert" },
  { name: "Chicken Biryani", price: "₹420", badge: "Popular" },
  { name: "Veggie Burger", price: "₹210", badge: "New" },
  { name: "Caesar Salad", price: "₹190", badge: "Light" },
];

const NAV_ITEMS = ["Home", "Explore", "Orders", "Favorites", "Wallet", "Support"];

function ResponsiveTable({ rows, columns }) {
  return (
    <div className="panel">
      <div className="panel-header">
        <h3>Recent Orders</h3>
        <button className="btn ghost">View all</button>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                {columns.map((column) => (
                  <td key={column.key} data-label={column.label}>
                    {row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function UserResponsiveDashboard() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const orderColumns = useMemo(
    () => [
      { key: "id", label: "Order ID" },
      { key: "item", label: "Item" },
      { key: "status", label: "Status" },
      { key: "eta", label: "ETA" },
    ],
    []
  );

  return (
    <div className={`user-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="brand">
          <span className="brand-mark">🍜</span>
          <div>
            <p className="brand-title">WebnApp</p>
            <span className="brand-sub">Food Delivery</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <button key={item} className="nav-item">
              <span className="nav-dot" />
              <span className="nav-label">{item}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="btn accent">Order Now</button>
          <button className="btn ghost">Help Center</button>
        </div>
      </aside>

      <div className="page">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-btn" onClick={() => setMenuOpen((prev) => !prev)} aria-label="Menu">
              ☰
            </button>
            <button className="icon-btn desktop-only" onClick={() => setCollapsed((prev) => !prev)} aria-label="Collapse">
              ⇔
            </button>
            <div>
              <h1>Good evening, Rahul</h1>
              <p>Track your food, favorites, and rewards.</p>
            </div>
          </div>
          <div className="topbar-actions">
            <div className="search">
              <input type="search" placeholder="Search dishes or restaurants" />
            </div>
            <button className="icon-btn">🔔</button>
            <div className="profile-chip">
              <span className="avatar">RK</span>
              <div>
                <p className="profile-name">Rahul K.</p>
                <span className="profile-role">Premium Member</span>
              </div>
            </div>
          </div>
        </header>

        <main className="content">
          <section className="stats-grid">
            {QUICK_STATS.map((stat) => (
              <div className="stat-card" key={stat.label}>
                <p className="stat-label">{stat.label}</p>
                <h2>{stat.value}</h2>
                <span className="stat-meta">Updated just now</span>
              </div>
            ))}
          </section>

          <section className="hero-grid">
            <div className="panel hero-panel">
              <h3>Today’s picks</h3>
              <p>Freshly curated meals with priority delivery.</p>
              <button className="btn accent">Explore menus</button>
            </div>
            <div className="panel">
              <div className="panel-header">
                <h3>Favorites</h3>
                <button className="btn ghost">See all</button>
              </div>
              <ul className="favorite-list">
                {FAVORITES.map((item) => (
                  <li key={item.name}>
                    <div>
                      <p>{item.name}</p>
                      <span>{item.eta}</span>
                    </div>
                    <span className="pill">{item.tag}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="product-grid">
            {PRODUCTS.map((product) => (
              <article className="product-card" key={product.name}>
                <div className="product-image" />
                <div>
                  <h4>{product.name}</h4>
                  <p>{product.price}</p>
                </div>
                <span className="product-badge">{product.badge}</span>
              </article>
            ))}
          </section>

          <ResponsiveTable rows={RECENT_ORDERS} columns={orderColumns} />
        </main>
      </div>
    </div>
  );
}
