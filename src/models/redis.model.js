const { BusinessLogicError } = require("../core/error.response");
const { getRedis } = require("../dbs/init.redis");

class RedisModel {
  constructor() {
    this.redis = getRedis();
    this.get = this.get.bind(this);
    this.set = this.set.bind(this);
    this.setnx = this.setnx.bind(this);
    this.expire = this.expire.bind(this);
    this.ttl = this.ttl.bind(this);
    this.exists = this.exists.bind(this);
  }
  async get(key) {
    try {
      const { instanceConnect: client } = this.redis;
      const data = await client.get(key);
      return { result: true, data };
    } catch (error) {
      return { result: false, error };
    }
  }

  async set(key, value) {
    try {
      const { instanceConnect: client } = this.redis;
      await client.set(key, value);
      return { result: true, data: [] };
    } catch (error) {
      return { result: false, error };
    }
  }

  async setWithExpired(key, value, times = 30) {
    try {
      const { instanceConnect: client } = this.redis;
      await client.set(key, value, "EX", times);
      return { result: true, data: [] };
    } catch (error) {
      return { result: false, error };
    }
  }

  async setnx(key, value) {
    try {
      const { instanceConnect: client } = this.redis;

      await client.setNX(key, value);
      return { result: true, data: [] };
    } catch (error) {
      return { result: false, error };
    }
  }

  async expire(key, ttl) {
    try {
      const { instanceConnect: client } = this.redis;

      return await client.expire(key, ttl);
    } catch (error) {
      throw new BusinessLogicError(error.msg);
    }
  }

  async ttl(key) {
    try {
      const { instanceConnect: client } = this.redis;

      await client.ttl(key);
      return { result: true, data: [] };
    } catch (error) {
      return { result: false, error };
    }
  }

  async exists(key) {
    try {
      const { instanceConnect: client } = this.redis;

      const data = await client.exists(key);
      console.log({ data });
      return { result: true, data: data === 1 ? true : false };
    } catch (error) {
      return { result: false, error };
    }
  }
}

module.exports = new RedisModel();
