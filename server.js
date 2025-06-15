const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const contactRoutes = require("./routes/contact");

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/contact", contactRoutes);

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log("MongoDB connected");
  app.listen(process.env.PORT, () =>
    console.log(`Server running on port ${process.env.PORT}`)
  );
}).catch(err => console.error(err));
