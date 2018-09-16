const mongoose = require('mongoose');

const { Schema } = mongoose;
mongoose.Promise = global.Promise;

const reminderSchema = new Schema({
  slackId: {
    type: String,
    unique: true,
    required: 'Please supply a slack ID',
    trim: true
  },
  engineer: {
    type: Schema.ObjectId,
    ref: 'Engineer',
    required: 'Please supply an engineer',
  },
  time: {
    type: Date,
    required: 'Please supply a time',
    default: Date.now
  },
});

module.exports = mongoose.model('Reminder', reminderSchema);
