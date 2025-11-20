// src/routes/users.routes.js

import { Router } from 'express';
import User from '../models/User.js';

const router = Router();

//GET lista
router.get('/', async (_req, res, next) => {
    try {
        const users = await User.find().lean();
        res.json(users);
    } catch (err) {
        next(err);
    }
});

//GET detalle
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).lean();
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
        res.json(user);
    } catch (err) {
        next(err);
    }
});

//POST crear
router.post('/', async (req, res, next) => {
    try {
        const { name, age, email } = req.body || {};
        if (!name || age == null || !email)
            return res.status(422).json({ message: 'name, age, email son obligatorios' });
        
        const user = await User.create({ name, age, email });
        res.status(201).location(`/api/users/${user._id}`).json(user);
    } catch (err) {
        next(err);
    }
});

//PUT actualizar
router.put('/:id', async (req, res, next) => {
    try {
        const { name, age, email } = req.body || {};
        if (!name || age == null || !email)
            return res.status(422).json({ message: 'name, age, email son obligatorios' });
        
        const u = await User.findByIdAndUpdate(
            req.params.id,
            { name, age, email },
            { new: true, runValidators: true }
        ).lean();
        
        if (!u) return res.status(404).json({ message: 'Usuario no encontrado' });
        res.json(u);
    } catch (err) {
        next(err);
    }
});

//PATCH actualizar parcial
router.patch('/:id', async (req, res, next) => {
    try {
        if (!req.body || Object.keys(req.body).length === 0)
            return res.status(422).json({ message: 'Se requiere al menos un campo para actualizar' });
        
        const u = await User.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).lean();
        
        if (!u) return res.status(404).json({ message: 'Usuario no encontrado' });
        res.json(u);
    } catch (err) {
        next(err);
    }
});

//DELETE borrar
router.delete('/:id', async (req, res, next) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id).lean();
        if (!deletedUser) return res.status(404).json({ message: 'Usuario no encontrado' });
        res.status(204).send();
    } catch (err) {
        next(err);
    }
});

export default router;