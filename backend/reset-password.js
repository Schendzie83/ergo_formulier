const sequelize = require('./config/database');
const { User } = require('./models');
const bcrypt = require('bcryptjs');

async function resetAdmin() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    const username = 'admin';
    const password = 'password123'; // Default password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Eerst verwijderen als hij bestaat (harde reset)
    await User.destroy({ where: { username } });
    console.log(`Deleted existing user '${username}' (if any).`);

    // Nu opnieuw aanmaken
    await User.create({
      username,
      passwordHash: hashedPassword,
      email: 'admin@ergoforms.nl'
    });
    console.log(`Created new user '${username}' fresh.`);

    console.log(`\nlogin gegevens:\nGebruikersnaam: ${username}\nWachtwoord: ${password}\n`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

resetAdmin();
