
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User"); 
require("dotenv").config(); 

const createAdmin = async () => {
  try {
    // 1. Connect to Database
    await mongoose.connect(process.env.MONGO_URI );
    console.log("Connected to DB...");

    // 2. Check if admin already exists
    const adminExists = await User.findOne({ email: "workspace10072005@gmail.com" });
    if (adminExists) {
      console.log("Admin user already exists!");
      process.exit();
    }

    // 3. Hash the hardcoded password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("9408440795", salt);

    // 4. Create the hardcoded Admin
    const adminUser = new User({
      name: "NeelAdmin",
      email: "workspace10072005@gmail.com",
      password: hashedPassword,
      role: "admin" 
    });

    await adminUser.save();
    console.log("🔥 Admin user created successfully!");
    
    // 5. Disconnect
    mongoose.disconnect();
    process.exit();

  } catch (error) {
    console.error("Error creating admin:", error);
    process.exit(1);
  }
};

createAdmin();