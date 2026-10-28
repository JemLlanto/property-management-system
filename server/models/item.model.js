const prisma = require("../lib/prisma");

async function findByUserId(user_id) {
  return prisma.item.findMany({
    where: { user_id },
    orderBy: { item_id: "desc" },
  });
}

async function findById(item_id, user_id) {
  return prisma.item.findFirst({
    where: { item_id: Number(item_id), user_id },
  });
}

async function findByName(name, user_id, excludeItemId = null) {
  return prisma.item.findFirst({
    where: {
      name,
      user_id,
      ...(excludeItemId !== null
        ? { item_id: { not: Number(excludeItemId) } }
        : {}),
    },
  });
}

async function createItem(name, user_id, quantity, price) {
  console.log(
    "Creating item with name:",
    name,
    "user_id:",
    user_id,
    "quantity:",
    quantity,
    "price:",
    price,
  );

  const existingItem = await findByName(name, user_id);

  if (existingItem) {
    throw new Error("Item already exists");
  }

  const item = await prisma.item.create({
    data: {
      name,
      user_id,
      quantity: Number(quantity),
      price: Number(price),
    },
  });

  return item;
}

async function updateItem(item_id, user_id, { name, quantity, price }) {
  const data = {};

  // Check if the new name already belongs to another item
  if (name !== undefined) {
    const existingItem = await findByName(name, user_id, item_id);

    if (existingItem) {
      throw new Error("Item name already exists");
    }

    data.name = name;
  }

  if (quantity !== undefined) {
    data.quantity = Number(quantity);
  }

  if (price !== undefined) {
    data.price = Number(price);
  }

  if (Object.keys(data).length === 0) {
    return null;
  }

  const existing = await findById(item_id, user_id);

  if (!existing) {
    return null;
  }

  const item = await prisma.item.update({
    where: { item_id: Number(item_id) },
    data,
  });

  return item;
}

async function deleteItem(item_id, user_id) {
  const existing = await findById(item_id, user_id);

  if (!existing) {
    return false;
  }

  await prisma.item.delete({
    where: { item_id: Number(item_id) },
  });

  return true;
}

module.exports = {
  createItem,
  findByUserId,
  findById,
  updateItem,
  deleteItem,
};
