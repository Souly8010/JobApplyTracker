const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  website: { type: String, required: true },
  employerName: { type: String, required: true },
  employerEmail: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  comment: { type: String, required: true },
  status: {
    type: String,
    enum: ["refusé", "accepté", "en attente"],
    default: "en attente",
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Job", jobSchema);
