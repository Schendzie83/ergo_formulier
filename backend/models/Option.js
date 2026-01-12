const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Option = sequelize.define('Option', {
  text: {
    type: DataTypes.STRING,
    allowNull: false
  },
  value: {
    type: DataTypes.STRING
  },
  orderIndex: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
});

module.exports = Option;
