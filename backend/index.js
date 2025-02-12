const port = 4000;
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");

app.use(express.json());
app.use(cors());

// Database connection with MongoDB
mongoose.connect("mongodb+srv://ecommerce:user123@cluster0.xie4ng7.mongodb.net/e-commerce", {
    serverSelectionTimeoutMS: 5000,  // Timeout after 5s instead of 30s
    socketTimeoutMS: 45000,  // Close sockets after 45 seconds of inactivity
})
.then(() => {
    console.log("Connected to MongoDB");
})
.catch((err) => {
    console.error("Error connecting to MongoDB", err);
});

// API creation
app.get("/", (req, res) => {
    res.send("Express app is running");
});

// Image storage engine
const storage = multer.diskStorage({
    destination: './upload/images',
    filename: (req, file, cb) => {
        return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage: storage });

// Creating upload endpoint for images
app.use('/images', express.static('upload/images'));

app.post("/upload", upload.single('product'), (req, res) => {
    res.json({
        success: 1,
        image_url: `http://localhost:${port}/images/${req.file.filename}`
    });
});

// Schema for creating products
const Product = mongoose.model("Product", {
    id: {
        type: Number,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    new_price: {
        type: Number,
        required: true,
    },
    old_price: {
        type: Number,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    available: {
        type: Boolean,
        default: true,
    },
});

app.post('/addproduct', async (req, res) => {
    let products = await Product.find({});
    let id;
    if (products.length>0) {
      let last_product_array = products.slice(-1);
      let last_product = last_product_array[0];
      id = last_product.id+1;
  }
  else
  { 
    id = 1; 
  }
    try {
        const product = new Product({
            id: id,
            name: req.body.name,
            image: req.body.image,
            category: req.body.category,
            new_price: req.body.new_price,
            old_price: req.body.old_price,
        });
        console.log(product);
        const savedProduct = await product.save();
        console.log("Saved");
        res.json({
            success: true,
            id: savedProduct.id,
            name: savedProduct.name,
            image: savedProduct.image,
            category: savedProduct.category,
            new_price: savedProduct.new_price,
            old_price: savedProduct.old_price,
            available: savedProduct.available,
            date: savedProduct.date,
        });
    } catch (error) {
        console.error("Error saving product", error);
        res.status(500).json({
            success: false,
            message: "Error saving product",
        });
    }
});

// creating api for deleting products

app.post('/removeproduct',async (req,res)=>{
    await Product.findOneAndDelete({id:req.body.id});
    console.log("Removed");
    res.json({
        success:true,
        name:req.body.name
    })
})



// creating API for getting all products
app.get('/allproducts',async(req,res)=>{
    let products = await Product.find({});
    console.log("all products fetched");
    res.send(products);
})

// schema for user model
const Users = mongoose.model('Users', {
    name: {
        type: String,
    },
    email: {
        type: String,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    cartData:{
        type:Object,
    },
    date:{
        type: Date,
        default: Date.now,
    }
})

// creating API for user registration
app.post('/signup',async (req,res)=>{
    let check = await Users.findOne({email:req.body.email});
    if(check){
        res.status(400).json({success:false,error:"existing user found with same email id"});
    } else {
        let cart = {};
        for(let i=0;i<300;i++){
            cart[i] = 0;
        }
        const user = new Users({
            name:req.body.username,
            email:req.body.email,
            password:req.body.password,
            cartData:cart,
        })

        await user.save();

        const data = {
            user:{
                id:user.id,
            }
        }

        const token = jwt.sign(data,'secret_ecom');
        res.json({success:true,token});
    }
})


// creating API for user login

app.post('/login',async (req,res)=>{
    let user = await Users.findOne({email:req.body.email});
    if(user){
        const passCompare = req.body.password === user.password;
        if(passCompare){
            const data = {
                user:{
                    id:user.id,
                }
            }
            const token = jwt.sign(data,'secret_ecom');
            res.json({success:true,token});
    }
    else{
        res.json({success:false,error:"Invalid Credentials"});
    }

}
else{
    res.json({success:false,error:"Wrong Email Id"});
}
})


// creating API for new-collection data
app.get("/newcollections", async (req, res) => {
  let products = await Product.find({});
  let newcollection = products.slice(1).slice(-8);
  console.log("New Collections");
  res.send(newcollection);
});


// creating API for popular women section
app.get('/popularinwomen',async(req,res)=>{
    let products = await Product.find({category:"women"});
    let popular_in_women = products.slice(0,4);
    console.log("fetched popular in women");
    res.send(popular_in_women);
})

// creating middlewear to fetch user
const fetchUser = async (req,res,next)=>{
    const token = req.header('auth-token');
    if(!token){
        res.status(401).send({errors:"please authenticate using valid token"})
    }
    else{
        try {
            const data = jwt.verify(token,'secret_ecom');
            req.user = data.user;
            next();
        } catch (error) {
            res.status(401).send({errors:"please authenticate using a valid token"})
        }
    }
}



// creating api for adding products in cartdata
app.post('/addtocart',fetchUser,async(req,res)=>{
    console.log("added",req.body.itemId);
    let userData = await Users.findOne({_id:req.user.id});
    userData.cartData[req.body.itemId] += 1;
    await Users.findOneAndUpdate({_id:req.user.id},{cartData:userData.cartData})
    res.send("Added")
})



// creating api for removing products in cartdata
app.post('/removefromcart',fetchUser,async(req,res)=>{
    console.log("removed",req.body.itemId);
    let userData = await Users.findOne({_id:req.user.id});
    if(userData.cartData[req.body.itemId]>0)
    userData.cartData[req.body.itemId] -= 1;
    await Users.findOneAndUpdate({_id:req.user.id},{cartData:userData.cartData})
    res.send("Removed")
})





//creating API for retreving cart data stored previously
app.post('/getcart',fetchUser,async (req,res)=>{
    console.log("get cart");
    let userData = await Users.findOne({_id:req.user.id})
    res.json(userData.cartData);
})




app.listen(port, (error) => {
    if (!error) {
        console.log("Server Running on Port " + port);
    } else {
        console.log("Error in running server: " + error);
    }
});
