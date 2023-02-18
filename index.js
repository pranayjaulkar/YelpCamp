if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate");
const methodOverride = require("method-override");
const campgroundRoutes = require("./routes/campgrounds");
const reviewRoutes = require("./routes/reviews");
const userRoutes = require("./routes/users");
const ExpressError = require("./utils/ExpressError");
const dbURL = process.env.dbURL || "mongodb://127.0.0.1:27017/yelp-camp";
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const MongoStore = require("connect-mongo");
const secret = process.env.SECRET || "thisisthesecretkey";
const store = MongoStore.create({
  mongoUrl: dbURL,
  secret,
  touchAfter: 24 * 60 * 60,
});
store.on("error", function (e) {
  console.log("SESSION STORE ERROR", e);
});
const sessionConfig = {
  store,
  name: "session",
  secret,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    // secure:true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};
const User = require("./models/user");
const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");
const scriptSrcUrls = ["https://api.mapbox.com", "https://cdn.jsdelivr.net"];
const styleSrcUrls = ["https://cdn.jsdelivr.net", "https://api.mapbox.com/"];
const imgSrcUrls = [
  "https://res.cloudinary.com/dphpgb4hg/",
  "https://images.unsplash.com",
];
const connectSrcUrls = ["https://api.mapbox.com/", "https://events.mapbox.com"];

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(session(sessionConfig));
app.use(flash());
app.use(mongoSanitize());
app.use(helmet({ crossOriginResourcePolicy: { policy: "same-site" } }));
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: [],
      connectSrc: ["'self'"],
      scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
      workerSrc: ["'self'", "blob:"],
      objectSrc: [],
      imgSrc: ["'self'", "blob:", "data:", ...imgSrcUrls],
      fontSrc: ["'self'"],
      connectSrc: ["'self'", ...connectSrcUrls],
    },
  })
);
app.use(helmet.crossOriginEmbedderPolicy({ policy: "credentialless" }));
app.use(passport.initialize());
app.use(passport.session());
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.err = req.flash("error");
  res.locals.currentUser = req.user;
  next();
});
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/reviews", reviewRoutes);
app.use("/users", userRoutes);
app.use(express.static(path.join(__dirname, "public")));

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//-----------MONGOOSE CONNECTION--------------------
//"mongodb://127.0.0.1:27017/yelp-camp"
mongoose.connect(dbURL, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Database connected");
});
//------------------ROUTES------------------------
//Home
app.get("/", (req, res) => {
  res.render("home");
});
//404 Error Page Not Found
app.all("*", (req, res, next) => {
  next(new ExpressError("Page Not Found", 404));
});
//Error Handler
app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.message = "Oh No, Something Went Wrong!";
  res.status(statusCode).render("error", { err });
});
const PORT = process.env.PORT;
app.listen(`0.0.0.0:${PORT}`, () => {
  console.log(`Serving on port ${PORT}`);
});
