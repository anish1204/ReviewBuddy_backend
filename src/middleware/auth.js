// src/middleware/auth.js
const jwt = require("jsonwebtoken");

const auth = (roles = []) => {
  // roles can be a single string or array; [] = any logged-in user
  if (typeof roles === "string") roles = [roles];

  return (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token, authorization denied" });
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;

      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ message: "Forbidden: insufficient role" });
      }

      next();
    } catch (err) {
      console.error(err);
      res.status(401).json({ message: "Token is not valid" });
    }
  };
};

module.exports = auth;
