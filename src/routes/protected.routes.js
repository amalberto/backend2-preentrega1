// src/routes/protected.routes.js

import { Router } from 'express';
import User from '../models/User.js';
const router = Router();

/* ----------- Middlewares de protección ----------- */

function isAuthenticated(req, res, next) {
    if (req.session?.user) return next();
    return res.status(401).json({ error: 'No autenticado' });
}

function authorize(role) {
    return (req, res, next) => {
        if (!req.session?.user) return res.status(401).json({ error: 'No autenticado' });
        if (req.session.user.role !== role) {
            return res.status(403).json({ error: 'Prohibido: requiere rol ' + role });
        }
        next();
    };
}

/* PING: PROTEGIDO  */

router.get('/ping', isAuthenticated, (_req, res) => {
    res.json({ ok: true, msg: 'ping protegido'});
})

/* ---------- /api/users/me (protegido, lee DESDE DB) ---------- */

router.get('/me', isAuthenticated, async (req, res, next) => {
    try {
        const id = req.session.user?.id;
        if (!id) {
            return res.status(400).json({
                error: 'Sesión sin id: este endpoiny lee desde la DB. Loggeate con usuario real'
            })
        }
        const user = await User.findById(id).select('name email role age').lean();
        if(!user) return  res.status(404).json({error: 'Usuario no encontrado' });
        res.json({ user });
    } catch (err) { next(err); }
});

// GET lista  (solo admin)
router.get('/', isAuthenticated, authorize('admin'), async (_req, res, next) => {
    try {
        const users = await User.find().lean();
        res.json(users);
    } catch (err) { next(err); }
});

// GET detalle (autegticado)
router.get('/:id', isAuthenticated, async (req, res, next) => {
    try {
        const u = await User.findById(req.params.id).lean();
        if (!u) return res.status(404).json({ message: 'No encontrado' });
        res.json(u);
    } catch (err) { next(err); }
});

// POST crear (solo admin)
router.post('/', isAuthenticated, authorize('admin'), async (req, res, next) => {
    try {
        const { name, age, email } = req.body || {};
        if (!name || age == null || !email)
            return res.status(422).json({ message: 'name, age, email son obligatorios' });
        
        const user = await User.create({ name, age, email });
        res.status(201).location(`/api/users/${user._id}`).json(user);
    } catch (err) { next(err); }
});

// PUT reemplazo total (solo admin)
router.put('/:id', isAuthenticated, authorize('admin'), async (req, res, next) => {
    try {
        const { name, age, email } = req.body || {};
        if (!name || age == null || !email)
            return res.status(422).json({ message: 'name, age, email son obligatorios' });
        
        const u = await User.findByIdAndUpdate(
            req.params.id,
            { name, age, email },
            { new: true, runValidators: true }
        ).lean();
        
        if (!u) return res.status(404).json({ message: 'No encontrado' });
        res.json(u);
    } catch (err) { next(err); }
});

// PATCH parcial (solo admin)
router.patch('/:id', isAuthenticated, authorize('admin'), async (req, res, next) => {
    try {
        const u = await User.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        ).lean();
        
        if (!u) return res.status(404).json({ message: 'No encontrado' });
        res.json(u);
    } catch (err) { next(err); }
});

// DELETE eliminar
router.delete('/:id', isAuthenticated, authorize('admin'), async (req, res, next) => {
    try {
        const u = await User.findByIdAndDelete(req.params.id).lean();
        if (!u) return res.status(404).json({ message: 'No encontrado' });
        res.status(204).send();
    } catch (err) { next(err); }
});

export default router;
