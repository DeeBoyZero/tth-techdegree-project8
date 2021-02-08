const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");
const Book = require("../models").Book;

// Async handker function for router (Middleware)
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

// Paginate function on the model using req params used for book listing pagination (Middleware)
function paginate(model) {
  return async (req, res, next) => {
    // Setup the params for the Sequelize query
    const page = parseInt(req.params.pageNumber || 1);
    const limit = 6;
    const startIndex = (page - 1) * limit;

    const result = {};

    try {
      result.results = await model.findAndCountAll({
        offset: startIndex,
        limit: limit,
      });
      // Check to see if an invalid page number was passed to the url query string
      if(page <= Math.ceil(result.results.count / limit)) {
        result.limit = limit;
        res.paginatedResult = result;
        next();
      } else {
        const error = new Error("Page not found");
        error.status = 404;
        throw error;
      }

    } catch (e) {
      next(e);
    }
  };
}

// Paginate function on the model using query parameters used for search results pagination (Middleware)
function paginateSearch(model) {
  return async (req, res, next) => {
    // Setup the params for the Sequelize query
    const searchQuery = req.query.query;
    const page = parseInt(req.query.page || 1);
    const limit = 6;
    const startIndex = (page - 1) * limit;

    const result = {};

    try {
      // Search in all columns for a full/partial match on the search query 
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
      // Check to see if an invalid page number was passed to the url query string
      if(page <= Math.ceil(result.results.count / limit)) {
        result.searchQuery = searchQuery;
        result.limit = limit;
        res.paginatedResult = result;
        next();
      } else {
        const error = new Error("Page not found");
        error.status = 404;
        throw error;
      }
    } catch (e) {
      next(e);
    }
  };
}

// Book listing (index) page using the paginate function
router.get("/", paginate(Book), (req, res) => {
  try {
    // res.paginatedResult comes from the paginate middleware
    const pageSize = res.paginatedResult.limit;
    const totalBooks = res.paginatedResult.results.count;

    const pageCount = Math.ceil(totalBooks / pageSize);

    const pageList = [];
    for (let i = 0; i < pageCount; i++) {
      pageList.push(i);
    }

    res.render("books/index", {
      books: res.paginatedResult.results.rows,
      title: "The Book Library",
      pages: pageList,
    });
  } catch (error) {
    throw error;
  }
});

// Route used by pagination button on the book listing page
router.get("/page/:pageNumber", paginate(Book), (req, res) => {
  try {
    // res.paginatedResult comes from the paginate middleware
    const pageSize = res.paginatedResult.limit;
    const totalBooks = res.paginatedResult.results.count;
  
    const pageCount = Math.ceil(totalBooks / pageSize);
  
    const pageList = [];
    for (let i = 0; i < pageCount; i++) {
      pageList.push(i);
    }

    res.render("books/index", {
      books: res.paginatedResult.results.rows,
      title: "The Book Library",
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
      // Check to see if the error is Sequelize's validator notEmpty
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
    // res.paginatedResult comes from the paginateSearch middleware
    const pageSize = res.paginatedResult.limit;
    const totalBooks = res.paginatedResult.results.count;

    const pageCount = Math.ceil(totalBooks / pageSize);

    const pageList = [];
    for (let i = 0; i < pageCount; i++) {
      pageList.push(i);
    }

    if(totalBooks > 0) {
      res.render("books/search", {
        books: res.paginatedResult.results.rows,
        title: "Search Results",
        pages: pageList,
        searchQuery: res.paginatedResult.searchQuery,
      });
    } else {
      res.redirect("/");
    }

  } catch (error) {
    throw error;
  }
});

/* Edit a book form */
router.get(
  "/:id/edit",
  asyncHandler(async (req, res) => {
    const book = await Book.findByPk(req.params.id);
    if(book) {
      res.render("books/update-book", { book, title: "Edit Book" });
    } else {
      const error = new Error("Book not found");
      error.status = 404;
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
      error.status = 404;
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
        return res.redirect("/books/" + book.id);
      } else {
        const error = new Error("Book not found");
        error.status = 404;
        throw error;
      }
    } catch (error) {
      // Check to see if the error is Sequelize's validator notEmpty
      if (error.name === "SequelizeValidationError") {
        book = await Book.build(req.body);
        book.id = req.params.id;
        res.render("books/update-book", {
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
      error.status = 404;
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
      error.status = 404;
      throw error;
    }
  })
);

module.exports = router;
