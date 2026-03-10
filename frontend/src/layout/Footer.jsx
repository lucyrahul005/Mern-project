import { FaInstagram, FaLinkedin, FaGithub, FaArrowUp } from "react-icons/fa";

function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer style={styles.footer}>
      {/* BACK TO TOP */}
      <div style={styles.backToTop} onClick={scrollToTop}>
        <FaArrowUp /> Back to top
      </div>

      {/* MAIN CONTAINER */}
      <div style={styles.mainContainer}>
        {/* LINKS SECTION */}
        <div style={styles.linksGrid}>
          {/* COMPANY */}
          <div>
            <h4 style={styles.heading}>Company</h4>
            <div style={styles.links}>
              <a href="#" style={styles.link}>About WebnApp</a>
              <a href="#" style={styles.link}>Careers</a>
              <a href="#" style={styles.link}>Blog</a>
              <a href="#" style={styles.link}>Investor Relations</a>
            </div>
          </div>

          {/* FOR USERS */}
          <div>
            <h4 style={styles.heading}>For Customers</h4>
            <div style={styles.links}>
              <a href="#" style={styles.link}>Browse Restaurants</a>
              <a href="#" style={styles.link}>Food Delivery</a>
              <a href="#" style={styles.link}>Offers & Discounts</a>
              <a href="#" style={styles.link}>Gift Cards</a>
            </div>
          </div>

          {/* RESTAURANTS */}
          <div>
            <h4 style={styles.heading}>For Restaurants</h4>
            <div style={styles.links}>
              <a href="#" style={styles.link}>Partner with WebnApp</a>
              <a href="#" style={styles.link}>Restaurant Dashboard</a>
              <a href="#" style={styles.link}>Business Tools</a>
              <a href="#" style={styles.link}>Restaurant Support</a>
            </div>
          </div>

          {/* RIDERS */}
          <div>
            <h4 style={styles.heading}>For Delivery Partners</h4>
            <div style={styles.links}>
              <a href="#" style={styles.link}>Become a Rider</a>
              <a href="#" style={styles.link}>Rider Dashboard</a>
              <a href="#" style={styles.link}>Earnings</a>
              <a href="#" style={styles.link}>Rider Support</a>
            </div>
          </div>

          {/* HELP */}
          <div>
            <h4 style={styles.heading}>Support</h4>
            <div style={styles.links}>
              <a href="#" style={styles.link}>Help Center</a>
              <a href="#" style={styles.link}>Safety</a>
              <a href="#" style={styles.link}>Terms & Conditions</a>
              <a href="#" style={styles.link}>Privacy Policy</a>
            </div>
          </div>
        </div>

        {/* DIVIDER */}
        <div style={styles.divider}></div>

        {/* BRAND & SOCIAL SECTION */}
        <div style={styles.brandSection}>
          <div>
            <h2 style={styles.logo}>🍔 WebnApp</h2>
            <p style={styles.tagline}>
              Fastest food delivery at your doorstep
            </p>
          </div>

          {/* SOCIAL LINKS */}
          <div style={styles.socialIcons}>
            <a href="#" style={styles.socialIcon}><FaInstagram /></a>
            <a href="#" style={styles.socialIcon}><FaLinkedin /></a>
            <a href="#" style={styles.socialIcon}><FaGithub /></a>
          </div>
        </div>

        {/* DIVIDER */}
        <div style={styles.divider}></div>

        {/* CITIES */}
        <div style={styles.citiesSection}>
          <h4 style={styles.heading}>We Deliver In</h4>
          <div style={styles.cityGrid}>
            <span>Hyderabad</span>
            <span>Bangalore</span>
            <span>Mumbai</span>
            <span>Delhi</span>
            <span>Pune</span>
            <span>Chennai</span>
            <span>Kolkata</span>
            <span>Ahmedabad</span>
          </div>
        </div>
      </div>

      {/* COPYRIGHT */}
      <div style={styles.copyright}>
        © {new Date().getFullYear()} WebnApp. All Rights Reserved.
      </div>
    </footer>
  );
}

const styles = {
  footer: {
    background: "#ffffff",
    borderTop: "1px solid #e5e7eb",
    fontSize: "14px",
    color: "#4b5563",
  },

  backToTop: {
    background: "linear-gradient(135deg, #ff6b35, #ff8c42)",
    textAlign: "center",
    padding: "16px 20px",
    cursor: "pointer",
    fontWeight: "600",
    color: "#ffffff",
    fontSize: "15px",
    transition: "all 0.3s ease",
    ":hover": {
      opacity: 0.9,
    },
  },

  mainContainer: {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "0 6%",
  },

  linksGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "40px",
    padding: "50px 0 40px",
  },

  heading: {
    color: "#111827",
    marginBottom: "16px",
    fontWeight: "700",
    fontSize: "15px",
  },

  links: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  link: {
    color: "#6b7280",
    textDecoration: "none",
    fontSize: "14px",
    transition: "all 0.3s ease",
    cursor: "pointer",
    ":hover": {
      color: "#ff6b35",
    },
  },

  divider: {
    height: "1px",
    background: "#e5e7eb",
    margin: "30px 0",
  },

  brandSection: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "40px 0",
    flexWrap: "wrap",
    gap: "30px",
  },

  logo: {
    margin: 0,
    fontSize: "28px",
    color: "#111827",
    fontWeight: "700",
  },

  tagline: {
    margin: "8px 0 0",
    fontSize: "14px",
    color: "#6b7280",
  },

  socialIcons: {
    display: "flex",
    gap: "16px",
    fontSize: "20px",
  },

  socialIcon: {
    color: "#6b7280",
    transition: "all 0.3s ease",
    textDecoration: "none",
    cursor: "pointer",
    ":hover": {
      color: "#ff6b35",
      transform: "translateY(-2px)",
    },
  },

  citiesSection: {
    padding: "40px 0",
  },

  cityGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
    gap: "12px",
    marginTop: "16px",
  },

  copyright: {
    textAlign: "center",
    padding: "20px",
    background: "#f9fafb",
    fontSize: "13px",
    color: "#9ca3af",
    borderTop: "1px solid #e5e7eb",
  },
};

export default Footer;