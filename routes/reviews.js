const express = require("express");
const router = express.Router({ mergeParams: true });
const catchAsync = require("../utils/catchAsync");
const { validateReview, isReviewAuthor, isLoggedIn } = require("../middleware");
const reviews = require("../controllers/reviews");

//Review Post
router.post("/", isLoggedIn, validateReview, catchAsync(reviews.createReview));
//delete review
router.delete(
  "/:reviewId",
  isLoggedIn,
  isReviewAuthor,
  catchAsync(reviews.deleteReview)
);
module.exports = router;
