// TODO útfæra proxy virkni
import express from 'express';
import fetch from 'node-fetch';

import { timerStart, timerEnd } from './time.js';
import { getEarthquakes, setEarthquakes } from './cache.js';

const types = ['all', '1.0', '2.5', '4.5', 'significant'];
const periods = ['hour', 'day', 'week', 'month'];

export const proxyRouter = express.Router();

function validateQuery(req, res, next) {
  const {
    type,
    period,
  } = req.query;
  if (!(types.includes(type) && periods.includes(period))) {
    res.status(400).json({ error: 'invalid query arguments' });
    return;
  }
  req.query.type = type;
  req.query.period = period;
  next();
}

proxyRouter.get('/proxy', validateQuery, async (req, res) => {
  const {
    type,
    period,
  } = req.query;
  const URL = `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/${type}_${period}.geojson`;
  let result;

  const timer = timerStart();
  try {
    result = await getEarthquakes(`${type}_${period}`);
  } catch (e) {
    console.error('error getting from cache', e);
  }

  if (result) {
    const data = {
      data: JSON.parse(result),
      info: {
        cached: true,
        time: timerEnd(timer),
      },
    };
    res.json(data);
    return;
  }

  try {
    result = await fetch(URL);
  } catch (e) {
    console.error('Error fetching data from server');
    res.status(500).json({ error: 'Error fetching data from server' });
    return;
  }
  if (!result.ok) {
    console.error('Error fetching data from server');
    res.status(500).json({ error: 'Error fetching data from server' });
    return;
  }
  const resultData = await result.text();
  await setEarthquakes(`${type}_${period}`, resultData);
  const data = {
    data: JSON.parse(resultData),
    info: {
      cached: false,
      time: timerEnd(timer),
    },
  };
  res.json(data);
});
