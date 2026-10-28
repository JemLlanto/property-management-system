const Stock = require("../models/stock.model");
const bcrypt = require("bcrypt");
const sequelize = require("../database");

const getAllStocks = async () => {
  return await Stock.findAll();
};

const findById = async (id) => {
  try {
    const stock = await Stock.findOne({
      where: { id: id },
      raw: true,
    });
    console.log("Stock ID confirm: ", stock);
    return stock;
  } catch (error) {
    console.log("Error Finding Stock: ", error);
    throw error;
  }
};

const find = async (name) => {
  try {
    const stock = await Stock.findOne({
      where: { name: name },
      raw: true,
    });
    console.log(
      "Checking stock existense... ",
      stock ? `Found` : "Cannot Found"
    );
    return stock;
  } catch (error) {
    console.log("Error Finding Stock: ", error);
    throw error;
  }
};

const findStockByStockname = async (name) => {
  try {
    const stock = await Stock.findOne({
      where: { name: name },
    });
    console.log("Checking stock item name: ", name, stock);
    return stock;
  } catch (error) {
    throw error;
  }
};

const findStockItemByStockname = async (name) => {
  try {
    const stock = await Stock.findOne({
      where: sequelize.where(
        sequelize.fn(
          "JSON_CONTAINS",
          sequelize.col("availableItems"),
          JSON.stringify(name)
        ),
        1
      ),
    });
    console.log("Checking name: ", name);
    return stock;
  } catch (error) {
    throw error;
  }
};

const createStock = async (StockData) => {
  try {
    const { name, specs } = StockData;

    // Hash password before storing

    console.log("Adding stock.");
    const stock = await Stock.create({
      name: name,
      specs: specs,
    });

    // Return stock without password
    return {
      id: stock.id,
      name: stock.name,
    };
  } catch (error) {
    throw error;
  }
};

const updateStock = async (stockId, StockData) => {
  try {
    const stock = await Stock.findByPk(stockId);

    if (!stock) {
      throw new Error("Stock not found.");
    }

    // prepare the data
    const updateData = {};

    if (StockData.name) {
      updateData.name = StockData.name;
    }

    if (StockData.specs) {
      updateData.specs = StockData.specs;
    }

    await stock.update(updateData);

    console.log("Stock updated successfully.");

    // Return stock without password
    return {
      id: stock.id,
      name: stock.name,
    };
  } catch (error) {
    console.error("Error updating stock: ", error);
    throw error;
  }
};

const deleteStock = async (stockId) => {
  try {
    const stock = await Stock.findByPk(stockId);

    if (!stock) {
      throw new Error("Stock not found.");
    }

    // IF USER IS FOUND DELETE
    await stock.destroy(stockId);

    console.log("Stock deleted successfully.");

    // Return stock without password
    return {
      id: stock.id,
      name: stock.name,
    };
  } catch (error) {
    console.error("Error updating stock: ", error);
    throw error;
  }
};

module.exports = {
  findStockByStockname,
  findStockItemByStockname,
  getAllStocks,
  createStock,
  updateStock,
  deleteStock,
  find,
  findById,
};
