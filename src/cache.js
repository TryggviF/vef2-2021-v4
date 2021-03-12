// TODO útfæra redis cache
import redis from 'redis';
import util from 'util';
import dotenv from 'dotenv';

dotenv.config();

const {
  REDIS_URL: redisUrl,
} = process.env;

let client;

if (redisUrl) {
  client = redis.createClient({ url: redisUrl });
}

const asyncGet = util.promisify(client.get).bind(client);
const asyncSet = util.promisify(client.set).bind(client);

export async function getEarthquakes(cacheKey) {
  if (!client || !asyncGet) return null;

  const earthquakes = await asyncGet(cacheKey);
  return earthquakes;
}

export async function setEarthquakes(cacheKey, earthquakes) {
  if (!client || !asyncSet) return null;
  await asyncSet(cacheKey, earthquakes);
  return true;
}
