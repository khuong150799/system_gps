const os = require("os");
const http = require("http");
const cluster = require("cluster");

const envService = require("./src/services/env.service");
const { initRedis } = require("./src/dbs/init.redis");

function init() {
  if (cluster.isMaster) {
    let numCPUs = os.cpus().length;
    // console.log(" Num of CPU ", numCPUs);
    const condition = numCPUs > 2 ? 2 : numCPUs;
    for (let idx = 0; idx < condition; idx++) {
      cluster.fork();
      // let worker = cluster.fork();
      // worker.on("message", function (msg) {
      //   console.log("Worker " + msg.worker + " served a " + msg.cmd);
      //   worker.send("Good work!");
      // });
    }
    cluster.on("exit", (worker, code, signal) => {
      console.log(`Worker ${worker.process.pid} died`);
      // auto restart worker when worker fail
      cluster.fork();
    });
  } else {
    startHttpServer();
  }
}
// start server nodejs
// const task = require("./src/tasks/issure.task");
async function startHttpServer() {
  const server = http.createServer();

  await initRedis();
  const nodeEnv = process.env.NODE_ENV || "local";
  await envService.init(nodeEnv);

  const configureEnvironment = require("./src/config/dotenv.config");
  const { PORT: PORT_ENV, DOMAIN_NAME } = configureEnvironment();
  console.log("environment ::::", nodeEnv);

  const PORT = PORT_ENV || 3055;

  // process.on("message", function (msg) {
  //   console.log(msg);
  // });

  const app = require("./src/app");
  server.on("request", app);

  server.listen(PORT, () => {
    console.log(`Domain server :::: ${DOMAIN_NAME}:${PORT}`);
  });

  process.on("SIGINT", () => {
    // task.checkOverload().stop();
    server.close(() => console.log("Exit server express"));
    process.exit();

    // notify send (ping....)
  });
}

init();
