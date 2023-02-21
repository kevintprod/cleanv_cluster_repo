import dotenv from 'dotenv';
dotenv.config();

const env = process.env.ENV;
// connection to redis
export const CONFIG_REDIS = {
  redisConn_DB: {
    queue: {
      connection: {
        host: process.env.REDIS_ENDPOINT,
        port: process.env.REDIS_PORT,
        password: process.env.REDIS_PASSWORD,
        enableOfflineQueue: false,
        connectionTimeout: 5000,
        lazyConnect: true,
        retryStrategy(times) {
          console.warn(`Retrying redis connection: attempt ${times}`);
          if (times === 10) {
            return new Error('Redis retry time Error');
          }
          return Math.min(times * 500, 2000);
        },
      },
      // limiter: {
      //   max: 5,
      //   duration: 1000,
      // },
    },
    worker: {
      connection: {
        host: process.env.REDIS_ENDPOINT,
        port: process.env.REDIS_PORT,
        password: process.env.REDIS_PASSWORD,
        enableOfflineQueue: false,
        connectionTimeout: 5000,
        lazyConnect: true,
        retryStrategy(times) {
          console.warn(`Retrying redis connection: attempt ${times}`);
          if (times === 10) {
            return new Error('Redis retry time Error');
          }
          return Math.min(times * 500, 2000);
        },
      },
      concurrency: process.env.MAX_JOB_BULLMQ_CONCURRENCY,
    },
  },
};

export const CONFIG_DB = {
  DB_LIVE: [
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      logging: false,
      dialect: process.env.DB_DIALECT,
      host: process.env.DB_HOST,
    },
  ],
  DB2_LIVE: [
    process.env.DB_NAME2,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      logging: false,
      dialect: process.env.DB_DIALECT,
      dialectOptions: {
        multipleStatements: true,
      },
      host: process.env.DB_HOST,
      pool: {
        max: 50,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    },
  ],
};
