const jwt = require("jsonwebtoken");

const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const createError = require("../utils/createError");

const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    throw createError("Authentication token is required.", 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      throw createError("User for this token no longer exists.", 401);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }
    throw createError("Invalid or expired token.", 401);
  }
});

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(createError("You are not allowed to access this resource.", 403));
    }
    return next();
  };
};

module.exports = { authorize, protect };

