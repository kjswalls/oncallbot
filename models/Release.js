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

releaseSchema.virtual('primaryEngineers', {
  ref: 'Engineer',
  localField: '_id',
  foreignField: 'releasePrimary'
});

releaseSchema.virtual('backupEngineers', {
  ref: 'Engineer',
  localField: '_id',
  foreignField: 'releaseBackup'
});

// populate engineer fields on release schema
function autopopulate(next) {
  this.populate('primaryEngineers');
  this.populate('backupEngineers');
  next();
}

// autopopulate engineer info whenever we search for a release
releaseSchema.pre('find', autopopulate);
releaseSchema.pre('findOne', autopopulate);

module.exports = mongoose.model('Release', releaseSchema);
