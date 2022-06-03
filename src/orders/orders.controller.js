const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

const statusesValidator = ["pending", "preparing", "out-for-delivery", "delivered"]

// TODO: Implement the /orders handlers needed to make the tests pass
function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const value = req.body.data[propertyName];
    if(value) {
      return next();
    }
    next({ status: 400, message: `Order must include a ${propertyName}` });
  };
}

const hasDeliver = bodyDataHas("deliverTo");
const hasMobileNumber = bodyDataHas("mobileNumber");

function hasValidStatus(req, res, next) {
  const { data = {} } = req.body;
  const status = data.status;
  if(statusesValidator.includes(status)) {
    return next();
  }
  next({
    status: 400,
    message: `Order must have a status of ${statusesValidator}`,
  })
}

function hasDishes(req, res, next) {
  const { data = {} } = req.body;
  const dishes = data.dishes;

  if(dishes && Array.isArray(dishes) && dishes.length) {
    next();
  }
  next({ status: 400, message: "Order must include at least one dish"});
}

function hasQuantity(req, res, next) {
  const { data = {} } = req.body;
  const message = data.dishes
    .map((dish, index) => 
      dish.quantity && Number.isInteger(dish.quantity)
      ? null
      : `Dish ${index} must have a quantity that is an integer greater than 0`
    )
    .filter((errorInfo) => errorInfo !== null)
    .join(",")

  if(message) {
    return next({ status: 400, message})
  }
  next();
}

function idValidator(req, res, next) {
  const dishId = req.params.orderId;
  const { orderId } = req.params;
  const { id } = req.body.data;

  if (!id || id === dishId) {
    return next();
  }
  next({
    status: 400,
    message: `Order id does not match route id. Order: ${id}, Route: ${dishId}`,
  });
}

function create(req, res) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status,
    dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function destroy(req, res) {
  const index = orders.findIndex((order) => order.id === res.locals.orderId);
  orders.splice(index, 1);
  res.sendStatus(204);
}

function list(req, res) {
  res.json({ data: orders });
}

function read(req, res) {
  res.json({ data: res.locals.order });
}

function verifyOrderStatus(req, res, next) {
  // const { data: { status } = {} } = req.body;
  if (res.locals.order.status === "delivered") {
    return next({
      status: 400,
      message: "A delivered order cannot be changed",
    });
  }
  next();
}

function orderIsPending(req, res, next) {
  const { data: { status } = {} } = req.body;
  if (res.locals.order.status === "pending") {
    return next();
  }
  return next({
    status: 400,
    message: "An order cannot be deleted unless it is pending",
  });
}

function verifyDish(req, res, next) {
  const { data: { dishes } } = req.body;
  if(dishes && Array.isArray(dishes) && dishes.length) {
    next();
  }
  next({ status: 400, message: "Order must include at least one dish"});
}

function orderExists(req, res, next) {
  const orderId = req.params.orderId;
  const foundOrder = orders.find((order) => order.id == orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({ status: 404, message: `Order does not exist: ${req.params.orderId}` });
}

function update(req, res) {
  const { id } = res.locals.order;
  Object.assign(res.locals.order, req.body.data, {id});
  res.json({ data: res.locals.order });
}

module.exports = {
  create: [
    hasDeliver,
    hasMobileNumber,
    hasDishes,
    hasQuantity,
    create,
  ],
  delete: [orderExists, orderIsPending, destroy],
  list,
  read: [orderExists, read],
  update: [
    orderExists,
    hasDeliver,
    hasMobileNumber,
    hasDishes,
    hasValidStatus,
    // verifyOrderStatus,
    // verifyDish,
    idValidator,
    hasQuantity,
    update,
  ],
};
