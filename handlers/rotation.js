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

// get release
// figure out which engineers should be assigned
// return them

// get future release
// figure out which engineers should be assigned
// assign them in the database

exports.assignEngineers = async (releaseName) => {
// get engineers
  const engineers = await Engineer
    .find({ _id: { $exists: true }})
    .sort({ weight: 1 });
  const fes = engineers.filter(engineer => engineer.discipline === 'front_end');
  const bes = engineers.filter(engineer => engineer.discipline === 'back_end');

  // maintain hashes of engineer weights
  const feHash = createHash(fes);
  const beHash = createHash(bes);

  const assigned = {
    releaseName,
    primaryEngineers: [],
    backupEngineers: [],
  };

  // get the FEs with the two lowest weights from different pods
  const frontEndsAssigned = getTwoLowestWeights(feHash);
  
  // get the BEs with the two lowest weights from different pods
  const backEndsAssigned = getTwoLowestWeights(beHash);
  
  // increment weight of engineers assigned, if they're not null
  frontEndsAssigned.onCall && frontEndsAssigned.onCall.weight++;
  frontEndsAssigned.backup && frontEndsAssigned.backup.weight++;
  backEndsAssigned.onCall && backEndsAssigned.onCall.weight++;
  backEndsAssigned.backup && backEndsAssigned.backup.weight++;

  assigned.primaryEngineers.push(frontEndsAssigned.onCall, backEndsAssigned.onCall);
  assigned.primaryEngineers = assigned.primaryEngineers.filter(eng => eng !== null);

  assigned.backupEngineers.push(frontEndsAssigned.backup, backEndsAssigned.backup);
  assigned.backupEngineers = assigned.backupEngineers.filter(eng => eng !== null);

  // update the database with the new weights
  const engineersArr = [...assigned.primaryEngineers, ...assigned.backupEngineers];
  const updatePromises = engineersArr.map((engineer) => {
    // if engineer is not undefined (too few engineers in the pool to assign 4)
    if (engineer) {
      const updatedEngineer = Engineer.findOneAndUpdate({ _id: engineer.id }, { weight: engineer.weight}, { new: true });
      return updatedEngineer;
    }
  });

  const updatedEngineers = await Promise.all(updatePromises);

  // // update the hashes
  // const updatedHash = updateHash(feHash, assigned);
  // console.log(updatedHash);

  return assigned;
};

exports.updateFutureReleases = async (release) => {
  // get all releases in the future after the release that was added or edited
  const releases = await Release
    .find({ date: { $gt: release.date }})
    .sort({ date: 1 });

  // for each release, assign engineers
  const engineerPromises = releases.map((release) => {
    const assigned = exports.assignEngineers(release.name);
    return assigned;
  });

  const engineerAssignments = await Promise.all(engineerPromises);

  // for each group of assigned engineers, updated the releases in the DB
  const releasePromises = engineerAssignments.map((engineersAssigned) => {
    const releaseData = {
      primaryEngineers: engineersAssigned.primaryEngineers.map(eng => eng ? eng.id : null),
      backupEngineers: engineersAssigned.backupEngineers.map(eng => eng ? eng.id : null),
    };
    const updatedRelease = Release.findOneAndUpdate(
      { name: engineersAssigned.releaseName },
      releaseData,
      { new: true }
    );
    return updatedRelease;
  });

  const updatedReleases = await Promise.all(releasePromises);
  return updatedReleases;
};

function createHash(engineers) {
  const hash = new Map();
  engineers.forEach((engineer) => {
    if (engineer) {
      // if this key doesn't already exist
      if (!hash.has(engineer.weight)) {
        // create it as an empty array
        hash.set(engineer.weight, []);
      }
      // then add the engineer to the array for this weight
      hash.get(engineer.weight).push(engineer);
    }
  });
  return hash;
}

function getTwoLowestWeights(hash) {
  let onCall = null;
  let backup = null;
  const hashKeysArray = [...hash.keys()]

  // get the key (aka weight) at index 0 by making an array of the hash's keys
  const firstWeight = hashKeysArray[0];
  onCall = hash.get(firstWeight)[0];

  // look for second lowest weight from a different pod
  let secondWeight = firstWeight;

  // while there are engineers at this weight in the hash, or engineers at some weight above this weight
  while (hash.get(secondWeight) || hashKeysArray.some(key => key > secondWeight)) {
    // look for engineers at that weight on the opposite pod
    sameDisciplineOppositePod = [];

    if (hash.get(secondWeight)) {
      sameDisciplineOppositePod = hash.get(secondWeight).filter(engineer => engineer.pod !== onCall.pod);
    }

    // if we find an engineer on the opposite pod
    if (sameDisciplineOppositePod.length) {
      // set them as the backup and end the search
      backup = sameDisciplineOppositePod[0];
      break;
    }

    // otherwise look through the next weight
    secondWeight++;
  }

  return { onCall, backup };
}

function updateHash(hash, assigned) {
  const engineers = [...assigned.primaryEngineers, ...assigned.backupEngineers];

  // for each engineer
  engineers.forEach((engineer) => {
    // if engineer is not undefined (too few engineers in the pool to assign 4)
    if (engineer) {
      // find them in the the hash by their old weight
      const weightList = hash.get(engineer.weight - 1);
      const index = weightList.findIndex(eng => eng.id === engineer.id);

      // increment their old weight
      weightList[index].weight++;

      // add them to the appropriate hash entry based on weight

      // remove them from their old hash entry
    }
  });

  // return updated hash
  return hash;
}
  