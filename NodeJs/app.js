var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const bodyParser = require("body-parser");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
let heartbeatRouter = require("./routes/heartbeat");
let loginRouter = require("./routes/login");
let lockRouter = require("./routes/lock");
let mqtt = require("./service/mqtt_client");

const moment = require('moment-timezone');
moment.tz.setDefault('Europe/Copenhagen');

const mongoose = require("mongoose");

mqtt.connect("server");

var app = express();
app.use(bodyParser.json());
const port = 3000;

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
    return res.status(200).json({});
  }
  next();
});

// Connect to MongoDB database
mongoose.connect("mongodb://root:rootpassword@192.168.239.91:27017", {
  useNewUrlParser: true,
  useUnifiedTopology: true, // added this line
  dbName: "smart-door-lock",
  authMechanism: "DEFAULT"
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  console.log("Connected to MongoDB database");
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/heartbeat", heartbeatRouter);
app.use("/login", loginRouter);
app.use("/lock", lockRouter);

module.exports = app;

app.listen(port, (req, res) => {
  console.log(`Server running, listening on port ${port}`);
});
