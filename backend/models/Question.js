const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Question = sequelize.define('Question', {
  text: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('multiple_choice', 'text', 'date', 'number', 'section'),
    allowNull: false
  },
  placeholder: {
    type: DataTypes.STRING,
    allowNull: true
  },
  parentId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  orderIndex: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  required: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  allowMultipleAnswers: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
});

module.exports = Question;
