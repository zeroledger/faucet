import { Injectable, Logger } from "@nestjs/common";
import { type Hash } from "viem";
import { MessageDto } from "./messageBus.dto";

import { DataSource } from "core/db/leveldb.provider";
import { LevelDBException } from "core/db/leveldb.errors";

export const getMessageBusEntityKey = (id: string) => ({
  name: `${id}.messages`,
});

type MessageId = string;

type Batch = (
  | {
      type: "del";
      key: string;
    }
  | {
      type: "put";
      key: string;
      value: string;
    }
)[];

export class Node<T> {
  constructor(
    public id: string,
    public data: T,
    public prevId?: string,
    public nextId?: string,
  ) {}

  stringify() {
    return JSON.stringify(this);
  }

  static of<T>(data: string) {
    const parsed = JSON.parse(data);
    return new Node<T>(parsed.id, parsed.data, parsed.prevId, parsed.nextId);
  }
}

@Injectable()
export class MessageBusStoreService {
  constructor(readonly dataSource: DataSource) {}

  private _store(id: string) {
    return this.dataSource.getEntityLevel(getMessageBusEntityKey(id));
  }

  private async _getHeadNode<Body, Type extends string>(channelId: Hash) {
    return this._getMessageNode<Body, Type>(channelId, "headId");
  }

  private async _getTailNode<Body, Type extends string>(channelId: Hash) {
    return this._getMessageNode<Body, Type>(channelId, "tailId");
  }

  private async _getMessageNode<Body, Type extends string>(
    channelId: Hash,
    messageId: MessageId,
  ) {
    try {
      const source = await this._store(channelId).safeGet(messageId);
      if (!source) {
        return;
      }
      return Node.of<MessageDto<Body, Type>>(source);
    } catch (error) {
      throw new LevelDBException(
        (error as Error).message,
        "MessageBusStoreService._getMessageNode",
      );
    }
  }

  async has(channelId: Hash, messageId: string) {
    try {
      const source = await this._store(channelId).safeGet(messageId);
      if (!source) {
        return false;
      }
      return true;
    } catch (error) {
      throw new LevelDBException(
        (error as Error).message,
        "MessageBusStoreService._getMessageNode",
      );
    }
  }

  async updateMessage<Body, Type extends string>(
    channelId: Hash,
    message: MessageDto<Body, Type>,
  ) {
    const msg = await this._getMessageNode<Body, Type>(channelId, message.id);
    if (!msg) {
      Logger.warn(
        `Attempt to update non-existed message ${message.id} for channel ${channelId}`,
      );
      return;
    }

    const node = new Node(message.id, message, msg.prevId, msg.nextId);

    const [headNode, tailNode] = await Promise.all([
      this._getHeadNode(channelId),
      this._getTailNode(channelId),
    ]);

    const batch: Batch = [
      {
        type: "put",
        key: node.id,
        value: node.stringify(),
      },
    ];

    if (headNode && node.id === headNode.id) {
      batch.push({
        type: "put",
        key: "headId",
        value: node.stringify(),
      });
    }
    if (tailNode && node.id === tailNode.id) {
      batch.push({
        type: "put",
        key: "tailId",
        value: node.stringify(),
      });
    }

    await this._store(channelId).batch(batch);
  }

  async addMessage<Body, Type extends string>(
    channelId: Hash,
    message: MessageDto<Body, Type>,
  ) {
    if (await this.has(channelId, message.id)) {
      return false;
    }
    const node = new Node(message.id, message);

    const [headNode, tailNode] = await Promise.all([
      this._getHeadNode(channelId),
      this._getTailNode(channelId),
    ]);

    const batch: Batch = [];
    if (!headNode) {
      batch.push({
        type: "put",
        key: "headId",
        value: node.stringify(),
      });
    }
    if (tailNode && headNode && tailNode.prevId === undefined) {
      headNode.nextId = node.id;

      node.prevId = headNode.id;

      batch.push({
        type: "put",
        key: "headId",
        value: headNode.stringify(),
      });
    }
    if (tailNode) {
      tailNode.nextId = node.id;

      node.prevId = tailNode.id;

      batch.push({
        type: "put",
        key: tailNode.id,
        value: tailNode.stringify(),
      });
    }
    batch.push({
      type: "put",
      key: "tailId",
      value: node.stringify(),
    });
    batch.push({
      type: "put",
      key: node.id,
      value: node.stringify(),
    });
    await this._store(channelId).batch(batch);
    return true;
  }

