const jwt = require('jsonwebtoken');
require("dotenv").config({ debug: false });

exports.generateTokens = (user) => {
  const accessToken = jwt.sign(
    { userId: user._id, userName: user.userName, isVerified: user.isVerified },
    process.env.JWT_SECRET,
    // { expiresIn: '30m' }
  );

  const refreshToken = jwt.sign(
    { userId: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};