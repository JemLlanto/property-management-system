const prisma = require("../lib/prisma");

// List all payments with the related bill and users resolved
async function getAllPayments() {
  return prisma.payment.findMany({
    include: {
      bill: {
        select: { bill_id: true, name: true, due_date: true, amount: true },
      },
      paidBy: {
        select: {
          user_id: true,
          name: true,
          email: true,
          unit_number: true,
          building: true,
        },
      },
      recordedBy: {
        select: { user_id: true, name: true, email: true },
      },
    },
    orderBy: [{ paid_at: "desc" }, { payment_id: "desc" }],
  });
}

async function findById(payment_id) {
  return prisma.payment.findUnique({
    where: { payment_id: Number(payment_id) },
  });
}

// Flatten the payment for the client response
function parsePayment(payment) {
  return {
    payment_id: payment.payment_id,
    bill_id: payment.bill_id,
    bill_name: payment.bill?.name ?? null,
    bill_due_date: payment.bill?.due_date ?? null,
    paid_by_id: payment.paid_by_id,
    unit_number: payment.paidBy?.unit_number ?? null,
    owner_name: payment.paidBy?.name ?? null,
    owner_email: payment.paidBy?.email ?? null,
    owner_building: payment.paidBy?.building ?? null,
    recorded_by_id: payment.recorded_by_id,
    recorded_by_name: payment.recordedBy?.name ?? null,
    recorded_by_email: payment.recordedBy?.email ?? null,
    amount: payment.amount,
    paid_at: payment.paid_at,
    created_at: payment.created_at,
    updated_at: payment.updated_at,
  };
}

// Validate and create a payment record
async function createPayment({ bill_id, paid_by_id, recorded_by_id, amount }) {
  const bill = await prisma.bill.findUnique({
    where: { bill_id: Number(bill_id) },
  });

  if (!bill) {
    throw new Error("Selected bill does not exist");
  }

  const payer = await prisma.user.findUnique({
    where: { user_id: String(paid_by_id) },
  });

  if (!payer) {
    throw new Error("Selected unit owner does not exist");
  }

  if (payer.type !== "Unit Owner") {
    throw new Error("Payments can only be recorded for unit owners");
  }

  const recorder = await prisma.user.findUnique({
    where: { user_id: String(recorded_by_id) },
  });

  if (!recorder) {
    throw new Error("Invalid recording user");
  }

  const parsed = Number(amount);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  const payment = await prisma.payment.create({
    data: {
      bill_id: Number(bill_id),
      paid_by_id: String(paid_by_id),
      recorded_by_id: String(recorded_by_id),
      amount: parsed,
    },
    include: {
      bill: {
        select: { bill_id: true, name: true, due_date: true, amount: true },
      },
      paidBy: {
        select: {
          user_id: true,
          name: true,
          email: true,
          unit_number: true,
          building: true,
        },
      },
      recordedBy: {
        select: { user_id: true, name: true, email: true },
      },
    },
  });

  return parsePayment(payment);
}

async function deletePayment(payment_id) {
  const payment = await findById(payment_id);

  if (!payment) {
    return null;
  }

  await prisma.payment.delete({
    where: { payment_id: Number(payment_id) },
  });

  return payment;
}

module.exports = {
  getAllPayments,
  createPayment,
  deletePayment,
  parsePayment,
};
