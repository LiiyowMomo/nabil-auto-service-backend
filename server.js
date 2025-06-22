const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const customerRoutes = require('./routes/Customer');  

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/customers", customerRoutes);

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log("MongoDB connected");
  const PORT = process.env.PORT || 5000; // fallback to 5001 if 5000 is in use
  app.listen(PORT, () =>
    console.log(`Server running on port ${PORT}`)
  );
}).catch(err => console.error(err));
