const User = require("../models/user.model");
const bcrypt = require("bcrypt");

const getAllUsers = async () => {
  return await User.findAll({
    attributes: { exclude: ["password"] },
    where: {
      isAdmin: 0, // Don't return passwords
    },
  });
};

const findById = async (id) => {
  try {
    const user = await User.findOne({
      where: { id: id },
      raw: true,
    });
    // console.log("User ID confirm: ", user);
    return user;
  } catch (error) {
    console.log("Error Finding User: ", error);
    throw error;
  }
};

const find = async (username) => {
  try {
    const user = await User.findOne({
      where: { username: username },
      raw: true,
    });
    console.log("Checking user existense... ", user ? `Found` : "Cannot Found");
    return user;
  } catch (error) {
    console.log("Error Finding User: ", error);
    throw error;
  }
};

const findUserByUsername = async (username) => {
  try {
    const user = await User.findOne({
      where: { username: username },
    });
    console.log("Checking username: ", username);
    return user;
  } catch (error) {
    throw error;
  }
};

const createUser = async (userData) => {
  try {
    const { username, password } = userData;

    // Hash password before storing
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log("Adding user.");
    const user = await User.create({
      username: username,
      password: hashedPassword,
    });

    // Return user without password
    return {
      id: user.id,
      username: user.username,
    };
  } catch (error) {
    throw error;
  }
};

const updateUser = async (userId, userData) => {
  try {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new Error("User not found.");
    }

    // prepare the data
    const updateData = {};

    if (userData.username) {
      updateData.username = userData.username;
    }

    if (userData.password) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      updateData.password = hashedPassword;
    }

    await user.update(updateData);

    console.log("User updated successfully.");

    // Return user without password
    return {
      id: user.id,
      username: user.username,
    };
  } catch (error) {
    console.error("Error updating user: ", error);
    throw error;
  }
};

const deleteUser = async (userId) => {
  try {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new Error("User not found.");
    }

    // IF USER IS FOUND DELETE
    await user.destroy(userId);

    console.log("User deleted successfully.");

    // Return user without password
    return {
      id: user.id,
      username: user.username,
    };
  } catch (error) {
    console.error("Error updating user: ", error);
    throw error;
  }
};

module.exports = {
  findUserByUsername,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  find,
  findById,
};
