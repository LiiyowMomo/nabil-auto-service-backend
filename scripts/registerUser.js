// Usage: node scripts/registerUser.js <username> <password> <role>
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

async function main() {
  const [,, username, password, role] = process.argv;
  if (!username || !password || !role) {
    console.log('Usage: node scripts/registerUser.js <username> <password> <role>');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);
  try {
    const user = new User({ username, password, role });
    await user.save();
    console.log(`User '${username}' with role '${role}' registered successfully.`);
  } catch (err) {
    console.error('Error registering user:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

main();
