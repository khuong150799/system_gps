const express = require("express");
const app = express();
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const helmet = require("helmet");
const compression = require("compression");

app.use(morgan("dev"));
app.use(helmet());
app.use(
  helmet.frameguard({
    action: "deny",
  })
); //not a browser should be allowed to render a page in the <frame>, <iframe>, <embed> and <object> HTML elements.
app.use(
  compression({
    level: 6, // level compress
    threshold: 100 * 1024, // > 100kb threshold to compress
    filter: (req) => {
      return !req.headers["x-no-compress"];
    },
  })
);
app.use(cors({ origin: true, credentials: true })); // origin: true cho phép client truy cập.
// config uploads folder
app.use(express.static(path.join(__dirname, "uploads")));

// body-parser config
const bodyParser = require("body-parser");
app.use(bodyParser.json({ limit: "10kb" }));
app.use(bodyParser.urlencoded({ limit: "10kb", extended: true }));

//init permission
// const { init } = require("./controllers/permission.controller");

// async function initPermission() {
//   try {
//     const data = await init();
//     console.log("data", data);
//   } catch (error) {
//     console.log("error", error);
//   }
// }
// initPermission();

//init db
const { initDb } = require("./dbs/init.mysql");
initDb();

//init redis
const { initRedis } = require("./dbs/init.redis");
initRedis();

// import routes
const route = require("./routes");
route(app);

//midleware handle error
const {
  is404Handler,
  logErrorMiddleware,
  returnError,
} = require("./middlewares/handleErrors.middleware");

app.use(is404Handler);
app.use(logErrorMiddleware);
app.use(returnError);

//init cron job
// const tasks = require("./tasks/issure.task");
// tasks.checkOverload().start();

module.exports = app;
