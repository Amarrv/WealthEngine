const jwt = require("jsonwebtoken");

const requireAuth = (req, res, next) => {
  // We configured server.js with cookie-parser
  const token = req.cookies.auth_token;

  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized - No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret_for_local_dev");
    req.user = decoded; // { id, phoneNumber, ... }
    next();
  } catch (error) {
    console.error("JWT Verification Failed:", error);
    return res.status(401).json({ success: false, message: "Unauthorized - Invalid token" });
  }
};

module.exports = requireAuth;
