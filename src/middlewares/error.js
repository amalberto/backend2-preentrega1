/**
 * Middleware de manejo de errores (centralizado)
 * captura erroreres y unifica respuestas en JSON
 */

export default (err, _req, res, _next) => {
    console.error('[ERROR]', err);
    
    // Evitar crash si headers ya fueron enviados
    if (res.headersSent) return _next(err);
    
    const status = err.statusCode || err.status || 500;
    const message = err?.message || 'Error interno';
    const response = { error: message };
    
    if (process.env.NODE_ENV === 'development') {
        response.stack = err.stack;
    }
    
    res.status(status).json(response);
};
