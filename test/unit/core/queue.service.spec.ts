import { Test, TestingModule } from "@nestjs/testing";
import { MemoryQueueService } from "core/queue/queue.service";

describe("MemoryQueueService", () => {
  const id = "id";
  let collector: string[] = [];

  const asyncPush = (_id: string) => () =>
    new Promise<void>((res) => {
      setTimeout(res, 100);
    }).then(() => collector.push(_id));

  const asyncFailedPush = (error: string) => () =>
    new Promise<void>((res, rej) => {
      setTimeout(() => rej(new Error(error)), 100);
    });

  let service: MemoryQueueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MemoryQueueService],
    }).compile();

    service = module.get<MemoryQueueService>(MemoryQueueService);
    collector = [];
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should queue tasks grouped by id", async () => {
    service.schedule(id, asyncPush(`${id}-0`));
    service.schedule(id, asyncFailedPush(`${id}-2`));
    service.schedule(id, asyncPush(`${id}-3`));
    service.schedule(id, asyncFailedPush(`${id}-4`));
    const resp = service.schedule(id, asyncPush(`${id}-5`));
    const resp2 = service.schedule("anotherID", asyncPush("anotherID"));

    await Promise.all([resp, resp2]);
    expect(collector).toEqual(["id-0", "anotherID", "id-3", "id-5"]);
  });

  it("should return error for task and proceed to the next", async () => {
    const calls = await Promise.all([
      service.schedule(id, asyncFailedPush("Error")),
      service.schedule(id, asyncPush(`${id}-0`)),
    ]);
    expect(calls[0][0]?.message).toEqual("Error");
  });
});
