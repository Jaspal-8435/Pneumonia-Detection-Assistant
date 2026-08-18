const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const createError = require("../utils/createError");
const generateToken = require("../utils/generateToken");

function sendAuthResponse(res, user, statusCode = 200) {
  const token = generateToken(user);

  res.status(statusCode).json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
}

const signup = asyncHandler(async (req, res) => {
  const { name, email, password, role = "patient" } = req.body;

  if (!name || !email || !password) {
    throw createError("Name, email, and password are required.", 400);
  }

  if (!["patient", "doctor"].includes(role)) {
    throw createError("Role must be patient or doctor.", 400);
  }

  const user = await User.create({ name, email, password, role });
  sendAuthResponse(res, user, 201);
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw createError("Email and password are required.", 400);
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.matchPassword(password))) {
    throw createError("Invalid email or password.", 401);
  }

  sendAuthResponse(res, user);
});

const me = asyncHandler(async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

module.exports = { login, me, signup };

