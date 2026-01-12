const express = require('express');
const router = express.Router();
const { Form, Question, Option, LogicRule } = require('../models');
const DocumentGenerator = require('../services/documentGenerator');

// POST generate document
router.post('/generate', async (req, res) => {
  try {
    const { formId, answers } = req.body;
    
    const form = await Form.findByPk(formId, {
      include: [
        {
          model: Question,
          include: [
            Option,
            { model: LogicRule, as: 'TargetRules' }
          ]
        }
      ],
      order: [[Question, 'orderIndex', 'ASC']]
    });
    
    if (!form) return res.status(404).json({ error: 'Form not found' });
    
    const buffer = await DocumentGenerator.generate(form, answers || {});
    
    res.setHeader('Content-Disposition', `attachment; filename=${form.title.replace(/\s+/g, '_')}.docx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.send(buffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
