import { ConfigModule } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { LevelDBModule } from "core/db/leveldb.module";
import { DataSource } from "core/db/leveldb.provider";
import { MessageDto } from "core/messageBus/messageBus.dto";
import {
  getMessageBusEntityKey,
  MessageBusStoreService,
  Node,
} from "core/messageBus/messageBus.store";
import { zeroHash } from "viem";

describe("MessageBusStoreService", () => {
  let module: TestingModule;
  let service: MessageBusStoreService;
  let dataSource: DataSource;

  const channelId = zeroHash;

  const createMessage = (index: number) => {
    return new MessageDto(`messageid-${index}`, "test", { index });
  };

  const defaultMessage = createMessage(0);

  const getStore = () => {
    return dataSource.getEntityLevel(getMessageBusEntityKey(channelId));
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            () => ({
              db: {
                type: "leveldb",
                folder: ".db/messageBusStoreService",
                options: {},
              },
            }),
          ],
        }),
        LevelDBModule.forRootAsync(),
      ],
      providers: [MessageBusStoreService],
    }).compile();

    service = module.get<MessageBusStoreService>(MessageBusStoreService);
    dataSource = module.get<DataSource>(DataSource);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await dataSource.clear();
    await dataSource.db.close();
    await module.close();
  });

  describe("addMessage", () => {
    it("should add message as a head, tail and node if bus store is empty", async () => {
      await service.addMessage(channelId, defaultMessage);
      const store = getStore();
      const tailNode = await store.safeGet("tailId");
      const headNode = await store.safeGet("headId");
      const node = await store.safeGet(
        new Node(defaultMessage.id, defaultMessage).id,
      );

      expect(typeof node).toBe("string");
      expect(node).toEqual(tailNode);
      expect(node).toEqual(headNode);
    });

    it("should add message to the bottom of the stack for non-empty store", async () => {
      await service.addMessage(channelId, defaultMessage);
      const secondMessage = createMessage(1);
      await service.addMessage(channelId, secondMessage);
      const thirdMessage = createMessage(2);
      await service.addMessage(channelId, thirdMessage);
      const store = getStore();
      const tailNode = await store.safeGet("tailId");
      const headNode = await store.safeGet("headId");
      const firstNode = await store.safeGet(
        new Node(defaultMessage.id, defaultMessage).id,
      );
      const secondNode = await store.safeGet(
        new Node(secondMessage.id, secondMessage).id,
      );
      const thirdNode = await store.safeGet(
        new Node(thirdMessage.id, thirdMessage).id,
      );

      expect(firstNode).toEqual(headNode);
      expect(thirdNode).toEqual(tailNode);
      const storedFirstNode = Node.of<typeof defaultMessage>(firstNode!);
      const storedSecondNode = Node.of<typeof secondMessage>(secondNode!);
      const storedThirdNode = Node.of<typeof thirdMessage>(thirdNode!);

      expect(storedFirstNode.prevId).toEqual(undefined);
      expect(storedFirstNode.nextId).toEqual(storedSecondNode.id);
      expect(storedSecondNode.prevId).toEqual(storedFirstNode.id);
      expect(storedSecondNode.nextId).toEqual(storedThirdNode.id);
      expect(storedThirdNode.prevId).toEqual(storedSecondNode.id);
      expect(storedThirdNode.nextId).toEqual(undefined);
    });
  });

  describe("removeMessage", () => {
    it("should remove message from the middle", async () => {
      await service.addMessage(channelId, defaultMessage);
      const secondMessage = createMessage(1);
      await service.addMessage(channelId, secondMessage);
      const thirdMessage = createMessage(2);
      await service.addMessage(channelId, thirdMessage);
      const store = getStore();

      await service.removeMessage(channelId, secondMessage.id);

      const tailNode = await store.safeGet("tailId");
      const headNode = await store.safeGet("headId");
      const firstNode = await store.safeGet(
        new Node(defaultMessage.id, defaultMessage).id,
      );
      const secondNode = await store.safeGet(
        new Node(secondMessage.id, secondMessage).id,
      );

      const thirdNode = await store.safeGet(
        new Node(thirdMessage.id, thirdMessage).id,
      );

      expect(firstNode).toEqual(headNode);
      expect(secondNode).toBeUndefined();
      expect(thirdNode).toEqual(tailNode);
      const storedFirstNode = Node.of<typeof defaultMessage>(firstNode!);
      const storedThirdNode = Node.of<typeof thirdMessage>(thirdNode!);

      expect(storedFirstNode.nextId).toEqual(storedThirdNode.id);
      expect(storedThirdNode.prevId).toEqual(storedFirstNode.id);
    });

    it("should remove bottom message", async () => {
      await service.addMessage(channelId, defaultMessage);
      const secondMessage = createMessage(1);
      await service.addMessage(channelId, secondMessage);
      const thirdMessage = createMessage(2);
      await service.addMessage(channelId, thirdMessage);
      const store = getStore();

      await service.removeMessage(channelId, thirdMessage.id);

      const tailNode = await store.safeGet("tailId");
      const headNode = await store.safeGet("headId");
      const firstNode = await store.safeGet(
        new Node(defaultMessage.id, defaultMessage).id,
      );
      const secondNode = await store.safeGet(
        new Node(secondMessage.id, secondMessage).id,
      );

      const thirdNode = await store.safeGet(
        new Node(thirdMessage.id, thirdMessage).id,
      );

      expect(firstNode).toEqual(headNode);
      expect(secondNode).toEqual(tailNode);
      expect(thirdNode).toBeUndefined();
      const storedFirstNode = Node.of<typeof defaultMessage>(firstNode!);
      const storedSecondNode = Node.of<typeof thirdMessage>(secondNode!);

      expect(storedFirstNode.nextId).toEqual(storedSecondNode.id);
      expect(storedSecondNode.prevId).toEqual(storedFirstNode.id);
    });

    it("should remove top message", async () => {
      await service.addMessage(channelId, defaultMessage);
      const secondMessage = createMessage(1);
      await service.addMessage(channelId, secondMessage);
      const thirdMessage = createMessage(2);
      await service.addMessage(channelId, thirdMessage);
      const store = getStore();

      await service.removeMessage(channelId, defaultMessage.id);

      const tailNode = await store.safeGet("tailId");
      const headNode = await store.safeGet("headId");
      const firstNode = await store.safeGet(
        new Node(defaultMessage.id, defaultMessage).id,
      );
      const secondNode = await store.safeGet(
        new Node(secondMessage.id, secondMessage).id,
      );

      const thirdNode = await store.safeGet(
        new Node(thirdMessage.id, thirdMessage).id,
      );

      expect(firstNode).toBeUndefined();
      expect(secondNode).toEqual(headNode);
      expect(thirdNode).toEqual(tailNode);
      const storedSecondNode = Node.of<typeof secondMessage>(secondNode!);
      const storedThirdNode = Node.of<typeof thirdMessage>(thirdNode!);

      expect(storedSecondNode.nextId).toEqual(storedThirdNode.id);
      expect(storedThirdNode.prevId).toEqual(storedSecondNode.id);
    });
  });

  describe("isEmpty", () => {
    it("should return true when empty", async () => {
      expect(await service.isEmpty(channelId)).toBeTruthy();
    });
  });

  describe("cleanMessages", () => {
    it("should remove all messages for channel", async () => {
      await service.addMessage(channelId, defaultMessage);
      await service.addMessage(channelId, createMessage(1));
      await service.cleanMessages(channelId);
      expect(await service.isEmpty(channelId)).toBeTruthy();
    });
  });

  describe("safeGetAllMessages", () => {
    it("should return all messages for channel", async () => {
      expect(await service.safeGetAllMessages(channelId)).toEqual([]);
      await service.addMessage(channelId, defaultMessage);
      const secondMessage = createMessage(1);
      await service.addMessage(channelId, secondMessage);
      expect(await service.safeGetAllMessages(channelId)).toEqual([
        defaultMessage,
        secondMessage,
      ]);
    });
  });

  describe("getTopMessage", () => {
    it("should return top message for channel when channel store is not empty", async () => {
      await service.addMessage(channelId, defaultMessage);
      const secondMessage = createMessage(1);
      await service.addMessage(channelId, secondMessage);
      const store = getStore();
      const headNode = await store.safeGet("headId");
      const topNode = await service.getTopMessage(channelId);
      expect(topNode).toEqual(Node.of<typeof defaultMessage>(headNode!));
    });

    it("should return undefined if channel store is empty", async () => {
      const topNode = await service.getTopMessage(channelId);
      expect(topNode).toBeUndefined();
    });
  });

  describe("each", () => {
    it("should iterate over messages", async () => {
      await service.addMessage(channelId, defaultMessage);
      const secondMessage = createMessage(1);
      await service.addMessage(channelId, secondMessage);

      const processedMessageIds: string[] = [];

      await service.each(channelId, async (msg) => {
        processedMessageIds.push(msg.id);
      });

      expect(processedMessageIds).toEqual([
        defaultMessage.id,
        secondMessage.id,
      ]);
    });
  });

  describe("update", () => {
    it("should not update not existed message", async () => {
      await service.addMessage(channelId, defaultMessage);
      const secondMessage = createMessage(1);

      await service.updateMessage(channelId, secondMessage);

      const store = getStore();
      const secondMessageNode = await store.safeGet(secondMessage.id);

      expect(secondMessageNode).toBeUndefined();
    });

    it("should update existed message", async () => {
      await service.addMessage(channelId, defaultMessage);
      const secondMessage = createMessage(1);
      await service.addMessage(channelId, secondMessage);
      await service.updateMessage(
        channelId,
        new MessageDto(defaultMessage.id, defaultMessage.type, {
          index: "new",
        }),
      );

      const topNode = await service.getTopMessage<
        { index: string },
        typeof defaultMessage.type
      >(channelId);

      expect(topNode?.data.body.index).toBe("new");
      expect(topNode?.prevId).toBeUndefined();
      expect(topNode?.nextId).toBe(secondMessage.id);
    });
  });
});
