const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http, {
  cors: {
    origin: "*",
  },
});

app.set("view engine", "ejs");
app.engine("ejs", require("ejs").__express);

app.use(
  express.urlencoded({
    extended: false,
    limit: "150mb",
  })
);
app.use(express.static(__dirname + "/public"));
app.use("/xterm.css", express.static(require.resolve("xterm/css/xterm.css")));
app.use("/xterm.js", express.static(require.resolve("xterm")));
app.use(
  "/xterm-addon-fit.js",
  express.static(require.resolve("xterm-addon-fit"))
);

const SSHClient = require("ssh2").Client;

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
  //   res.render('./index');
  // I am using ejs as my templating engine but HTML file work just fine.
});

const local = {
  host: "192.168.1.5",
  port: 22,
  username: "Surya",
  password: `101020`,
};

const aws = {
  host: "100.21.24.56",
  port: 22,
  username: "administrator",
  password: `aps@123`,
};

io.on("connection", function (socket) {
  var conn = new SSHClient();
  conn
    .on("ready", function () {
      socket.emit("data", "\r\n*** SSH CONNECTION ESTABLISHED ***\r\n");
      conn.shell(function (err, stream) {
        if (err)
          return socket.emit(
            "data",
            "\r\n*** SSH SHELL ERROR: " + err.message + " ***\r\n"
          );
        socket.on("data", function (data) {
          stream.write(data);
        });
        stream
          .on("data", function (d) {
            // console.log(d, '\n', d.toString("binary"), d.toString("binary").split('>').pop());
            socket.emit("data", d.toString("binary"));
          })
          .on("close", function () {
            conn.end();
          });
      });
    })
    .on("close", function () {
      socket.emit("data", "\r\n*** SSH CONNECTION CLOSED ***\r\n");
    })
    .on("error", function (err) {
      socket.emit(
        "data",
        "\r\n*** SSH CONNECTION ERROR: " + err.message + " ***\r\n"
      );
    })
    .connect(aws);
});

http.listen(1000, () => {
  console.log("Listening on http://localhost:1000");
});
