// src/services/userService.js
const User = require("../models/User");

const validateVendor = async (vendorId) => {
  const user = await User.findById(vendorId);

  if (!user) {
    throw new Error("Vendor not found");
  }

  if (user.role !== "vendor") {
    throw new Error("User is not authorized as vendor");
  }

  return user;
};

module.exports = validateVendor;
