const express = require("express");
//middleware
const cors = require("cors");
const bodyParser = require("body-parser");
const morgan = require("morgan");

const unless = function (path, middleware) {
  return function (req, res, next) {
    if (path.includes(req.path)) {
      return next();
    } else {
      return middleware(req, res, next);
    }
  };
};

const fileUpload = require("express-fileupload");

// para receber imagens/videos e enviar pro imgur
const multer = require("multer");
const uuid = require("uuid").v4;
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    const { originalname } = file;
    cb(null, `${uuid()}-${originalname}`);
  },
});
const upload = multer({ storage });

const imgur = require("./db/imgur");
const app = express();
const messagesRouter = require('./routes/messages');
const repliesRouter = require('./routes/replies');
const marqueesRouter = require('./routes/marquees');
const placeholdersRouter = require('./routes/placeholders');

// auto generated open-api for express -- start
const swaggerJsdoc = require('swagger-jsdoc');
const jsDocsOptions = {
  swaggerDefinition: {
    info: {
      title: 'GCHAN API',
      version: '1.0.0',
      description: 'Documentation for the [gchan](https://gchan.com.br) API.\n\n More information in the project\'s [github repository](https://github.com/guites/gchan-backend).\n\n Reach out on twitter <https://twitter.com/gui_garcia67>!',
      contact: {
        name: 'guilherme garcia',
        url: 'https://guilhermegarcia.dev'
      },
      servers: [
        {
          url: 'http://localhost:4450',
          description: 'Development server',
        },
        {
          url: 'https://gchan-message-board.herokuapp.com',
          description: 'Production server',
        }
      ]
    },
  },
  apis: ['./routes/*.js', 'index.js'],
};
const jsDocsSpecs = swaggerJsdoc(jsDocsOptions);
const swaggerUi = require('swagger-ui-express');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(jsDocsSpecs));
// auto generated open-api for express -- end

app.use(unless(["/videoupload", "/gifupload", "/imgupload"], fileUpload()));

app.use(morgan("tiny"));

const corsOptions = {
  origin: process.env.CORS_ORIGIN_URL,
  credentials: true,
};
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/messages', messagesRouter);
app.use('/replies', repliesRouter);
app.use('/marquees', marqueesRouter);
app.use('/placeholders', placeholdersRouter);

// para receber imagens/videos e enviar pro imgur
app.use(express.static("uploads"));

/**
 * @openapi
 * /:
 *   get:
 *     description: Default route to test API status.
 *     responses:
 *       200:
 *         description: Points user to the project URL and documentation.
 */
app.get("/", (req, res) => {
  res.json({
    message: "This is the API for the gchan project <https://gchan.com.br>. Please visit </api-docs> for more information.",
  });
});


app.post("/imgupload", upload.single("image"), async (req, res) => {
  imgur.postImg(req.file.path, req.file.originalname).then((resp) => {
    res.json(resp);
  });
});

app.post("/gifupload", upload.single("image"), async (req, res) => {
  imgur.postGif(req.file.path, req.file.originalname).then((resp) => {
    res.json(resp);
  });
});

app.post("/videoupload", upload.single("video"), async (req, res) => {
  imgur.postVideo(req.file.path, req.file.originalname).then((resp) => {
    res.json(resp);
  });
});

app.delete("/imgur/:deletehash", (req, res) => {
  imgur.deleteImgur(req.params.deletehash).then((resp) => {
    res.json(resp);
  });
});

const port = process.env.PORT || 4450;
app.listen(port, () => {
  console.log(`Listening on ${port}.`);
});
