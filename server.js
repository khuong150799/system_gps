const express = require("express");
const app = express();
const cors = require("cors");

const path = require("path");
const helmet = require("helmet");
const compression = require("compression");
// const router = require("./app/routes");
const handleErrors = require("./app/middlewares/handleErrors");
const db = require("./app/models/db.model");

// require env
require("dotenv").config();
const port = process.env.PORT;
const base_url = process.env.BASE_URL;

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(compression({ level: 6, threshold: 100 * 1000 }));
app.use(cors({ origin: true, credentials: true })); // origin: true cho phép client truy cập.
// config uploads folder
app.use(express.static(path.join(__dirname, "uploads")));

// config sv non SSL
const http = require("http");

// body-parser config
const bodyParser = require("body-parser");
const route = require("./app/routes");
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

// app.use(express.json());
db.connect();

// import routes
route(app);
app.use(handleErrors);

// const server = https.createServer(options, app);
const server = http.createServer(app);
server.listen(port, () => {
  console.log(`app run at ${base_url}:${port}`);
});
