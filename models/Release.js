const mongoose = require('mongoose');

const { Schema } = mongoose;
mongoose.Promise = global.Promise;

const releaseSchema = new Schema({
  name: {
    type: String,
    unique: true,
    required: 'Please supply a name',
    trim: true
  },
  date: {
    type: Date,
    required: 'Please supply a date',
    default: Date.now
  }
});

releaseSchema.virtual('engineers', {
  ref: 'Engineer',
  localField: '_id',
  foreignField: 'releases'
});

// populate engineer field on release schema
function autopopulate(next) {
  this.populate('engineers');
  next();
}

// autopopulate engineer info whenever we search for a release
releaseSchema.pre('find', autopopulate);
releaseSchema.pre('findOne', autopopulate);

module.exports = mongoose.model('Release', releaseSchema);
