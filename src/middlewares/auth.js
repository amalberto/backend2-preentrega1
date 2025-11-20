/* Middelar para auteticación y autorización del rol  */

const isAuth = (req, res, next) => {
    if(req.session?.user) return next(); //Usuario autenticado
    return res.status(401).json({ message: 'No autenticado' });
};

const requiredRole = (role) => (req, res, next) => {
    if(req.session?.user?.role === role) return next(); //Usuario autorizado
    return res.status(403).json({ message: 'Accesi denegado' });
}

export default { isAuth, requiredRole };
