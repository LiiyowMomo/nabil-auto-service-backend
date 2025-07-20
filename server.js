const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const customerRoutes = require('./routes/customer');  
const AuthRoutes = require('./routes/Authentication'); // Assuming you have an Authentication route
const jobRoutes = require('./routes/job'); // Assuming you have a job route
const waitTimeRoutes = require('./routes/waitTime');

dotenv.config({ path: __dirname + '/.env' });
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/customers", customerRoutes);
app.use("/auth/api", AuthRoutes); // Authentication routes
app.use("/api/jobs", jobRoutes); // Job routes
app.use("/api/waittime", waitTimeRoutes); // Wait time estimation routes

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log("MongoDB connected");
  const PORT = process.env.PORT || 5001; // fallback to 5001 if 5000 is in use
  app.listen(PORT, () =>
    console.log(`Server running on port ${PORT}`)
  );
}).catch(err => console.error(err));
