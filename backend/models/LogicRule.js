const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LogicRule = sequelize.define('LogicRule', {
  action: {
    type: DataTypes.ENUM('SHOW', 'HIDE'),
    defaultValue: 'SHOW'
  }
});

module.exports = LogicRule;
