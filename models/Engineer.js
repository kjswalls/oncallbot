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
