const mongoose = require('mongoose');

const { Schema } = mongoose;
mongoose.Promise = global.Promise;

const engineerSchema = new Schema({
  name: {
    type: String,
    unique: true,
    required: 'Please supply a name',
    trim: true
  },
  slackId: {
    type: String,
    unique: true,
    required: 'Please supply a slack ID',
    trim: true
  },
  discipline: {
    type: String,
    required: 'Please supply a discipline',
    trim: true
  },
  pod: {
    type: String,
    required: 'Please supply a pod',
    trim: true
  },
  // this is used to calculate who gets to be assigned to each release on rotation
  weight: {
    type: Number,
    required: 'Please supply a rotation weight',
    default: 0,
  },
});

module.exports = mongoose.model('Engineer', engineerSchema);
