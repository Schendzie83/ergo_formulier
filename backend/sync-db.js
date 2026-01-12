const sequelize = require('./config/database');
const { User, Form, Question, Option, LogicRule, Tooltip } = require('./models');

async function syncDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    
    // Force: true drops tables if they exist. Use with caution in production.
    // For dev, it's fine to reset.
    await sequelize.sync({ force: true }); 
    console.log('All models were synchronized successfully.');
    
    // Create dummy user
    await User.create({
      username: 'teacher',
      passwordHash: 'dummyhash', // In real app, hash this
      email: 'teacher@example.com'
    });
    console.log('Dummy user created.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  } finally {
    await sequelize.close();
  }
}

syncDatabase();
