# Backend tests

This folder contains unit tests for individual controller behavior and
integration tests that exercise the Express API with MongoDB.

## Category controller unit test

`categoryController.test.js` tests the controller's `index` action directly.
It replaces `categoryModel.index` with a small in-memory stub, calls the
controller with a mock response object, and checks that the response contains
the returned categories with status 200. The original model method is restored
after the test, including when an assertion fails.

This is a unit test: it does not make an HTTP request and does not connect to
MongoDB. It currently covers the successful response path for `index`; it does
not cover the controller's error response or the `store`, `update`, and
`destroy` actions.

Run it from the `backend` directory:

```bash
node --test tests/categoryController.test.js
```

Or from this `tests` directory:

```bash
node --test categoryController.test.js
```

To add another controller unit test, replace only the model method needed for
that case, pass simple request and response objects, assert the status and
JSON body, then restore the original method with `t.after()`. This keeps the
test isolated from the database and other tests.

## Categories API integration test

`categories.integration.test.js` sends an HTTP request to the public
`GET /api/v1.0/categories` endpoint. It verifies that the endpoint responds
with HTTP 200 and returns a JSON array. The request goes through the Express
app and reads categories from MongoDB, so this is an integration test rather
than a unit test of one function.

## Run it

Make sure MongoDB is running locally, then run from the `backend` directory:

```bash
node --test tests/categories.integration.test.js
```

Or, from this `tests` directory:

```bash
node --test categories.integration.test.js
```

By default, the test uses the separate local database
`mongodb://127.0.0.1:27017/botanica-lab-test`. It points both the test client
and the API at this same database. To use another dedicated test database,
set `MONGODB_URI_TEST` before running the command. For example, in Git Bash:

```bash
MONGODB_URI_TEST='mongodb://127.0.0.1:27017/botanica-lab-test' node --test tests/categories.integration.test.js
```

The test loads the backend `.env` using a path relative to the test file, so it
works from either directory above. `MONGODB_URI_TEST` should identify a test
database; avoid pointing it at a database with data you need to preserve.

## How the setup works

- The test loads `.env`, then chooses `MONGODB_URI_TEST` or the local test URI.
- Before importing the app, it assigns that URI to `MONGODB_CONNECTION`. The
  category route therefore queries the same test database as the test client.
- `app.js` exports the Express app without listening when another file imports
  it. Running `node app.js` directly still starts the server.
- `supertest` sends the request to the exported app without requiring a
  separately running HTTP server.

## Reuse this pattern for another integration test

1. Keep database access behind an environment variable and use a dedicated
   test database.
2. Configure the app's database connection before importing the app or its
   route/model modules.
3. Import the exported Express app and send requests with `supertest`.
4. Assert both the HTTP response and the response data relevant to the
   behavior being tested.
5. Close any MongoDB clients in a `finally` block so they close even if an
   assertion fails.
