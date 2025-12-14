// src/routes/productRoutes.js
const express = require("express");
const Products = require("../models/Products");
const validateVendor = require("../services/userService");
const { default: mongoose } = require("mongoose");

const router = express.Router();
// Add a Product
router.post("/add", async (req, res) => {
  try {
    await validateVendor(req.body.vendorId);  // check vendor role

    const product = await Products.create({
      name: req.body.name,
      description: req.body.description,
      category: req.body.category,
      vendorId: req.body.vendorId,
      amount: req.body.amount
    });

    return res.status(201).json({
      message: "Product added successfully",
      product
    });

  } catch (err) {
    console.log(err.message);
    return res.status(400).json({ message: err.message });
  }
});
// Get all Products
router.get("/all", async (req, res) => {
  try {
    const products = await Products.find();   // <-- await required

    if (products.length === 0) {
      return res.status(404).json({
        message: "Products cart is empty",
        products: []
      });
    }

    return res.status(200).json({
      message: "Success",
      products: products
    });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.get("/:id",async(req,res)=>{
  try{
    let productId = req.params.id;
    let product = await Products.findById(productId);
    if(!product)
    {
    return  res.status(404).json({message:"No Product Available"})
    }
    return res.status(200).json({
      message:"Success",
      product
    })
  }
  catch(err)
  {
    console.log(err);
    return res.status(500).json({message:"Server Error"})
  }
})

// Get all products of vendor
router.get("/all/:vendorId", async (req, res) => {
  try {
    const vendorId = req.params.vendorId.trim(); // 🔥 FIX

    if (!mongoose.Types.ObjectId.isValid(vendorId)) {
      return res.status(400).json({
        message: "Invalid vendorId",
        vendorId,
      });
    }

    const products = await Products.find({ vendorId });

    return res.status(200).json({
      message: "Success",
      products,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.put("/products/:id", async (req, res) => {
  const updated = await Products.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json({ message: "Updated", product: updated });
});


// Update a Product
router.put("/:id", async (req, res) => {
  try {

    let product = await Products.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        message: "No Such Product Found",

      })
    }
    let { id, name, description, category, amount } = req.body;
    let newProduct = {
      name: name,
      description: description,
      category: category,
      amount: amount,
      vendorId: product.vendorId
    }

    const updatedProduct = await Products.findByIdAndUpdate(
      req.params.id,
        newProduct,
      {
        new: true
      }
    )
    return res.status(200).json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  }
  catch (err) {
    console.log(err);
  }

})

// Delete a Product

router.delete("/products/:id", async (req, res) => {
  await Products.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});



module.exports = router;
