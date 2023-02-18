const Campground = require("../models/campground");
const { cloudinary } = require("../cloudinaryConfig");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const { MAPBOX_TOKEN } = process.env;
const geocoder = mbxGeocoding({ accessToken: MAPBOX_TOKEN });

module.exports.index = async (req, res) => {
  const campgrounds = await Campground.find({});
  res.render("campgrounds/index", { campgrounds });
};

module.exports.renderNewForm = (req, res) => {
  res.render("campgrounds/new");
};

module.exports.showCampground = async (req, res) => {
  const campground = await Campground.findById(req.params.id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("author");
  if (!campground) {
    req.flash("error", "Cannot find that campground!");
    return res.redirect("/campgrounds");
  }
  res.render("campgrounds/show", { campground });
};

module.exports.renderEditForm = async (req, res) => {
  const campground = await Campground.findById(req.params.id);
  if (!campground) {
    req.flash("error", "Cannot find that Campground.");
    return res.redirect("/campgrounds");
  }
  res.render("campgrounds/edit", { campground });
};

module.exports.createCampground = async (req, res, next) => {
  const geoData = await geocoder
    .forwardGeocode({
      query: req.body.campground.location,
      limit: 1,
    })
    .send();
  const campground = new Campground(req.body.campground);
  campground.geometry = geoData.body.features[0].geometry;
  console.log(campground);
  campground.images = req.files.map((f) => ({
    url: f.path,
    filename: f.filename,
  }));
  campground.author = req.user.id;
  await campground.save();
  req.flash("success", "Successfully made a Campground");
  res.redirect(`/campgrounds/${campground._id}`);
};
module.exports.updateCampground = async (req, res) => {
  const { id } = req.params;
  const { deleteImages } = req.body;
  const campground = await Campground.findByIdAndUpdate(
    id,
    req.body.campground
  );
  if (req.files) {
    const imgs = req.files.map((img) => ({
      url: img.path,
      filename: img.filename,
    }));
    campground.images.push(...imgs);
  }
  if (deleteImages) {
    for (let delFilename of deleteImages) {
      await cloudinary.uploader.destroy(delFilename);
    }
    for (i = 0; i < campground.images.length; i++) {
      for (j = 0; j < deleteImages.length; j++) {
        if (deleteImages[j].trim() === campground.images[i].filename.trim()) {
          campground.images.splice(i, 1);
        }
      }
    }
  }
  await campground.save();
  req.flash("success", "Successfully Updated Campground");
  res.redirect(`/campgrounds/${campground._id}`);
};
module.exports.deleteCampground = async (req, res) => {
  const { id } = req.params;
  await Campground.findByIdAndDelete(id);
  res.redirect("/campgrounds");
};
