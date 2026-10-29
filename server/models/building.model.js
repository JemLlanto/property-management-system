const prisma = require("../lib/prisma");

// List all buildings, newest first
async function getAllBuildings() {
  return prisma.building.findMany({
    orderBy: { building_id: "desc" },
  });
}

async function findByName(name, excludeId = null) {
  return prisma.building.findFirst({
    where: {
      name,
      ...(excludeId !== null
        ? { building_id: { not: Number(excludeId) } }
        : {}),
    },
  });
}

async function createBuilding({ name, capacity }) {
  const existing = await findByName(name);

  if (existing) {
    throw new Error("A building with this name already exists");
  }

  return prisma.building.create({
    data: {
      name,
      capacity: Number(capacity),
    },
  });
}

async function updateBuilding(building_id, { name, capacity }) {
  const data = {};

  if (name !== undefined) {
    const existing = await findByName(name, building_id);

    if (existing) {
      throw new Error("A building with this name already exists");
    }

    data.name = name;
  }

  if (capacity !== undefined) {
    if (Number(capacity) <= 0) {
      throw new Error("Capacity must be greater than 0");
    }

    data.capacity = Number(capacity);
  }

  if (Object.keys(data).length === 0) {
    throw new Error("At least one field is required");
  }

  return prisma.building.update({
    where: { building_id: Number(building_id) },
    data,
  });
}

async function deleteBuilding(building_id) {
  const building = await prisma.building.findUnique({
    where: { building_id: Number(building_id) },
  });

  if (!building) {
    return null;
  }

  await prisma.building.delete({
    where: { building_id: Number(building_id) },
  });

  return true;
}

module.exports = {
  getAllBuildings,
  findByName,
  createBuilding,
  updateBuilding,
  deleteBuilding,
};
