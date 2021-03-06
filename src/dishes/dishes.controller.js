const { builtinModules } = require("module");
const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
function list(req, res) {
  res.json({ data: dishes });
}

function create(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({ status: 400, message: `Dish must include a ${propertyName}` });
  };
}

const hasName = bodyDataHas("name");
const hasDescription = bodyDataHas("description");
const hasPrice = bodyDataHas("price");
const hasImage_url = bodyDataHas("image_url");

function priceIsValid(req, res, next) {
  const { data: { price } = {} } = req.body;
  if (price <= 0 || !Number.isInteger(price)) {
    return next({
      status: 400,
      message: `Dish must have a price that is an integer greater than 0`,
    });
  }
  next();
}

function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);

  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish id not found ${dishId}`,
  });
}

function read(req, res) {
  res.json({ data: res.locals.dish });
}

function update(req, res) {
  const { id } = res.locals.dish;
  Object.assign(res.locals.dish, req.body.data, { id });
  res.json({ data: res.locals.dish });

  // const dish = res.locals.dish;
  // const { data: { id, name, description, price, image_url } = {} } = req.body;

  // dish.id = id;
  // dish.name = name;
  // dish.description = description;
  // dish.price = price;
  // dish.image_url = image_url;

  // res.json({ data: dish });
}

function idValidator(req, res, next) {
  const { dishId } = req.params;
  const { data: { id } = {} } = req.body;
  const validId = id === dishId;

  if (validId || id === "" || id === null || id === undefined) {
    return next();
  }
  next({
    status: 400,
    message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
  });
}

module.exports = {
  list,
  create: [
    hasName,
    hasDescription,
    hasPrice,
    hasImage_url,
    priceIsValid,
    create,
  ],
  read: [dishExists, read],
  update: [
    dishExists,
    hasName,
    hasDescription,
    hasPrice,
    hasImage_url,
    priceIsValid,
    idValidator,
    update,
  ],
};
