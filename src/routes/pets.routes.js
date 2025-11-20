// src/routes/pets.routes.js
// Router de mascotas con validación de parámetros y router.param 

import { Router } from 'express';

const router = Router();

// Simulación de BD en memoria
const pets = [];

/**
 * router.param - Middleware que se ejecuta automáticamente cuando hay :pet en la ruta
 * Precarga la mascota en req.pet
 */
router.param('pet', (req, res, next, petName) => {
    console.log('[PARAM] Buscando mascota:', petName);
    
    // Buscar mascota en la "BD"
    const pet = pets.find(p => p.name.toLowerCase() === petName.toLowerCase());
    
    if (!pet) {
        return res.status(404).json({
            error: `Mascota "${petName}" no encontrada`
        });
    }
    
    // Guardar en req para uso posterior
    req.pet = pet;
    next();
});

/**
 * POST /api/pets
 * Crear nueva mascota
 */
router.post('/', (req, res) => {
    const { name, specie } = req.body;
    
    if (!name || !specie) {
        return res.status(400).json({
            error: 'Faltan campos: name y specie son requeridos'
        });
    }
    
    // Validar que no exista
    if (pets.find(p => p.name.toLowerCase() === name.toLowerCase())) {
        return res.status(400).json({
            error: `La mascota "${name}" ya existe`
        });
    }
    
    const newPet = {
        name,
        specie,
        adopted: false,
        createdAt: new Date()
    };
    
    pets.push(newPet);
    
    res.status(201).json({
        message: 'Mascota creada',
        pet: newPet
    });
});

/**
 * GET /api/pets
 * Listar todas las mascotas
 */
router.get('/', (req, res) => {
    res.json({
        count: pets.length,
        pets
    });
});

/**
 * GET /api/pets/:pet
 * Obtener mascota específica
 * En Express 5, la validación se hace con middleware en lugar de regex inline
 */
router.get('/:pet', (req, res) => {
    // Validar que solo contenga letras
    if (!/^[A-Za-z]+$/.test(req.params.pet)) {
        return res.status(400).json({
            error: 'El nombre de la mascota solo puede contener letras (A-Z, a-z)'
        });
    }
    
    // req.pet ya fue cargado por router.param
    res.json({
        pet: req.pet
    });
});

/**
 * PUT /api/pets/:pet
 * Marcar mascota como adoptada
 */
router.put('/:pet', (req, res) => {
    // Validar que solo contenga letras
    if (!/^[A-Za-z]+$/.test(req.params.pet)) {
        return res.status(400).json({
            error: 'El nombre de la mascota solo puede contener letras (A-Z, a-z)'
        });
    }
    
    // req.pet ya fue cargado por router.param
    req.pet.adopted = true;
    req.pet.adoptedAt = new Date();
    
    res.json({
        message: `${req.pet.name} ha sido adoptado/a!`,
        pet: req.pet
    });
});

/**
 * DELETE /api/pets/:pet
 * Eliminar mascota
 */
router.delete('/:pet', (req, res) => {
    // Validar que solo contenga letras
    if (!/^[A-Za-z]+$/.test(req.params.pet)) {
        return res.status(400).json({
            error: 'El nombre de la mascota solo puede contener letras (A-Z, a-z)'
        });
    }
    
    const index = pets.findIndex(p => p.name === req.pet.name);
    pets.splice(index, 1);
    
    res.json({
        message: `Mascota "${req.pet.name}" eliminada`,
        deleted: req.pet
    });
});

export default router;
