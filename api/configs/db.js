const mongoose = require('mongoose');
require('dotenv').config({ debug: false });

// Agrega esto para suprimir el warning
mongoose.set('strictQuery', false); // O true si prefieres el comportamiento actual

const connectDB = async () => {
	try {
		await mongoose.connect(process.env.MONGODB_URI);
		// console.log('La Base De Datos esta conectada');
	} catch (error) {
		console.error(error.message);
		process.exit(1);
	}
};

module.exports = connectDB;