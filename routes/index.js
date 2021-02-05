var express = require('express');
var router = express.Router();


/* Redirects to books page. */
router.get('/', (req, res, next) => {
  res.redirect("/books")
  // throw new Error();
});

/* Server error test route. */
router.get('/error', (req, res) => {
  const error  = new Error;
  throw error;
});

module.exports = router;
