var express = require('express');
var router = express.Router();

const Book = require('../models').Book;

function asyncHandler(cb){
  return async(req, res, next) => {
    try {
      await cb(req, res, next)
    } catch(error){
      // Forward error to the global error handler
      next(error);
    }
  }
}

/* GET books listing. */
router.get('/', asyncHandler(async (req, res) => {
  const books = await Book.findAll();
  res.render('books/index', { books, title: "The Book Factory"});
}));

/* Create a new book form */
router.get('/new', asyncHandler(async (req, res) => {
  res.render('books/new-book', { book: {}, title: "New Book" })
}));

/* Create a new book post action */
router.post('/', asyncHandler(async (req, res) => {
  let book;
  try {
    book = await Book.create(req.body);
    res.redirect('/books/' + book.id);
  } catch(error) {
    if (error.name === "SequelizeValidationError") {
      book = await Book.build(req.body);
      res.render('books/new-book', { book, errors: error.errors, title: "New Book"});
    } else {
      throw error;
    }
  }
}));

/* Edit a book form */
router.get('/:id/edit', asyncHandler(async (req, res) => {
  const book = await Book.findByPk(req.params.id);
  if(book) {
    res.render('books/update-book', { book, title: "Edit Book" });
  } else {
    res.sendStatus(404);
  }
}));

/* Get an individual book */
router.get('/:id', asyncHandler(async (req, res) => {
  const book = await Book.findByPk(req.params.id);
  if(book) {
    res.render('books/book-detail', { book, title: book.title });
  } else {
    res.sendStatus(404);
  }
}));

/* Update an existing book */
router.post('/:id/edit', asyncHandler(async (req, res) => {
  let book;
  try {
    book = await Book.findByPk(req.params.id);
    if(book) {
      await book.update(req.body);
      res.redirect('/books/' + book.id)
    } else {
      res.sendStatus(404);
    }
  } catch(error) {
    if(error.name === "SequelizeValidationError") {
      book = await Book.build(req.body);
      book.id = req.params.id;
      res.render('books/edit', { book, errors: error.errors, title: "Edit Book" });
    } else {
      throw error;
    }
  }

  if(book){
    await book.update(req.body);
    res.redirect('/books/' + book.id);
  } else {
    res.sendStatus(404);
  }
}));

/* Delete a book form. */
router.get('/:id/delete', asyncHandler(async (req, res) => {
  const book = await Book.findByPk(req.params.id);
  if(book) {
    res.render('books/delete', { book, title: 'Delete a book'});
  } else {
    res.sendStatus(404);
  }
}));

/* Delete a book post action. */
router.post('/:id/delete', asyncHandler(async(req, res) => {
  const book = await Book.findByPk(req.params.id);
  if(book) {
    await book.destroy();
    res.redirect('/books')
  } else {
    res.sendStatus(404);
  }
}));

module.exports = router;
