const express = require("express");
const router = express.Router();
const Property = require("../models/Property");
const Appointment = require("../models/Appointment");
const User = require("../models/User");
const auth = require("../middleware/auth");

router.get("/properties", async (req, res, next) => {
  try {
    const { city, minPrice, maxPrice, bedrooms } = req.query;
    const filter = {};
    if (city) filter.city = new RegExp(`^${city}$`, "i");
    if (bedrooms) filter.bedrooms = { $gte: Number(bedrooms) };
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    const properties = await Property.find(filter).sort({ listedAt: -1 });
    res.json(properties);
  } catch (err) {
    next(err);
  }
});

router.get("/properties/:id", async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ error: "Property not found" });
    res.json(property);
  } catch (err) {
    next(err);
  }
});

router.post("/properties", auth("owner"), async (req, res, next) => {
  try {
    const ownerUser = await User.findById(req.user.id);
    const payload = {
      ...req.body,
      owner: {
        name: ownerUser.name,
        email: ownerUser.email,
        phone: ownerUser.phone,
      },
      ownerUser: ownerUser._id,
    };
    const created = await Property.create(payload);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

router.get("/owner/properties", auth("owner"), async (req, res, next) => {
  try {
    const list = await Property.find({ ownerUser: req.user.id }).sort({
      createdAt: -1,
    });
    res.json(list);
  } catch (err) {
    next(err);
  }
});

router.post("/appointments", async (req, res, next) => {
  try {
    const { propertyId, name, email, phone, preferredDate, message } = req.body;
    if (!propertyId || !name || !email || !phone || !preferredDate) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const property = await Property.findById(propertyId);
    if (!property) return res.status(404).json({ error: "Invalid property" });

    const date = new Date(preferredDate);
    const now = new Date();
    if (isNaN(date.getTime()) || date < now) {
      return res
        .status(400)
        .json({ error: "Preferred date must be a valid future date/time" });
    }

    const buyerId =
      (req.headers.authorization &&
        (() => {
          try {
            const token = req.headers.authorization.startsWith("Bearer ")
              ? req.headers.authorization.slice(7)
              : null;
            if (!token) return null;
            const payload = require("jsonwebtoken").verify(
              token,
              process.env.JWT_SECRET || "dev_secret"
            );
            return payload.role === "buyer" ? payload.id : null;
          } catch {
            return null;
          }
        })()) ||
      null;

    const appt = new Appointment({
      property: property._id,
      buyer: buyerId,
      name,
      email,
      phone,
      preferredDate: date,
      message: message || "",
    });
    await appt.save();

    res.status(201).json({ message: "Appointment created", appointment: appt });
  } catch (err) {
    next(err);
  }
});

router.get("/appointments", async (req, res, next) => {
  try {
    const items = await Appointment.find()
      .populate("property")
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    next(err);
  }
});

router.get("/owner/appointments", auth("owner"), async (req, res, next) => {
  try {
    const props = await Property.find({ ownerUser: req.user.id }).select("_id");
    const ids = props.map((p) => p._id);
    const items = await Appointment.find({ property: { $in: ids } })
      .populate("property")
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    next(err);
  }
});

router.patch(
  "/owner/appointments/:id",
  auth("owner"),
  async (req, res, next) => {
    try {
      const { status } = req.body;
      if (!["pending", "confirmed", "cancelled"].includes(status))
        return res.status(400).json({ error: "Invalid status" });

      const appt = await Appointment.findById(req.params.id).populate(
        "property"
      );
      if (!appt) return res.status(404).json({ error: "Not found" });

      if (String(appt.property.ownerUser) !== String(req.user.id)) {
        return res.status(403).json({ error: "Forbidden" });
      }

      appt.status = status;
      await appt.save();
      res.json(appt);
    } catch (err) {
      next(err);
    }
  }
);

router.get("/buyer/appointments", auth("buyer"), async (req, res, next) => {
  try {
    const items = await Appointment.find({ buyer: req.user.id })
      .populate("property")
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    next(err);
  }
});

router.patch("/appointments/:id/cancel", auth(), async (req, res, next) => {
  try {
    const appt = await Appointment.findById(req.params.id).populate("property");
    if (!appt) return res.status(404).json({ error: "Not found" });

    const isBuyer =
      req.user.role === "buyer" &&
      String(appt.buyer || "") === String(req.user.id);
    const isOwner =
      req.user.role === "owner" &&
      String(appt.property.ownerUser) === String(req.user.id);
    if (!isBuyer && !isOwner)
      return res.status(403).json({ error: "Forbidden" });

    appt.status = "cancelled";
    await appt.save();

    res.json(appt);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
