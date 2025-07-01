import { Injectable, Logger } from "@nestjs/common";
import { MessageBusStoreService } from "./messageBus.store";
import { MessageDto } from "./messageBus.dto";
import { Hash } from "viem";
import { MemoryQueueService } from "core/queue/queue.service";

@Injectable()
export class MessageBusService {
  private readonly eventListeners: {
    [event: string]: ((
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      message: MessageDto<any, any>,
    ) => Promise<void> | void)[];
  } = {};

  private logger = new Logger("MessageBusService");

  constructor(
    private readonly messageBusStore: MessageBusStoreService,
    private readonly memoryQueue: MemoryQueueService,
  ) {}

  private queueKey(postfix: string) {
    return `messageBusService:${postfix}`;
  }

  on<Body, Type extends string = string>(
    event: string,
    listener: (message: MessageDto<Body, Type>) => Promise<void> | void,
  ) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(listener);
  }

  /**
   *
   * @param channelId
   * @param message json-friendly serialized version of the message
   */
  emitFor<Body, Type extends string = string>(
    channelId: Hash,
    message: MessageDto<Body, Type>,
  ) {
    this.memoryQueue.schedule(this.queueKey(channelId), () =>
      this.messageBusStore.addMessage(channelId, message).then((uniq) => {
        // prevent minting until prev is completed
        if (uniq) {
          this.emit(message);
        }
      }),
    );
  }

  private emit<Body, Type extends string = string>(
    message: MessageDto<Body, Type>,
  ) {
    if (this.eventListeners[message.type]) {
      this.logger.debug(() => `Emit message ${message.id}`);
      this.eventListeners[message.type].forEach((listener) => {
        listener(message);
      });
    }
  }

  async complete(channelId: Hash, messageId: string) {
    const [error] = await this.memoryQueue.schedule(
      this.queueKey(channelId),
      () => this.messageBusStore.removeMessage(channelId, messageId),
    );
    if (error) {
      throw error;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  update(channelId: Hash, message: MessageDto<any, string>) {
    /**
     * update is parallel safe
     */
    return this.messageBusStore.updateMessage(channelId, message);
  }

  hasPendingMessages(channelId: Hash) {
    return !this.messageBusStore.isEmpty(channelId);
  }

  async processFailedMessages(channelId: Hash) {
    const [error] = await this.memoryQueue.schedule(
      this.queueKey(channelId),
      () =>
        this.messageBusStore.each(channelId, async (msg) => {
          this.logger.log(`Process ${msg.id} uncompleted message`);
          await this.messageBusStore.removeMessage(channelId, msg.id);
          this.emit(msg);
        }),
    );
    if (error) {
      this.logger.warn(error.message);
    }
  }

  async registerSideMessage<Body, Type extends string = string>(
    mainMessageId: string,
    sideMessage: MessageDto<Body, Type>,
  ) {
    const [error] = await this.memoryQueue.schedule(
      this.queueKey(mainMessageId),
      () => this.messageBusStore.addSideMessage(mainMessageId, sideMessage),
    );
    if (error) {
      throw error;
    }
  }

  async activateSideMessages(channelId: Hash, mainMessageId: string) {
    const sideMessages =
      await this.messageBusStore.getAllSideMessages(mainMessageId);
    sideMessages.forEach((message) => {
      this.emitFor(channelId, message);
    });
  }
}
