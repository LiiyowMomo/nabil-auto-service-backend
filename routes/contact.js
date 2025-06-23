// const express = require("express");
// const router = express.Router();
// const Contact = require("../models/Contact");

// router.post("/", async (req, res) => {
//   try {
//     const newContact = new Contact(req.body);
//     await newContact.save();
//     res.status(201).json({ message: "Contact request saved." });
//   } catch (error) {
//     res.status(500).json({ error: "Something went wrong." });
//   }
// });

// module.exports = router;

const express = require("express");
const router = express.Router();
const Contact = require("../models/Contact");

router.post("/", async (req, res) => {
  try {
    console.log("📥 Received form submission:", req.body); // ✅ Add this log

    const newContact = new Contact(req.body);
    await newContact.save();

    console.log("✅ Saved to MongoDB"); // ✅ Optional: confirmation log

    res.status(201).json({ message: "Contact request saved." });
  } catch (error) {
    console.error("❌ Error saving contact:", error); // ✅ Log any errors
    res.status(500).json({ error: "Something went wrong." });
  }
});

module.exports = router;
