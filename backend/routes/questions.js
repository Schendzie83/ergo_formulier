const express = require('express');
const router = express.Router();
const { Question, Option } = require('../models');
const authenticateToken = require('../middleware/auth');

// POST create a new question
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { formId, text, type, orderIndex, required, allowMultipleAnswers, parentId, placeholder, description } = req.body;
    const options = req.body.options || req.body.Options; // Handle both casings
    
    const question = await Question.create({ formId, text, type, orderIndex, required, allowMultipleAnswers, parentId, placeholder, description });
    
    if (options && options.length > 0) {
      const optionPromises = options.map(opt => Option.create({
        questionId: question.id,
        text: opt.text,
        value: opt.value,
        orderIndex: opt.orderIndex
      }));
      await Promise.all(optionPromises);
    }
    
    // Fetch the question with options to return
    const createdQuestion = await Question.findByPk(question.id, { include: [Option] });
    res.status(201).json(createdQuestion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update a question
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { text, type, orderIndex, required, allowMultipleAnswers, parentId, placeholder, description } = req.body;
    const options = req.body.options || req.body.Options; // Handle both casings
    
    const question = await Question.findByPk(req.params.id);
    if (!question) return res.status(404).json({ error: 'Question not found' });
    
    await question.update({ text, type, orderIndex, required, allowMultipleAnswers, parentId, placeholder, description });
    
    // Handle options update (smart update to preserve IDs and LogicRules)
    if (options) {
      console.log('Updating options:', options); // Debug
      const existingOptions = await Option.findAll({ where: { questionId: question.id } });
      const existingOptionIds = existingOptions.map(o => o.id);
      
      const incomingOptionIds = options.filter(o => o.id).map(o => o.id);
      const optionsToDelete = existingOptionIds.filter(id => !incomingOptionIds.includes(id));
      
      // Delete removed options
      if (optionsToDelete.length > 0) {
        console.log('Deleting options:', optionsToDelete); // Debug
        await Option.destroy({ where: { id: optionsToDelete } });
      }
      
      // Upsert (Update or Create)
      for (const opt of options) {
        if (opt.id && existingOptionIds.includes(opt.id)) {
            // Update existing
            await Option.update(
                { text: opt.text, value: opt.value, orderIndex: opt.orderIndex },
                { where: { id: opt.id } }
            );
        } else {
            // Create new
            console.log('Creating new option:', opt); // Debug
            await Option.create({
                questionId: question.id,
                text: opt.text,
                value: opt.value,
                orderIndex: opt.orderIndex
            });
        }
      }
    } else {
        console.log('No options provided in update'); // Debug
    }
    
    const updatedQuestion = await Question.findByPk(question.id, {
      include: [
        { model: Option }
      ],
      order: [
        [Option, 'orderIndex', 'ASC']
      ]
    });
    res.json(updatedQuestion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE a question
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const question = await Question.findByPk(req.params.id);
    if (!question) return res.status(404).json({ error: 'Question not found' });
    
    await question.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
