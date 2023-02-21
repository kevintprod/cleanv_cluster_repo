import express from 'express';
import dotenv from 'dotenv';
import bodyparser from 'body-parser';
import { Queue as QueueMQ, Worker, QueueEvents } from 'bullmq';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter.js';
import { ExpressAdapter } from '@bull-board/express';

import { ProcessFile } from './controller/fileprocess.js';
import { CONFIG_REDIS } from './config.js';
console.log(CONFIG_REDIS.redisConn_DB);
dotenv.config();
const app = express();

const JobEvents = async () => {
  try {
    //active
    fileJobWorker.on('active', async (job) => {
      console.log(
        `active job id: ${job.id}, userId: ${job.data.userEmail}, fileId: ${job.data.fileId} `
      );
    });

    //progress
    fileJobWorker.on('progress', async (job, progress) => {
      console.log(
        `progress: ${progress},  id: ${job.id}, userId: ${job.data.userEmail}, fileId: ${job.data.fileId} `
      );
    });

    //complete
    fileJobWorker.on('completed', async (job) => {
      console.log(
        `completed job id: ${job.id}, userId: ${job.data.userEmail}, fileId: ${job.data.fileId} `
      );
    });

    fileJobWorker.on('failed', async (job) => {
      console.log(
        `failed job id: ${job.id}, userId: ${job.data.userEmail}, fileId: ${job.data.fileId} `
      );
    });
  } catch (error) {
    console.log(error);
    const err = new Error(error);
    err.statusCode(500);
    throw error;
  }
};

// worker handler
const fileProcessWorkerHandler = async (job, token) => {
  switch (job.name) {
    case 'testFileprocessQueue': {
      const { fileId, userId } = job.data;
      const reqdata = {
        processid: job.id,
        fileId,
        userId,
        job,
      };

      await ProcessFile(reqdata);
      break;
    }
    default:
      break;
  }
};

// Job events
const queueEvents = new QueueEvents(
  'fileprocessQueue',
  CONFIG_REDIS.redisConn_DB.queue
);

// queue
const fileprocessQueue = new QueueMQ(
  'fileprocessQueue',
  CONFIG_REDIS.redisConn_DB.queue
);

//worker
const fileJobWorker = new Worker(
  'fileprocessQueue',
  fileProcessWorkerHandler,
  CONFIG_REDIS.redisConn_DB.worker
);

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');
const { addQueue, removeQueue, setQueues, replaceQueues } = createBullBoard({
  queues: [new BullMQAdapter(fileprocessQueue)],
  serverAdapter: serverAdapter,
});

//route
app.use(bodyparser.json());
app.use('/admin/queues', serverAdapter.getRouter());

app.post('/api/testaddbulkjob', async (req, res, next) => {
  try {
    // console.log(req);
    const { items } = req.body;

    items.forEach(async ({ fileId, userEmail }) => {
      await fileprocessQueue.add('testFileprocessQueue', {
        fileId,
        userEmail,
      });
    });
    res.status(200).json({ msg: 'test' });
  } catch (error) {
    next(error);
  }
});

try {
  JobEvents();
  app.listen(process.env.PORT || 4001);
  console.log(
    `Cluster Server running on PORT ${process.env.PORT} | Env: ${process.env.ENV}`
  );
} catch (err) {
  console.log(err);
}
