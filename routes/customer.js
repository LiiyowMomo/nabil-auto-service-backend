// // const express = require("express");
// // const router = express.Router();
// // const Contact = require("../models/Contact");

// // router.post("/", async (req, res) => {
// //   try {
// //     const newContact = new Contact(req.body);
// //     await newContact.save();
// //     res.status(201).json({ message: "Contact request saved." });
// //   } catch (error) {
// //     res.status(500).json({ error: "Something went wrong." });
// //   }
// // });

// // module.exports = router;

// // const express = require("express");
// // const router = express.Router();
// // const Contact = require("../models/Contact");

// // router.post("/", async (req, res) => {
// //   try {
// //     console.log("📥 Received form submission:", req.body); // ✅ Add this log

// //     const newContact = new Contact(req.body);
// //     await newContact.save();

// //     console.log("✅ Saved to MongoDB"); // ✅ Optional: confirmation log

// //     res.status(201).json({ message: "Contact request saved." });
// //   } catch (error) {
// //     console.error("❌ Error saving contact:", error); // ✅ Log any errors
// //     res.status(500).json({ error: "Something went wrong." });
// //   }
// // });

// // // module.exports = router;
// // const express = require('express');
// // const router = express.Router();
// // const Contact = require('../models/Customer');
// // const Counter = require('../models/Counter');

// // // POST /api/contacts
// // // router.post('/', async (req, res) => {
// //   try {
// //     // Increment customerID counter
// //     const counter = await Counter.findByIdAndUpdate(
// //       { _id: 'customerID' },
// //       { $inc: { seq: 1 } },
// //       { new: true, upsert: true }
// //     );

// //     // Create new contact with the incremented customerID
// //     const newContact = new Contact({
// //       ...req.body,
// //       customerID: counter.seq
// //     });

// //     const savedContact = await newContact.save();
// //     res.status(201).json(savedContact);
// //   } catch (err) {
// //     console.error('Error saving contact:', err);
// //     res.status(500).json({ error: 'Failed to save contact' });
// //   }
// // });

// // module.exports = router;

// const express = require('express');
// const router = express.Router();
// const Customer = require('../models/Customer'); // Import the Customer model
// const Counter = require('../models/Counter');   // Import the Counter model

// router.post('/', async (req, res) => {
//   try {
//     // Increment customerID counter using updateOne
//     const counter = await Counter.updateOne(
//       { _id: 'customerID' }, // Find the document with _id 'customerID'
//       { $inc: { seq: 1 } },   // Increment the `seq` field by 1
//       { upsert: true }        // If document doesn't exist, create it
//     );

//     // Create new customer with the incremented customerID
//     const newCustomer = new Customer({
//       ...req.body,               // Get the form data (name, phone, etc.)
//       customerID: counter.seq    // Add the customerID (updated seq value)
//     });

//     // Save the new customer to the database
//     const savedCustomer = await newCustomer.save();

//     // Return the saved customer in the response
//     res.status(201).json(savedCustomer);
//   } catch (err) {
//     // Log the error and send a 500 status code with error message
//     console.error('Error saving customer:', err);
//     res.status(500).json({ error: 'Failed to save customer' });
//   }
// });

// module.exports = router;  // Export the router

const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Counter = require('../models/Counter');

router.post('/', async (req, res) => {
  try {
    // Find and increment customerID counter
    const counter = await Counter.findOneAndUpdate(
      { _id: 'customerID' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    // Use the incremented customerID from the counter
    const newCustomer = new Customer({
      ...req.body,
      customerID: counter.seq
    });

    const savedCustomer = await newCustomer.save();
    res.status(201).json(savedCustomer);
  } catch (err) {
    console.error('Error saving customer:', err);
    res.status(500).json({ error: 'Failed to save customer' });
  }
});

module.exports = router;
