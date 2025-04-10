const express = require("express");
const app = express();
const path = require("path");
const session = require("express-session");
const { getOrders, exportToCSV, exportToXLS } = require("./utils/woo");

require("dotenv").config();




app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(session({
  secret: "theflexx-secret",
  resave: false,
  saveUninitialized: true
}));

// Middleware login
app.use((req, res, next) => {
  const openRoutes = ["/login"];
  if (!req.session.loggedIn && !openRoutes.includes(req.path)) {
    return res.redirect("/login");
  }
  next();
});

app.get("/login", (req, res) => {
  res.render("login", { error: null });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (
    username === process.env.ADMIN_USER &&
    password === process.env.ADMIN_PASS
  ) {
    req.session.loggedIn = true;
    return res.redirect("/dashboard");
  } else {
    return res.render("login", { error: "Credenziali errate" });
  }
});

// ✅ ROTTA DASHBOARD (vuota inizialmente)
app.get("/dashboard", (req, res) => {
  const { from, to } = req.query;

  if (!from || !to) {
    return res.render("dashboard", { orders: [], from: "", to: "" });
  }

  getOrders(from, to)
    .then(orders => {
      res.render("dashboard", { orders, from, to });
    })
    .catch(err => {
      console.error("Errore nel caricamento ordini:", err.message);
      res.status(500).send("Errore nel caricamento degli ordini.");
    });
});

// ✅ EXPORT CSV/XLS
app.get("/export-csv", async (req, res) => {
  const { from, to } = req.query;
  const orders = await getOrders(from, to);
  const filePath = exportToCSV(orders);
  res.download(filePath);
});

app.get("/export-xls", async (req, res) => {
  const { from, to } = req.query;
  const orders = await getOrders(from, to);
  const filePath = exportToXLS(orders);
  res.download(filePath);
});

app.get("/", (req, res) => {
  res.redirect("/login");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 App in ascolto su http://localhost:${port}`);
});