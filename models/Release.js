// const releases = [
//   { name: '18.9.1', date: '09/01/18' },
//   { name: '18.9.2', date: '09/15/18' },
//   { name: '18.10.1', date: '10/01/18' },
// ];

// exports.getReleasesAsOptions = () => {
//   return releases.map(release => ({ text: release.name, value: release.name }));
// };

// exports.getReleases = () => releases;

const mongoose = require('mongoose');

const { Schema } = mongoose;
mongoose.Promise = global.Promise;

const releaseSchema = new Schema({
  name: {
    type: String,
    required: 'Please supply a name',
    trim: true
  },
  date: {
    type: Date,
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
