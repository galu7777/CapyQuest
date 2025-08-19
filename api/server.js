const server = require("./src/app.js");
const connectDB = require("./configs/db.js");
require('dotenv').config({ debug: false });

connectDB().then(() => {
  console.log('La Base De Datos esta conectada');
	// Levantar el servidor
	server.listen(process.env.PORT || 3000, () => {
	  console.log(`El Servidor es corriendo en el: ${process.env.PORT || 3000}`);
  })
});
