const { Sequelize } = require("sequelize");
const path = require("path");

const dbUrl = process.env.DATABASE_URL;

let sequelize;

if (dbUrl) {
  console.log("🚀 Using POSTGRES Database via URL");
  console.log(`Debug URL start: ${dbUrl.substring(0, 15)}...`); // Print first chars to verify format

  sequelize = new Sequelize(dbUrl, {
    dialect: "postgres",
    protocol: "postgres",
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // Required for many cloud providers (Render/Heroku/Railway)
      },
    },
  });
} else {
  console.log("📂 Using LOCAL SQLITE Database");
  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: path.join(__dirname, "..", "database.sqlite"),
    logging: false,
  });
}

module.exports = sequelize;
