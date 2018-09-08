/**
 * Flow:
 * Every time a new release is added, this module determines who should be assigned to it.
 * When a release is edited, the module updates assignments for upcoming releases accordingly.
 */

/**
 * Rules:
 * 1. Each release must have one front end and one back end engineer on call
 * 2. Each engineer on call must have a backup
 * 3. Primary and backup engineers should be on different pods
 * 4. 
 */

 // see if there was a previous release
 // if so, get assignments from that release, use those to make this release
 
 // for each pod
  // get front ends
  // get back ends
  // lowest weight of each is on call
  // second lowest 