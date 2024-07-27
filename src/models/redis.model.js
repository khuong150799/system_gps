const { getRedis } = require("../dbs/init.redis");

class RedisModel {
  constructor() {
    this.redis = getRedis();
    this.get = this.get.bind(this);
    this.hGet = this.hGet.bind(this);
    this.hGetAll = this.hGetAll.bind(this);
    this.set = this.set.bind(this);
    this.setWithExpired = this.setWithExpired.bind(this);
    this.hSet = this.hSet.bind(this);
    this.setnx = this.setnx.bind(this);
    this.expire = this.expire.bind(this);
    this.ttl = this.ttl.bind(this);
    this.exists = this.exists.bind(this);
    this.hdelOneKey = this.hdelOneKey.bind(this);
    this.del = this.del.bind(this);
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

  async hGet(key, field) {
    try {
      const { instanceConnect: client } = this.redis;
      const data = await client.hGet(key, field);
      return { result: true, data };
    } catch (error) {
      return { result: false, error };
    }
  }

  async hGetAll(key) {
    try {
      const { instanceConnect: client } = this.redis;
      const data = await client.hGetAll(key);
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

  async hSet(key, field, value) {
    try {
      const { instanceConnect: client } = this.redis;
      await client.hSet(key, field, value);
      return { result: true, data: [] };
    } catch (error) {
      return { result: false, error };
    }
  }

  async setWithExpired(key, value, times = 30) {
    try {
      const { instanceConnect: client } = this.redis;
      // console.log({ key, value, times, path, requestId });
      await client.setEx(key, times, value);
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
      console.log("error", error);
      throw error.msg;
    }
  }

  async ttl(key) {
    try {
      const { instanceConnect: client } = this.redis;

      const data = await client.ttl(key);
      return { result: true, data };
    } catch (error) {
      return { result: false, error };
    }
  }

  async exists(key) {
    try {
      const { instanceConnect: client } = this.redis;

      const data = await client.exists(key);
      return { result: true, data };
    } catch (error) {
      return { result: false, error };
    }
  }

  async hdelOneKey(key, field) {
    try {
      const { instanceConnect: client } = this.redis;
      await client.hDel(key, field);
      return { result: true, data: [] };
    } catch (error) {
      return { result: false, error };
    }
  }

  async del(key) {
    try {
      const { instanceConnect: client } = this.redis;
      await client.del(key);
      return { result: true, data: [] };
    } catch (error) {
      return { result: false, error };
    }
  }
}

module.exports = new RedisModel();
