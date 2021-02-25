const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

const validStatus = ["pending", "preparing", "out-for-delivery", "delivered"];

function checkIfPending(req, res, next) {

  if (res.locals.order.status !== "pending") {
    return next({
      status: 400,
      message: `Can only delete 'pending' orders. Received: '${res.locals.order.status}'.`,
    });
  }
  next();
}

function destroy(req, res) {
  const { orderId } = req.params;
  const index = orders.findIndex((order) => order.id === orderId);
  const deleteOrder = orders.splice(index, 1);
  res.sendStatus(204);
}

function checkOrderStatus(req, res, next) {
  const { data: { status } = {} } = req.body;
  if (status === "delivered") {
    return next({ status: 400, message: `Cannot update 'delivered' orders` });
  }

  if (validStatus.includes(status)) next();
  next({
    status: 400,
    message: `Value of the 'status' property must be one of ${validStatus.join(
      ", "
    )}. Received: ${status}`,
  });
}

function update(req, res, next) {
  const {
    data: { id, deliverTo = "", mobileNumber = "", dishes = [] } = {},
  } = req.body;
  const order = res.locals.order;
  const originalId = res.locals.orderId;

  if (!id || id === "" || originalId === id) {
    order.deliverTo = deliverTo;
    order.mobileNumber = mobileNumber;
    order.dishes = dishes;
  } else if (originalId !== id) {
    return next({
      status: 400,
      message: ` 'id' does not match orderId: ${id}`,
    });
  }
  res.json({ data: order });
}

function orderIdExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    res.locals.orderId = orderId;
    return next();
  }
  next({
    status: 404,
    message: `Order id not found: ${orderId}`,
  });
}

function read(req, res, next) {
  res.json({ data: res.locals.order });
}

function hasDeliverToProperty(req, res, next) {
  const { data: { deliverTo } = {} } = req.body;
  if (deliverTo) next();

  next({
    status: 400,
    message: `A 'deliverTo' property is required.`,
  });
}
function hasMobileNumberProperty(req, res, next) {
  const { data: { mobileNumber } = {} } = req.body;
  if (mobileNumber) next();

  next({
    status: 400,
    message: `A 'mobileNumber' property is required.`,
  });
}

function hasDishesProperty(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  if (dishes && Array.isArray(dishes) && dishes.length > 0) next();
  next({
    status: 400,
    message: `A 'dishes' property is required.`,
  });
}

function checkForQuantityInDishesProperty(req, res, next) {
  const { dishes = [] } = req.body.data;
  let quantityExists = true;
  const holdInvalidQuantity = [];

  dishes.forEach((dish, index) => {
    if (
      !dish.quantity ||
      dish.quantity <= 0 ||
      typeof dish.quantity !== "number"
    ) {
      quantityExists = false;
      holdInvalidQuantity.push(index);
    }
  });

  if (quantityExists) next();
  next({
    status: 400,
    message: `Dish ${holdInvalidQuantity.join(
      ", "
    )} must have a quantity that is an integer greater than 0`,
  });
}

function create(req, res, next) {
  const newOrder = {
    id: nextId(),
    ...req.body.data,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function list(req, res) {
  res.json({ data: orders });
}

module.exports = {
  list,
  create: [
    hasDeliverToProperty,
    hasMobileNumberProperty,
    hasDishesProperty,
    checkForQuantityInDishesProperty,
    create,
  ],
  read: [orderIdExists, read],
  update: [
    orderIdExists,
    checkOrderStatus,
    hasDeliverToProperty,
    hasMobileNumberProperty,
    hasDishesProperty,
    checkForQuantityInDishesProperty,
    update,
  ],
  delete: [orderIdExists, checkIfPending, destroy],
};
