/**
 * Middleware de manejo de errores (centralizado)
 * captura erroreres y unifica respuestas en JSON
 */

export default (err, _req, res, _next) => {
    console.error('X', err);
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'Error interno' });
};
