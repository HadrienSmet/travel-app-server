const express = require('express');
const helmet = require('helmet');
const path = require('path');
const userRoutes = require('./routes/user');
const postsRoutes = require("./routes/posts");
require('./dbConfig');

const app = express();

app.use(helmet());

//Sets the proper headers to avoid errors from CORS policy
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader("Cross-Origin-Resource-Policy", "*");
    next();
  });

app.use(express.json());

app.use('/api', postsRoutes);
app.use('/api/auth', userRoutes);

app.use('/images', express.static(path.join(__dirname, 'images')));

module.exports = app;