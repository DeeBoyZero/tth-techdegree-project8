var express = require('express');
var router = express.Router();


/* Redirects to books page. */
router.get('/', (req, res, next) => {
  res.redirect("/books")
  // throw new Error();
});

module.exports = router;
