import { v2 as cloudinary } from "cloudinary";
import productModel from "../models/productModel.js";
import mongoose from "mongoose";
import slugify from "slugify";

export const addProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      subCategory,
      sizes,
      bestseller,
      stock,
      organic,
    } = req.body;

    console.log("Received product data:", {
      name,
      description,
      price,
      category,
      subCategory,
      sizes,
      bestseller,
      stock,
      organic,
    });

    if (!name || !description || !category) {
      return res.status(400).json({
        success: false,
        message: "Name, description, and category are required",
      });
    }

    const image1 = req.files?.image1?.[0];
    const image2 = req.files?.image2?.[0];
    const image3 = req.files?.image3?.[0];
    const image4 = req.files?.image4?.[0];
    const images = [image1, image2, image3, image4].filter(Boolean);

    const imagesUrl = await Promise.all(
      images.map(async (item) => {
        const result = await cloudinary.uploader.upload(item.path, {
          resource_type: "image",
        });
        return result.secure_url;
      })
    );

    const productData = {
      name,
      slug: slugify(name.toLowerCase(), { strict: true }),
      description,
      category,
      price: isNaN(Number(price)) ? 0 : Number(price),
      subCategory,
      bestseller: bestseller === "true",
      sizes: sizes ? JSON.parse(sizes) : [],
      image: imagesUrl,
      stock: isNaN(Number(stock)) ? 0 : Number(stock),
      organic: organic === "true" || organic === true,
      date: Date.now(),
    };

    console.log("Creating product with data:", productData);

    const product = new productModel(productData);
    await product.save();

    res.json({
      success: true,
      message: "Product Added Successfully",
      product,
    });
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAProductBySlug = async (req, res) => {
  try {
    const product = await productModel.findOne({ slug: req.params.slug });
    if (!product) {
      return res.status(404).json({
        status: false,
        message: "Product not found",
      });
    }
    res.status(200).json({ status: true, product });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "An error occurred while fetching the product",
    });
  }
};

export const listProducts = async (req, res) => {
  try {
    const { category, search, sort } = req.query;
    let query = {};
    
    // Filter by category
    if (category) {
      query.category = category;
    }
    
    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }
    
    let productsQuery = productModel.find(query);
    
    // Sorting
    if (sort === 'price-low') {
      productsQuery = productsQuery.sort({ price: 1 });
    } else if (sort === 'price-high') {
      productsQuery = productsQuery.sort({ price: -1 });
    } else if (sort === 'newest') {
      productsQuery = productsQuery.sort({ date: -1 });
    } else {
      productsQuery = productsQuery.sort({ date: -1 }); // Default sort
    }
    
    const products = await productsQuery;
    
    if (products.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No products found" });
    }
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeProduct = async (req, res) => {
  try {
    const { id } = req.body;
    const product = await productModel.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    await productModel.findByIdAndDelete(id);
    res.json({ success: true, message: "Product removed successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const singleProduct = async (req, res) => {
  try {
    const { productId } = req.body;
    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    // Find the product first to check if it exists
    const existingProduct = await productModel.findById(productId);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Handle image uploads if any
    const image1 = req.files?.image1?.[0];
    const image2 = req.files?.image2?.[0];
    const image3 = req.files?.image3?.[0];
    const image4 = req.files?.image4?.[0];
    const newImages = [image1, image2, image3, image4].filter(Boolean);

    if (newImages.length > 0) {
      const imagesUrl = await Promise.all(
        newImages.map(async (item) => {
          const result = await cloudinary.uploader.upload(item.path, {
            resource_type: "image",
          });
          return result.secure_url;
        })
      );
      updateData.image = imagesUrl;
    }

    // Update slug if name is being updated
    if (updateData.name) {
      updateData.slug = slugify(updateData.name.toLowerCase(), {
        strict: true,
      });
    }

    const product = await productModel.findByIdAndUpdate(
      productId,
      updateData,
      { new: true }
    );

    res.json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCategories = async (req, res) => {
  try {
    const categories = await productModel.distinct('category');
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBestsellers = async (req, res) => {
  try {
    const bestsellers = await productModel.find({ bestseller: true }).limit(8);
    res.json({ success: true, bestsellers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
