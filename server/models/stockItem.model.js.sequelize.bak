const { DataTypes } = require("sequelize");
const sequelize = require("../database");

const StockItem = sequelize.define("StockItem", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  stockId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  serialNumber: {
    type: DataTypes.STRING(100),
    // unique: true,
    allowNull: true,
    defaultValue: null,
  },
  specs: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: null,
  },
  PRDate: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: null,
  },
  receivedDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    defaultValue: null,
  },
  deployedDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    defaultValue: null,
  },
  station: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: null,
  },
  department: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: null,
  },
  remarks: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: null,
  },
});

module.exports = StockItem;
