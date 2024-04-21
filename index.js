const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
require("./config");
const products = require("./product");
const app = express();
app.use(express.json());
app.post("/create", async (req, resp) => {
  let data = new products(req.body);
  let result = await data.save();
  console.log(req.body);
  resp.send(result);
});


app.get("/list", async (req, resp) => {
  let data = await products.find();
  resp.send(data);
});

app.get("/search/:key", async (req, resp) => {
  let data = await products.find({
    $or: [
      { name: { $regex: req.params.key } },
      { brand: { $regex: req.params.key } }
    ],
  });
  resp.send(data);
});

app.delete("/delete/:_id", async (req, resp) => {
  let data = await products.deleteOne(req.params);
  resp.send(data);
});

app.put("/update/:_id", async (req, resp) => {
  let data = await products.updateOne(req.params, {
    $set: req.body,
  });
  resp.send(data);
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads"); // Fix typo here
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now() + ".jpg"); // Fix concatenation
  }
});

const upload = multer({ storage: storage }).single("user_file"); // Move the storage configuration outside of the upload initialization

app.post("/upload", upload, async (req, res) => {
  try {
    // Create a new product instance with file details
    const newProduct = new products({
      name: req.body.name,
      brand: req.body.brand,
      // Assuming 'user_file' is the name attribute of the file input field
      file: {
        data: fs.readFileSync(path.join(__dirname + "/uploads/" + req.file.filename)),
        contentType: "image/jpg", // Change this according to your file type
      },
    });

    // Save the product to MongoDB
    const result = await newProduct.save();
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(5000);

