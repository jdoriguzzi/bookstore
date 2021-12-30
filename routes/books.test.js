process.env.NODE_ENV = "test"

const request = require("supertest")
const app = require("../app")
const db = require("../db")


let isbn


beforeEach(async function() {
  let result = await db.query(
    `INSERT INTO books (isbn, amazon_url, author, language, pages, publisher, title, year)
     VALUES('0691161518', 'http://a.co/eobPtX2', 'Matthew Lane', 'english', 264, 'Princeton University Press', 
            'Power-Up: Unlocking the Hidden Mathematics in Video Games', 2017)
     RETURNING isbn`
  )

  isbn = result.rows[0].isbn
})


describe("GET /books", function () {
  test("Gets all books", async function () {
    const response = await request(app).get(`/books`)
    const books = response.body.books
    expect(books).toHaveLength(1)
  })
})

describe("GET /books/:isbn", function () {
  test("Gets a book by isbn", async function () {
    const response = await request(app).get(`/books/${isbn}`)
    expect(response.body.book.isbn).toBe(isbn)
  })

  test("Responds with 404 if can't find book in question", async function () {
    const response = await request(app).get(`/books/0000000001`)
    expect(response.statusCode).toBe(404)
  })
})


describe("POST /books", function () {
  test("Creates a new book", async function () {
    const response = await request(app)
        .post(`/books`)
        .send({
          isbn: '1234567890',
          amazon_url: "https://a.com",
          author: "John Smith",
          language: "english",
          pages: 334,
          publisher: "Princeton University Press",
          title: "Software Testing Made Easy",
          year: 2020
        })
    expect(response.statusCode).toBe(201);
    expect(response.body.book).toHaveProperty("title");
  })

  test("Prevents creating book without required info", async function () {
    const response = await request(app).post(`/books`)
      .send({
        isbn: '1234567890',
          amazon_url: "https://a.com",
          pages: 334,
          publisher: "Princeton University Press",
          title: "Software Testing Made Easy",
          year: 2020
      })
    expect(response.statusCode).toBe(400)
  })
})


describe("PUT /books/:id", function () {
  test("Updates a book", async function () {
    const response = await request(app)
        .put(`/books/${isbn}`)
        .send({
          isbn: '1234567890',
          amazon_url: "https://a.com",
          author: "John Smith",
          language: "english",
          pages: 334,
          publisher: "Princeton University Press",
          title: "Software Testing Made Easier",
          year: 2020
        })
    expect(response.body.book.title).toBe("Software Testing Made Easier")
  })

  test("Prevents a book update with missing information", async function () {
    const response = await request(app)
        .put(`/books/${isbn}`)
        .send({
          isbn: '1234567890',
          amazon_url: "https://a.com",
          author: "John Smith",
          language: "english",
          pages: 334,
          publisher: "Princeton University Press",
          year: 2020
        })
    expect(response.statusCode).toBe(400)
  })

  test("Responds 404 if can't find book in question", async function () {
    const response = await request(app).delete(`/books/1111111111`)
    expect(response.statusCode).toBe(404);
  })
})


describe("DELETE /books/:id", function () {
  test("Deletes a book by isbn", async function () {
    const response = await request(app).delete(`/books/${isbn}`)
    expect(response.body).toEqual({message: "Book deleted"})
  })
})


afterEach(async function () {
  await db.query("DELETE FROM BOOKS");
})


afterAll(async function () {
  await db.end()
})
