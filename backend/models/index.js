const User = require('./User');
const Form = require('./Form');
const Question = require('./Question');
const Option = require('./Option');
const LogicRule = require('./LogicRule');
const Tooltip = require('./Tooltip');

// User - Form
User.hasMany(Form, { foreignKey: 'createdBy' });
Form.belongsTo(User, { foreignKey: 'createdBy' });

// Form - Question
Form.hasMany(Question, { foreignKey: 'formId', onDelete: 'CASCADE' });
Question.belongsTo(Form, { foreignKey: 'formId' });

// Form - Tooltip
Form.hasMany(Tooltip, { foreignKey: 'formId', onDelete: 'CASCADE' });
Tooltip.belongsTo(Form, { foreignKey: 'formId' });

// Question - Option
Question.hasMany(Option, { foreignKey: 'questionId', onDelete: 'CASCADE' });
Option.belongsTo(Question, { foreignKey: 'questionId' });

// Question Hierarchy (Sections/Steps)
Question.hasMany(Question, { as: 'Children', foreignKey: 'parentId', onDelete: 'CASCADE' });
Question.belongsTo(Question, { as: 'Parent', foreignKey: 'parentId' });

// LogicRule Associations
// Target Question (the one being shown/hidden)
Question.hasMany(LogicRule, { as: 'TargetRules', foreignKey: 'targetQuestionId', onDelete: 'CASCADE' });
LogicRule.belongsTo(Question, { as: 'TargetQuestion', foreignKey: 'targetQuestionId' });

// Trigger Question (the one being answered)
Question.hasMany(LogicRule, { as: 'TriggerRules', foreignKey: 'triggerQuestionId', onDelete: 'CASCADE' });
LogicRule.belongsTo(Question, { as: 'TriggerQuestion', foreignKey: 'triggerQuestionId' });

// Trigger Option (the specific answer)
Option.hasMany(LogicRule, { foreignKey: 'triggerOptionId', onDelete: 'CASCADE' });
LogicRule.belongsTo(Option, { foreignKey: 'triggerOptionId' });

// Form - LogicRule (for easy fetching)
Form.hasMany(LogicRule, { foreignKey: 'formId', onDelete: 'CASCADE' });
LogicRule.belongsTo(Form, { foreignKey: 'formId' });

module.exports = {
  User,
  Form,
  Question,
  Option,
  LogicRule,
  Tooltip
};
