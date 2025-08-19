const bcrypt = require('bcryptjs');
const { User } = require('../../models/user/user.model');
const response = require('../../utils/response');
const { validateRequiredFields } = require('../../utils/validateRequiredFields');

signUp = async (req, res) => {
  try {
    const { userName, name, lastname, email, password } = req.body;

    const validationError = validateRequiredFields({ userName, name, lastname, email, password });
    if (validationError) {
      return response(res, validationError.status, validationError.message);
    }    

    if (typeof password !== 'string' || password.trim() === '') {
      return response(res, 400, 'The password must be a valid string');
    }

    const [existingUser, existingEmail] = await Promise.all([
      User.findOne({ userName }),
      User.findOne({ email })
    ]);

    if (existingUser) return response(res, 400, 'the username is already taken');
    if (existingEmail) return response(res, 400, 'the email is already registered');

    const hashedPassword = await bcrypt.hash(password, 12);

    const userNew = await User.create({ 
      userName, name, lastname, email, password: hashedPassword 
    });

    response(res, 201, 'User created successfully');
  } catch (error) {
    console.error('Error en SignUp:', error);
    response(res, 500, 'Internal server error');
  }
};

module.exports = signUp;