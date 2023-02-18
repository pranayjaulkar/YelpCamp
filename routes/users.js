const express = require("express");
const catchAsync = require("../utils/catchAsync");
const router = express.Router();
const passport = require("passport");
const users = require("../controllers/users");

//register form
router
  .route("/register")
  .get(users.renderRegister)
  .post(catchAsync(users.registerUser));

//Login Form
router
  .route("/login")
  .get(users.renderLogin)
  .post(
    passport.authenticate("local", {
      failureFlash: true,
      failureRedirect: "/login",
      keepSessionInfo: true,
    }),
    users.loginUser
  );

//Logout
router.get("/logout", users.logoutUser);

module.exports = router;
