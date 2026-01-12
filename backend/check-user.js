const sequelize = require('./config/database');
const { User } = require('./models');
const bcrypt = require('bcryptjs');

async function checkUser() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    const username = 'admin';
    const passwordToCheck = 'password123';

    const user = await User.findOne({ where: { username } });

    if (!user) {
      console.log(`❌ User '${username}' NOT found in the database.`);
    } else {
      console.log(`✅ User '${username}' FOUND.`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Stored Password Hash: ${user.passwordHash}`);

      const match = await bcrypt.compare(passwordToCheck, user.passwordHash);
      if (match) {
        console.log(`✅ Password check SUCCESS: 'password123' matches the stored hash.`);
      } else {
        console.log(`❌ Password check FAILED: 'password123' does NOT match the stored hash.`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkUser();
