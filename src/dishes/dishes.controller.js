const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

function hasNameProperty(req, res, next) {
  const { data: { name } = {} } = req.body;
  if (name) next();

  next({
    status: 400,
    message: `A 'name' property is required.`,
  });
}

function hasDescriptionProperty(req, res, next) {
  const { data: { description } = {} } = req.body;
  if (description) next();

  next({
    status: 400,
    message: `A 'description' property is required.`,
  });
}

function hasPriceProperty(req, res, next) {
  const { data: { price } = {} } = req.body;

  if (typeof price !== "number") {
    return next({
      status: 400,
      message: `'price' property needs to be a number`,
    });
  } else if (!price || price === "") {
    return next({
      status: 400,
      message: `A 'price' property is required.`,
    });
  } else if (price <= 0) {
    return next({
      status: 400,
      message: `'price' property needs to be greater than 0.`,
    });
  }
  next();
}

function hasImageProperty(req, res, next) {
  const { data: { image_url } = {} } = req.body;
  if (image_url) next();

  next({
    status: 400,
    message: `An 'image_url' property is required.`,
  });
}

function create(req, res, next) {
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

function dishIdExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dishId = dishId;
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish id not found: ${dishId}`,
  });
}

function read(req, res, next) {
  res.json({ data: res.locals.dish });
}

function update(req, res, next) {
  const {
    data: { id, name = "", description = "", price = "", image_url = "" } = {},
  } = req.body;
  const dish = res.locals.dish;
  const originalId = res.locals.dishId;

  if (!id || id === "" || originalId === id) {
    dish.name = name;
    dish.description = description;
    dish.price = price;
    dish.image_url = image_url;
  } else if (res.locals.dishId !== id) {
    return next({
      status: 400,
      message: `id does not match dishId: ${id}`,
    });
  }

  res.json({ data: dish });
}

function list(req, res) {
  res.json({ data: dishes });
}

module.exports = {
  create: [
    hasNameProperty,
    hasDescriptionProperty,
    hasPriceProperty,
    hasImageProperty,
    create,
  ],
  read: [dishIdExists, read],
  update: [
    dishIdExists,
    hasNameProperty,
    hasDescriptionProperty,
    hasPriceProperty,
    hasImageProperty,
    update,
  ],
  list,
};

/*
create,
read,
update,
list
*/
