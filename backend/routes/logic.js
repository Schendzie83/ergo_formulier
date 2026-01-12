const express = require('express');
const router = express.Router();
const { LogicRule } = require('../models');
const authenticateToken = require('../middleware/auth');

// POST create a logic rule
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { formId, targetQuestionId, triggerQuestionId, triggerOptionId, action } = req.body;
    const rule = await LogicRule.create({
      formId,
      targetQuestionId,
      triggerQuestionId,
      triggerOptionId,
      action
    });
    res.status(201).json(rule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update a logic rule
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { triggerQuestionId, triggerOptionId, action } = req.body;
    const rule = await LogicRule.findByPk(req.params.id);
    if (!rule) return res.status(404).json({ error: 'LogicRule not found' });
    
    await rule.update({ triggerQuestionId, triggerOptionId, action });
    res.json(rule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE a logic rule
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const rule = await LogicRule.findByPk(req.params.id);
    if (!rule) return res.status(404).json({ error: 'LogicRule not found' });
    
    await rule.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
