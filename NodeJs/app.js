var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
let heartbeatRouter = require("./routes/heartbeat");

var app = express();
const port = 3000;

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


module.exports = app;

app.listen(port, (req, res) => {
  console.log(`Server running, listening on port ${port}`);
})

