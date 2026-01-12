const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Tooltip = sequelize.define('Tooltip', {
  word: {
    type: DataTypes.STRING,
    allowNull: false
  },
  definition: {
    type: DataTypes.TEXT,
    allowNull: false
  }
});

module.exports = Tooltip;
