const StockItem = require("../models/stockItem.model");
const sequelize = require("../database");

const getAllStockItems = async (stockId) => {
  try {
    const stocks = await StockItem.findAll({
      where: { stockId: stockId },
      order: [["receivedDate", "ASC"]],
      raw: true,
    });
    // console.log("Stocked item for ", stockId, ": ", stocks);
    return stocks;
  } catch (error) {
    console.log("Error Finding Stock: ", error);
    throw error;
  }
};

const findById = async (serialNumber) => {
  try {
    const normalizedSerial = serialNumber.toLowerCase();
    console.log("Received serial number in service: ", normalizedSerial);
    const stockItem = await StockItem.findOne({
      where: { serialNumber: normalizedSerial },
      raw: true,
    });
    console.log("StockItem confirm: ", stockItem);
    return stockItem;
  } catch (error) {
    console.log("Error Finding StockItem: ", error);
    throw error;
  }
};

const find = async (name) => {
  try {
    const stockItem = await StockItem.findOne({
      where: { name: name },
      raw: true,
    });
    console.log(
      "Checking stockItem existense... ",
      stockItem ? `Found` : "Cannot Found"
    );
    return stockItem;
  } catch (error) {
    console.log("Error Finding StockItem: ", error);
    throw error;
  }
};

const findStockItemBySerialNumber = async (serialNumber) => {
  try {
    const stockItem = await StockItem.findOne({
      where: { serialNumber: serialNumber },
    });
    console.log("Checking stockItem item name: ", serialNumber, stockItem);
    return stockItem;
  } catch (error) {
    throw error;
  }
};

const findStockItemItemByStockItemname = async (name) => {
  try {
    const stockItem = await StockItem.findOne({
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
    return stockItem;
  } catch (error) {
    throw error;
  }
};

const createStockItem = async (StockItemData) => {
  try {
    const { stockId, serialNumber, specs, PRDate, receivedDate, remarks } =
      StockItemData;

    // Hash password before storing

    console.log("Adding stockItem.");
    const stockItem = await StockItem.create({
      stockId: stockId,
      serialNumber: serialNumber,
      specs: specs,
      PRDate: PRDate,
      receivedDate: receivedDate,
      remarks: remarks,
    });

    return {
      id: stockItem.id,
      serialNumber: stockItem.serialNumber,
    };
  } catch (error) {
    throw error;
  }
};

const updateStockItem = async (stockItemId, StockItemData) => {
  try {
    const stockItem = await StockItem.findByPk(stockItemId);

    if (!stockItem) {
      throw new Error("StockItem not found.");
    }

    // prepare the data
    const updateData = {};

    if (StockItemData.name) {
      updateData.name = StockItemData.name;
    }

    await stockItem.update(updateData);

    console.log("StockItem updated successfully.");

    // Return stockItem without password
    return {
      id: stockItem.id,
      name: stockItem.name,
    };
  } catch (error) {
    console.error("Error updating stockItem: ", error);
    throw error;
  }
};

const deployStockItem = async (itemId, updateData) => {
  try {
    const stockItem = await StockItem.findByPk(itemId);

    if (!stockItem) {
      throw new Error("Item not found.");
    }

    await stockItem.update(updateData);

    console.log("StockItem updated successfully: ", stockItem);

    // Return stockItem without password
    return {
      serialNumber: stockItem.serialNumber,
      remarks: stockItem.remarks,
    };
  } catch (error) {
    console.error("Error updating stockItem: ", error);
    throw error;
  }
};

const deleteStockItem = async (stockItemId) => {
  try {
    const stockItem = await StockItem.findByPk(stockItemId);

    if (!stockItem) {
      throw new Error("StockItem not found.");
    }

    // IF USER IS FOUND DELETE
    await stockItem.destroy(stockItemId);

    console.log("StockItem deleted successfully.");

    // Return stockItem without password
    return {
      id: stockItem.id,
      name: stockItem.name,
    };
  } catch (error) {
    console.error("Error updating stockItem: ", error);
    throw error;
  }
};

module.exports = {
  findStockItemBySerialNumber,
  findStockItemItemByStockItemname,
  getAllStockItems,
  createStockItem,
  updateStockItem,
  deployStockItem,
  deleteStockItem,
  find,
  findById,
};
