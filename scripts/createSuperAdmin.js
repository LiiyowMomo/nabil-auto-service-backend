// Script to create any user (superadmin or worker)
const mongoose = require("mongoose");
const User = require("../models/User");
require("dotenv").config();

async function createUser() {
  const [,, username, password, role] = process.argv;
  if (!username || !password || !role) {
    console.log("Usage: node scripts/createSuperAdmin.js <username> <password> <role>");
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  const exists = await User.findOne({ username });
  if (exists) {
    console.log(`User '${username}' already exists.`);
    process.exit(0);
  }
  const user = new User({ username, password, role });
  await user.save();
  console.log(`User '${username}' with role '${role}' created!`);
  process.exit(0);
}

createUser();
