const mongoose = require("mongoose")

const ProductSchema = new mongoose.Schema({
    name: { required: true, type: String },
    description: { required: false, type: String },
    category: { type: String },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true }

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }

});
ProductSchema.virtual("feedbacks", {
  ref: "Feedback",
  localField: "_id",           // Product _id
  foreignField: "productId"    // feedback.productId
});

module.exports = mongoose.model("Product", ProductSchema);
