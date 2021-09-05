import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import { createServer } from 'http';

import { createRoutes, createSocket } from './core/index.js';

const PORT = process.env.PORT || 5000;
const app = express();
const http = createServer(app);
const io = createSocket(http);

app.use(express.json());

createRoutes(app, io);

const start = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    });
    http.listen(PORT, () =>
      console.log(`Server started: http://localhost:${process.env.PORT}`),
    );
  } catch (error) {
    console.log(error);
  }
};

start();
