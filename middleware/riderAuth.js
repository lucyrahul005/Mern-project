const jwt = require("jsonwebtoken");

// Generic middleware that extracts userId from token
module.exports = function (req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied ❌ No token provided" });
  }

  try {
    const verified = jwt.verify(
      token,
      process.env.JWT_SECRET || "secret123"
    );
    req.userId = verified.id;
    req.role = verified.role;
    next();
  } catch (error) {
    res.status(400).json({ message: "Invalid token ❌" });
  }
};
