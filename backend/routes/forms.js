const express = require('express');
const router = express.Router();
const { Form, Question, Option, LogicRule, Tooltip } = require('../models');
const authenticateToken = require('../middleware/auth');

// GET all forms
router.get('/', async (req, res) => {
  try {
    const forms = await Form.findAll();
    res.json(forms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET one form by ID (with all related data)
router.get('/:id', async (req, res) => {
  try {
    const form = await Form.findByPk(req.params.id, {
      include: [
        {
          model: Question,
          include: [
            { model: Option },
            { model: LogicRule, as: 'TargetRules' },
            { model: LogicRule, as: 'TriggerRules' }
          ]
        },
        { model: Tooltip },
        { model: LogicRule }
      ]
    });
    if (!form) {
      console.log(`Form ${req.params.id} not found in DB`);
      return res.status(404).json({ error: 'Form not found' });
    }
    res.json(form);
  } catch (error) {
    console.error(`Error fetching form ${req.params.id}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// POST create a new form
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description } = req.body;
    // Use authenticated user ID
    const form = await Form.create({ title, description, createdBy: req.user.id });
    res.status(201).json(form);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update a form
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, description, isPublic, isLocked } = req.body;
    const form = await Form.findByPk(req.params.id);
    if (!form) return res.status(404).json({ error: 'Form not found' });
    
    await form.update({ title, description, isPublic, isLocked });
    res.json(form);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE a form
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const form = await Form.findByPk(req.params.id);
    if (!form) return res.status(404).json({ error: 'Form not found' });
    
    if (form.isLocked) {
      return res.status(403).json({ error: 'Dit formulier is beveiligd en kan niet worden verwijderd.' });
    }
    
    await form.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
