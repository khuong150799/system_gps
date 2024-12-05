const app = require("./src/app");
const os = require("os");
const http = require("http");
const cluster = require("cluster");
const configureEnvironment = require("./src/config/dotenv.config");
// const process = require("process");

const { PORT: PORT_ENV, NODE_ENV, DOMAIN_NAME } = configureEnvironment();
console.log("environment ::::", NODE_ENV);

const PORT = PORT_ENV || 3055;

function init() {
  if (cluster.isMaster) {
    let numCPUs = os.cpus().length;
    // console.log(" Num of CPU ", numCPUs);
    const condition = numCPUs > 4 ? 4 : numCPUs;
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
function startHttpServer() {
  process.on("message", function (msg) {
    console.log(msg);
  });
  const server = http.createServer(app).listen(PORT, () => {
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
