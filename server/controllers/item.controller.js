const Item = require("../models/item.model");

// Get all items belonging to the authenticated user
async function getItems(req, res) {
  try {
    const userId = req.user.user_id;

    const items = await Item.findByUserId(userId);

    return res.json({
      success: true,
      items,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

// Get a single item belonging to the authenticated user
async function getItem(req, res) {
  try {
    const userId = req.user.user_id;
    const { item_id } = req.params;

    const item = await Item.findById(item_id, userId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    return res.json({
      success: true,
      item,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

// Create a new item
async function createItem(req, res) {
  try {
    const userId = req.user.user_id;
    const { name, quantity, price } = req.body;

    // console.log("Received item data:", userId, name, quantity, price);
    // console.log("userId:", userId);

    if (!name || quantity === undefined || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "Table name, quantity, and price are required",
      });
    }

    if (quantity < 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity cannot be negative",
      });
    }

    if (price < 0) {
      return res.status(400).json({
        success: false,
        message: "Price cannot be negative",
      });
    }

    const item = await Item.createItem(name, userId, quantity, price);

    return res.status(201).json({
      success: true,
      message: "Item created successfully",
      item,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
}

// Update an item belonging to the authenticated user
async function updateItem(req, res) {
  try {
    const userId = req.user.user_id;
    const { item_id } = req.params;
    const { name, quantity, price } = req.body;

    // Make sure at least one field is provided
    if (name === undefined && quantity === undefined && price === undefined) {
      return res.status(400).json({
        success: false,
        message: "At least one field is required",
      });
    }

    // Validate only the fields that were provided
    if (name !== undefined && !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name cannot be empty",
      });
    }

    if (quantity !== undefined && quantity < 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity cannot be negative",
      });
    }

    if (price !== undefined && price < 0) {
      return res.status(400).json({
        success: false,
        message: "Price cannot be negative",
      });
    }

    const item = await Item.updateItem(item_id, userId, {
      name,
      quantity,
      price,
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    return res.json({
      success: true,
      message: "Item updated successfully",
      item,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
}

// Delete an item belonging to the authenticated user
async function deleteItem(req, res) {
  try {
    const userId = req.user.user_id;
    const { item_id } = req.params;

    const deleted = await Item.deleteItem(item_id, userId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    return res.json({
      success: true,
      message: "Item deleted successfully",
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
}

module.exports = {
  getItems,
  getItem,
  createItem,
  updateItem,
  deleteItem,
};
