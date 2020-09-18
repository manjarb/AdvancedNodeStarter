import util from "util";
import mongoose from "mongoose";
import redis from "redis";

const redisUrl = "redis://127.0.0.1:6379";
const redisClient = redis.createClient(redisUrl);

const exec = mongoose.Query.prototype.exec;

(mongoose.Query.prototype as any).cache = function () {
  this.useCache = true;
  return this;
};

mongoose.Query.prototype.exec = async function (): Promise<any> {
  console.log("About to run a query");

  if (!this.useCache) {
    return exec.apply(this, arguments as any);
  }

  const key = JSON.stringify(
    Object.assign({}, this.getFilter(), {
      collection: (this as any).mongooseCollection.name,
    })
  );

  // Check existed redis cache
  const cachedValue = await util.promisify(redisClient.get)(key);

  // if yes, return cache
  if (cachedValue) {
    console.log("Serve from cache");
    // Convert Json object into mongo collection before return
    const doc = JSON.parse(cachedValue);
    return Array.isArray(doc)
      ? // If result is array
        doc.map((d) => new (this as any).model(d))
      : // If result is object
        new (this as any).model(doc);
  }

  // if no, call database and update our cache data
  const result = await exec.apply(this, arguments as any);

  // Update Cache
  redisClient.set(key, JSON.stringify(result));

  return result;
};
