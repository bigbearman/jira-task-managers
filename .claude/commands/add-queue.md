Add a new BullMQ queue with producer and consumer following project conventions.

Queue description: $ARGUMENTS

## Step 1: Define Constants
Add to `packages/backend/src/shared/constants/queue.ts`:
```typescript
export const QUEUE_NAME = {
  ...,
  NEW_QUEUE: 'new-queue-name',
} as const;

export const QUEUE_PROCESSOR = {
  ...,
  NEW_QUEUE: {
    JOB_ONE: 'JOB_ONE',
    JOB_TWO: 'JOB_TWO',
  },
} as const;
```

## Step 2: Register Queue
Add to QueueModule imports:
```typescript
BullModule.registerQueue({ name: QUEUE_NAME.NEW_QUEUE })
```

## Step 3: Producer
Add methods to QueueService:
```typescript
async addJobOne(data: JobData) {
  return this.newQueue.add(QUEUE_PROCESSOR.NEW_QUEUE.JOB_ONE, data, {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  });
}
```

## Step 4: Consumer
Create `packages/backend/src/modules/worker/consumers/new-queue.consumer.ts`:
```typescript
@Processor(QUEUE_NAME.NEW_QUEUE, { concurrency: 2 })
export class NewQueueConsumer extends WorkerHost {
  private readonly logger = new Logger(NewQueueConsumer.name);

  async process(job: Job): Promise<any> {
    switch (job.name) {
      case QUEUE_PROCESSOR.NEW_QUEUE.JOB_ONE:
        return this.processJobOne(job);
    }
  }

  private async processJobOne(job: Job): Promise<void> {
    // Implementation with try/catch and status tracking
  }
}
```

## Step 5: Register Consumer in WorkerModule

## Step 6: Verify with `make lint && make build`
