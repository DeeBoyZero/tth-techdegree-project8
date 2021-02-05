var express = require("express");
var router = express.Router();
const { Op } = require("sequelize");
const axios = require("axios");

const Book = require("../models").Book;

function asyncHandler(cb) {
  return async (req, res, next) => {
    try {
      await cb(req, res, next);
    } catch (error) {
      // Forward error to the global error handler
      next(error);
    }
  };
}

function paginate(model) {
  return async (req, res, next) => {
    const page = parseInt(req.params.pageNumber || 1);
    const limit = 6;
    const startIndex = (page - 1) * limit;

    const result = {};

    try {
      result.results = await model.findAndCountAll({
        offset: startIndex,
        limit: limit,
      });
      result.limit = limit;
      res.paginatedResult = result;
      next();
    } catch (e) {
      next(e);
    }
  };
}

function paginateSearch(model) {
  return async (req, res, next) => {
    const searchQuery = req.query.query;
    const page = parseInt(req.query.page || 1);
    const limit = 6;
    const startIndex = (page - 1) * limit;

    const result = {};

    try {
      result.results = await model.findAndCountAll({
        where: {
          [Op.or]: [
            {
              title: { [Op.like]: `%${searchQuery}%` },
            },
            {
              author: { [Op.like]: `%${searchQuery}%` },
            },
            {
              genre: { [Op.like]: `%${searchQuery}%` },
            },
            {
              year: { [Op.like]: `%${searchQuery}%` },
            },
          ],
        },
        offset: startIndex,
        limit: limit,
      });
      result.searchQuery = searchQuery;
      result.limit = limit;
      res.paginatedResult = result;
      next();
    } catch (e) {
      next(e);
    }
  };
}

router.get("/", paginate(Book), (req, res) => {
  try {
    const pageSize = res.paginatedResult.limit;
    const totalBooks = res.paginatedResult.results.count;

    const pageCount = Math.ceil(totalBooks / pageSize);

    const pageList = [];
    for (let i = 0; i < pageCount; i++) {
      pageList.push(i);
    }

    res.render("books/index", {
      books: res.paginatedResult.results.rows,
      title: "The Book Factory",
      pages: pageList,
    });
  } catch (error) {
    throw error;
  }
});

router.get("/page/:pageNumber", paginate(Book), (req, res) => {
  try {
    const pageSize = res.paginatedResult.limit;
    const totalBooks = res.paginatedResult.results.count;

    const pageCount = Math.ceil(totalBooks / pageSize);

    const pageList = [];
    for (let i = 0; i < pageCount; i++) {
      pageList.push(i);
    }

    res.render("books/index", {
      books: res.paginatedResult.results.rows,
      title: "The Book Factory",
      pages: pageList,
    });
  } catch (error) {
    throw error;
  }
});

/* Create a new book form */
router.get(
  "/new",
  asyncHandler(async (req, res) => {
    res.render("books/new-book", { book: {}, title: "New Book" });
  })
);

/* Create a new book post action */
router.post(
  "/",
  asyncHandler(async (req, res) => {
    let book;
    try {
      book = await Book.create(req.body);
      res.redirect("/books/" + book.id);
    } catch (error) {
      if (error.name === "SequelizeValidationError") {
        book = await Book.build(req.body);
        res.render("books/new-book", {
          book,
          errors: error.errors,
          title: "New Book",
        });
      } else {
        throw error;
      }
    }
  })
);

// Route used by pagination in search function
router.get("/search", paginateSearch(Book), (req, res) => {
  try {
    const pageSize = res.paginatedResult.limit;
    const totalBooks = res.paginatedResult.results.count;

    const pageCount = Math.ceil(totalBooks / pageSize);

    const pageList = [];
    for (let i = 0; i < pageCount; i++) {
      pageList.push(i);
    }

    res.render("books/search", {
      books: res.paginatedResult.results.rows,
      title: "Search Results",
      pages: pageList,
      searchQuery: res.paginatedResult.searchQuery,
    });
  } catch (error) {
    throw error;
  }
});

/* Edit a book form */
router.get(
  "/:id/edit",
  asyncHandler(async (req, res) => {
    const book = await Book.findByPk(req.params.id);
    if (book) {
      res.render("books/update-book", { book, title: "Edit Book" });
    } else {
      const error = new Error("Book not found");
      // error.status = 404;
      throw error;
    }
  })
);

/* Get an individual book */
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const book = await Book.findByPk(req.params.id);
    if (book) {
      res.render("books/book-detail", { book, title: book.title });
    } else {
      const error = new Error("Book not found");
      // error.status = 404;
      throw error;
    }
  })
);

/* Update an existing book */
router.post(
  "/:id/edit",
  asyncHandler(async (req, res) => {
    let book;
    try {
      book = await Book.findByPk(req.params.id);
      if (book) {
        await book.update(req.body);
        res.redirect("/books/" + book.id);
      } else {
        const error = new Error("Book not found");
        // error.status = 404;
        throw error;
      }
    } catch (error) {
      if (error.name === "SequelizeValidationError") {
        book = await Book.build(req.body);
        book.id = req.params.id;
        res.render("books/edit", {
          book,
          errors: error.errors,
          title: "Edit Book",
        });
      } else {
        throw error;
      }
    }

    if (book) {
      await book.update(req.body);
      res.redirect("/books/" + book.id);
    } else {
      const error = new Error("Book not found");
      // error.status = 404;
      throw error;
    }
  })
);

/* Delete a book form. */
router.get(
  "/:id/delete",
  asyncHandler(async (req, res) => {
    const book = await Book.findByPk(req.params.id);
    if (book) {
      res.render("books/delete", { book, title: "Delete a book" });
    } else {
      const error = new Error("Book not found");
      // error.status = 404;
      throw error;
    }
  })
);

/* Delete a book post action. */
router.post(
  "/:id/delete",
  asyncHandler(async (req, res) => {
    const book = await Book.findByPk(req.params.id);
    if (book) {
      await book.destroy();
      res.redirect("/books");
    } else {
      const error = new Error("Book not found");
      // error.status = 404;
      throw error;
    }
  })
);

module.exports = router;
