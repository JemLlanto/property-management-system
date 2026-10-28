const { DataTypes } = require("sequelize");
const sequelize = require("../database");

const Stock = sequelize.define("Stock", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  specs: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
});

module.exports = Stock;
