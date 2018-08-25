// const engineers = [
//   { name: 'Willem Jager', discipline: 'Back End', pod: 'Consumer Tools', slackTag: 'willem.jager' },
//   { name: 'Raghav Vijendran', discipline: 'Back End', pod: 'Consumer Engagement' },
//   { name: 'Frank Chung', discipline: 'Back End', pod: 'Consumer Tools' },
//   { name: 'Jonathan Anstett', discipline: 'Back End', pod: 'Consumer Engagement' },
//   { name: 'Hai Phan', discipline: 'Front End', pod: 'Consumer Tools' },
//   { name: 'Renee Gallison', discipline: 'Front End', pod: 'Consumer Engagement' },
//   { name: 'Kirby Walls', discipline: 'Front End', pod: 'Consumer Tools' },
// ];

const mongoose = require('mongoose');

const { Schema } = mongoose;
mongoose.Promise = global.Promise;

const engineerSchema = new Schema({
  name: {
    type: String,
    required: 'Please supply a name',
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
  }
});

engineerSchema.virtual('releases', {
  ref: 'Release',
  localField: '_id',
  foreignField: 'engineers'
});

// populate engineer field on release schema
function autopopulate(next) {
  this.populate('releases');
  next();
}

// autopopulate engineer info whenever we search for a release
engineerSchema.pre('find', autopopulate);
engineerSchema.pre('findOne', autopopulate);

module.exports = mongoose.model('Engineer', engineerSchema);
