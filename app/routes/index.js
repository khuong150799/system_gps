const auth = require("../middlewares/jwt.middleware");
const locationRoute = require("./location");

function route(app) {
  app.use(auth.token);
  app.use("/api/location", locationRoute);
}

module.exports = route;
