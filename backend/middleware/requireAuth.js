const jwt = require("jsonwebtoken");

const requireAuth = (req, res, next) => {
  // We configured server.js with cookie-parser
  let token = req.cookies.auth_token;
  
  // SUPPORT FOR iOS / MOBILE (Fallback to Header if Cookies are blocked)
  if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

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
