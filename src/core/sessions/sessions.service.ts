import { Injectable } from "@nestjs/common";
import { type Hash } from "viem";

@Injectable()
export class SessionsService {
  private sessions: Record<Hash, boolean> = {};

  closeSession(id: Hash) {
    delete this.sessions[id];
  }

  startSession(id: Hash) {
    if (this.isSessionActive(id)) {
      throw new Error(`Session ${id} started`);
    }
    this.sessions[id] = true;
  }

  isSessionActive(id: Hash) {
    return Boolean(this.sessions[id]);
  }

  closeSessions(ids: Hash[]) {
    ids.forEach((id) => this.closeSession(id));
  }

  startSessions(ids: Hash[]) {
    ids.forEach((id) => this.startSession(id));
  }
}
