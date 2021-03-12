import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import express from 'express';
import dotenv from 'dotenv';

import { proxyRouter } from './proxy.js';

dotenv.config();

const {
  PORT: port = 3001, // Mun verða proxyað af browser-sync í development
} = process.env;

const app = express();
const path = dirname(fileURLToPath(import.meta.url));

app.use(express.static(join(path, '../public')));
app.use(express.static(join(path, '../node_modules/leaflet/dist')));

app.set('view engine', 'ejs');
app.set('views', join(path, '../views'));

// TODO setja upp proxy þjónustu
// TODO birta index.html skjal
app.get('/', (req, res) => {
  res.sendFile('index.html', {
    root: join(path, '..'),
  });
});

function enableCORS(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Acces-Control-Allow-Methods', 'GET');
  next();
}

app.use(enableCORS);
app.use(proxyRouter);
/**
 * Middleware sem sér um 404 villur.
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @param {function} next Næsta middleware
 */
// eslint-disable-next-line no-unused-vars
function notFoundHandler(req, res, next) {
  const title = 'Síða fannst ekki';
  res.status(404).render('error', { title });
}

/**
 * Middleware sem sér um villumeðhöndlun.
 *
 * @param {object} err Villa sem kom upp
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @param {function} next Næsta middleware
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(err);
  const title = 'Villa kom upp';
  res.status(500).render('error', { title });
}

app.use(notFoundHandler);
app.use(errorHandler);

// Verðum að setja bara *port* svo virki á heroku
app.listen(port, () => {
  console.info(`Server running at http://localhost:${port}/`);
});
