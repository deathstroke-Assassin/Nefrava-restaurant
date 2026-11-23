const express = require("express");
const apiRouter = express.Router();
const app = express();

/* ------------- controllers ------------------- */

const itemController = require("../controllers/itemControllerApi");
const authControllerApi = require("../controllers/authControllerApi");
const categoryControllerApi = require("../controllers/categoryControllerApi");
const orderController = require('../controllers/orderControllerApi');
const stripeController = require('../controllers/stripeControllerApi');
const contactController = require('../controllers/contactControllerApi');
/* -------------- parse of form ------------------- */
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  }),
);

const multer = require("multer");
const path = require("path");
const fs = require("node:fs");

const uploadDirectory = path.join(__dirname, "..", "public", "img", "uploades");
fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },
  filename: (req, file, cb) => {
    if (file) {
      cb(null, Date.now() + path.extname(file.originalname));
    }
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    return cb(new Error('Menu photos must be image files'));
  }
});

/* -------------- route roles ------------------------ */
//////////////////////////

apiRouter.post("/signin", (req, res) => {
  authControllerApi.signin(req, res);
});
apiRouter.get('/payment-methods', orderController.paymentMethods);
apiRouter.post('/contact', contactController.submit);
/* -------------- categories ------------------------ */
apiRouter.get("/categories", categoryControllerApi.publicIndex);

/* -------------- items ------------------------ */

apiRouter.get('/items/featured', itemController.publicFeatured);
apiRouter.get('/items/category/:categoryId', itemController.publicByCategory);
apiRouter.get('/items', itemController.publicIndex);
apiRouter.get('/items/:id', itemController.publicShow);

/* -------------- orders ------------------------ */

apiRouter.post('/orders', orderController.store);
apiRouter.get('/orders/:id/status', stripeController.status);
apiRouter.post('/stripe/webhook', stripeController.webhook);

//////////////////////////
/* -------------- Protected routes ------------------------ */
//////////////////////////
apiRouter.use(authControllerApi.verifySignin);

apiRouter.get('/manager/categories', categoryControllerApi.index);

apiRouter.get('/manager/items', itemController.index);
apiRouter.get('/manager/items/:id', itemController.show);

apiRouter.get("/dashboard", (req, res) => {
  authControllerApi.dashboard(req, res);
});

/* -------------- categories ------------------------ */

apiRouter.post("/categories", categoryControllerApi.store);
apiRouter.put("/categories/:id", categoryControllerApi.update);
apiRouter.delete("/categories/:id", categoryControllerApi.destroy);

/* ------------- Item management ------------------- */
apiRouter.post('/items', upload.single('photo'),
    (req, res, next) => {
        if (req.file) {
            req.body.photo = req.file.filename;
        }
        next();
    },
    itemController.store
);

apiRouter.put('/items/:id', upload.single('photo'),
    (req, res, next) => {
        if (req.file) {
            req.body.photo = req.file.filename;
        }
        next();
    },
    itemController.update
);

apiRouter.delete('/items/:id', itemController.destroy);

/* -------------- orders ------------------------ */
apiRouter.get('/orders', orderController.index);
apiRouter.get('/orders/:id', orderController.show);
apiRouter.put('/orders/:id', orderController.update);
apiRouter.post('/orders/:id/email', orderController.sendEmail);


module.exports = apiRouter;
