const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const sequelize = require('./config/database');
const { User, Form, Question, Option, LogicRule, Tooltip } = require('./models');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Test route
app.get('/', (req, res) => {
  res.send('Form Management System API');
});

// API Routes will go here
// I will separate them into route files later, but for now I can put them here or in a routes folder.
// Let's create a routes folder.

const formRoutes = require('./routes/forms');
const questionRoutes = require('./routes/questions');
const logicRoutes = require('./routes/logic');
const authRoutes = require('./routes/auth');
const documentRoutes = require('./routes/documents');

app.use('/api/auth', authRoutes);
app.use('/api/forms', formRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/logic', logicRoutes);
app.use('/api/documents', documentRoutes);

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log('Database connected and synced.');

    // Seed Admin User if not exists
    const bcrypt = require('bcryptjs');
    const adminUser = await User.findOne({ where: { username: 'admin' } });
    if (!adminUser) {
      console.log('Creating default admin user...');
      const hashedPassword = await bcrypt.hash('password123', 10);
      await User.create({
        username: 'admin',
        passwordHash: hashedPassword,
        email: 'admin@ergoforms.nl'
      });
      console.log('Default admin user created: admin / password123');
    } else {
      console.log('Admin user already exists.');
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
});
