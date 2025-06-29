const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');

// Update job status for a customer
router.patch('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { jobStatus } = req.body;
  try {
    const updated = await Customer.findByIdAndUpdate(
      id,
      { jobStatus },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ error: 'Customer not found' });
    res.json(updated);
  } catch (err) {
    console.error('Error updating job status:', err);
    res.status(500).json({ error: 'Failed to update job status' });
  }
});

module.exports = router;
