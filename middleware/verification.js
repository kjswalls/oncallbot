module.exports = (req, res, next) => {
  if (req.body.token === process.env.VERIFICATION_TOKEN) {
    next();
  } else {
    res.sendStatus(403);
  }
};
