import mongoose from "mongoose";
import slugify from "slugify";

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  slug: {
    unique: true,
    type: String,
  },

  description: {
    type: String,
    required: true,
  },
  
  price: {
    type: Number,
    required: true,
  },
  
  image: {
    type: Array,
  },
  
  category: {
    type: String,
    required: true,
    enum: ['Herbs & Spices', 'Essential Oils', 'Natural Skincare', 'Organic Food', 'Wellness Products', 'Home & Garden']
  },
  
  subCategory: {
    type: String,
  },
  
  sizes: {
    type: Array,
  },
  
  bestseller: {
    type: Boolean,
    default: false,
  },
  
  stock: {
    type: Number,
    required: true,
    default: 0,
  },
  
  organic: {
    type: Boolean,
    default: true,
  },
  
  date: {
    type: Number,
    default: Date.now,
  },
});

productSchema.pre("save", async function (next) {
  if (this.name && !this.slug) {
    this.slug = slugify(this.name.toLowerCase(), { strict: true });
  }
  next();
});

const productModel =
  mongoose.models.product || mongoose.model("product", productSchema);

export default productModel;
