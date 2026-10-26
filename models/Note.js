const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      default: '',
    },
    author: {
      type: String,
      default: 'Anonymous',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Note', noteSchema);