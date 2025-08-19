const express = require('express');
const { auth } = require('../../controllers')

const router = express.Router();

//Rutas de registro y login por email
router.post("/signup", auth.signUp);
router.post("/signin", auth.signIn);

module.exports = router;