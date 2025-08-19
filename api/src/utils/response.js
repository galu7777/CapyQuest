// utils/response.js
module.exports = (res, statusCode, message = '', data = null) => {
    res.status(statusCode).json({
        error: statusCode >= 400, // Si el código de estado es 4xx o 5xx, asumimos que hay un error
        message: message || (statusCode >= 400 ? 'Ha ocurrido un error' : 'Operación exitosa'),
        data: data || null
        
    });
};
