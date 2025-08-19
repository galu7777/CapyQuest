const bcrypt = require('bcryptjs');
const { User } = require('../../models/user/user.model');
const response = require('../../utils/response');
const { generateTokens } = require('../../utils/generateToken');
const { validateRequiredFields } = require('../../utils/validateRequiredFields');

signIn = async (req, res) => {
  const { userName, password } = req.body;

  const validationError = validateRequiredFields({ userName, password });
  if (validationError) {
    return response(res, validationError.status, validationError.message);
  }

  try {
    const user = await User.findOne({ userName });

    if (!user) return response(res, 401, 'Invalid credentials');

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return response(res, 401, 'Incorrect password');

    const { accessToken, refreshToken } = generateTokens(user);

    // Guardar refreshToken en la base de datos
    user.refreshToken = refreshToken;
    await user.save();

    response(res, 200, 'Login successful', { accessToken, refreshToken });
  } catch (error) {
    console.error('Error en SignIn:', error);
    response(res, 500, 'Internal server error');
  }
};

module.exports = signIn;