  async removeMessage<Body, Type extends string>(
    channelId: Hash,
    messageId: string,
  ) {
    const context = "MessageBusStoreService.removeMessage";
    const logger = new Logger(context);
    const messageNode = await this._getMessageNode(channelId, messageId);
    if (!messageNode) {
      logger.warn(`Message ${messageId} for channel ${channelId} is not found`);
      return;
    }
    const headNode = await this._getHeadNode(channelId);
    const tailNode = await this._getTailNode(channelId);
    if (tailNode && headNode && tailNode.prevId === undefined) {
      return this.cleanMessages(channelId);
    }

    if (headNode && messageNode.id === headNode.id) {
      const nextNode = (await this._getMessageNode(
        channelId,
        messageNode.nextId!,
      )) as Node<MessageDto<Body, Type>>;
      nextNode.prevId = undefined;
      const batch: Batch = [
        {
          type: "put",
          key: nextNode.id,
          value: nextNode.stringify(),
        },
        {
          type: "put",
          key: "headId",
          value: nextNode.stringify(),
        },
        { type: "del", key: messageNode.id },
      ];

      if (tailNode && nextNode.id === tailNode.id) {
        tailNode.prevId = undefined;
        batch.push({
          type: "put",
          key: "tailId",
          value: tailNode.stringify(),
        });
      }
      return this._store(channelId).batch(batch);
    }

    if (tailNode && messageNode.id === tailNode.id) {
      const prevNode = (await this._getMessageNode(
        channelId,
        messageNode.prevId!,
      )) as Node<MessageDto<Body, Type>>;
      prevNode.nextId = undefined;
      const batch: Batch = [
        {
          type: "put",
          key: prevNode.id,
          value: prevNode.stringify(),
        },
        {
          type: "put",
          key: "tailId",
          value: prevNode.stringify(),
        },
        { type: "del", key: messageId },
      ];
      if (headNode && prevNode.id === headNode.id) {
        headNode.nextId = undefined;
        batch.push({
          type: "put",
          key: "headId",
          value: headNode.stringify(),
        });
      }
      return this._store(channelId).batch(batch);
    }

    const nextNode = (await this._getMessageNode(
      channelId,
      messageNode.nextId!,
    )) as Node<MessageDto<Body, Type>>;
    const prevNode = (await this._getMessageNode(
      channelId,
      messageNode.prevId!,
    )) as Node<MessageDto<Body, Type>>;

    prevNode.nextId = nextNode.id;
    nextNode.prevId = prevNode.id;

    const batch: Batch = [
      {
        type: "put",
        key: prevNode.id,
        value: prevNode.stringify(),
      },
      {
        type: "put",
        key: nextNode.id,
        value: nextNode.stringify(),
      },
      { type: "del", key: messageId },
    ];

    if (headNode && prevNode.id === headNode.id) {
      headNode.nextId = nextNode.id;
      batch.push({
        type: "put",
        key: "headId",
        value: headNode.stringify(),
      });
    }

    if (tailNode && nextNode.id === tailNode.id) {
      tailNode.prevId = prevNode.id;
      batch.push({
        type: "put",
        key: "tailId",
        value: tailNode.stringify(),
      });
    }

    await this._store(channelId).batch(batch);
  }

  /**
   * @todo: clear side messages
   */
  async cleanMessages(channelId: Hash) {
    await this._store(channelId).clear();
  }

  async each(
    channelId: Hash,
    fn: (msg: MessageDto<unknown, string>) => Promise<void>,
  ) {
    /**
     * store to filter duplicated messages of head and tail
     */
    const duplicates: Record<string, true> = {};

    const tail = await this._getTailNode(channelId);
    let node = await this._getHeadNode(channelId);

    while (node) {
      if (!duplicates[node.data.id]) {
        await fn(node.data);
        duplicates[node.data.id] = true;
      }
      node =
        node.nextId && node.id != tail?.id
          ? await this._getMessageNode(channelId, node.nextId)
          : undefined;
    }
  }

  /**
   * Order can be wrong
   * @param channelId
   * @returns
   */
  async safeGetAllMessages<Body, Type extends string>(channelId: Hash) {
    const logger = new Logger("MessageBusStoreService.safeGet");
    try {
      const messageNodes = (await this._store(channelId)
        .values()
        .all()) as string[];
      logger.debug(() => `Found message nodes ${messageNodes.length}`);
      const filters: Record<string, true> = {};
      const messages: MessageDto<Body, Type>[] = messageNodes
        .map((messageNode) => {
          const node = Node.of<MessageDto<Body, Type>>(messageNode);
          return node.data;
        })
        .filter((msg) => {
          if (filters[msg.id]) {
            return false;
          }
          filters[msg.id] = true;
          return true;
        });
      return messages;
    } catch (error) {
      logger.error(error);
      return [];
    }
  }

  async getTopMessage<Body, Type extends string>(channelId: Hash) {
    return this._getHeadNode<Body, Type>(channelId);
  }

  async isEmpty(channelId: Hash) {
    const rawHeadNode = await this._store(channelId).safeGet("headId");
    return !rawHeadNode;
  }

  /**
   * @dev Side messages are not ordered.
   */
  async addSideMessage<Body, Type extends string>(
    mainMessageId: MessageId,
    sideMessage: MessageDto<Body, Type>,
  ) {
    await this._store(mainMessageId).put(
      sideMessage.id,
      JSON.stringify(sideMessage),
    );
  }

  async getAllSideMessages(mainMessageId: string) {
    const messages = (await this._store(mainMessageId).values().all()).map(
      (message) => {
        const parsed = JSON.parse(message);
        return new MessageDto(parsed.id, parsed.type, parsed.body);
      },
    );

    await this._store(mainMessageId).clear();

    return messages;
  }
}
