/**
 * Flow:
 * Every time a new release is added, this module determines who should be assigned to it.
 * When a release is edited, the module updates assignments for upcoming releases accordingly.
 */

/**
 * Rules:
 * 1. Each release must have two front end and two back end engineers assigned (1 primary, 1 backup for each)
 * 2. Primary and backup engineers should be on different pods
 */

const mongoose = require('mongoose');
const utils = require('./utils');
const messages = require('./messages');
const engineers = require('../controllers/engineerController');
const releases = require('../controllers/releaseController');

const Release = mongoose.model('Release');
const Engineer = mongoose.model('Engineer');

exports.assignEngineers = async (release) => {
  // get release and all releases in the future after the release that was added or edited
  const releases = await Release
    .find({ date: { $gte: release.date }})
    .sort({ date: 1 });
  console.log('future: ', futureReleases);

  // get engineers
  const engineers = await Engineer
    .find({ $exists: true })
    .sort({ weight: 1 });
  const fes = engineers.filter(engineer => engineer.discipline === 'front_end');
  const bes = engineers.filter(engineer => engineer.discipline === 'back_end');

  // maintain hashes of engineer weights
  const feHash = new Map();
  fes.forEach((engineer) => {
    // if this key doesn't already exist
    if (!feHash.has(engineer.weight)) {
      // create it as an empty array
      feHash.set(engineer.weight, []);
    }
    feHash.get(engineer.weight).push(engineer.id);
  });

  const beHash = new Map();
  bes.forEach((engineer) => {
    // if this key doesn't already exist
    if (!beHash.has(engineer.weight)) {
      // create it as an empty array
      beHash.set(engineer.weight) = [];
    }
    beHash.get(engineer.weight).push(engineer.id);
  });

  // loop through each release
  releases.forEach((release) => {
    let feOnCall;
    let feBackup;
    let beOnCall;
    let beBackup;

    // get the FE with the lowest weight
    feOnCall = [];
    // look for second lowest weight from a different pod
    // look through BEs for lowest weight
    // look for second lowest weight from a different pod
  
    // assign those engineers to release
    // update the hash
      // increment weight of engineers assigned
  });
  
  // update the database with weight changes

};

  