import { HttpStatus, INestMicroservice } from "@nestjs/common";
import { DataSource } from "core/db/leveldb.provider";
import { default as request } from "supertest";
import { Actor, setupTestApp } from "./utils";
import { JsonRpcServer } from "core/rpc";
import { Hash, toHex } from "viem";
import { randomBytes } from "node:crypto";
import { ConfirmationDto } from "core/roundTransaction/roundTransaction.dto";
import { validateNoteLockSecret } from "core/pryx/pryx.utils";

describe("/node (e2e)", () => {
  let app: INestMicroservice;
  let actor: Actor;
  const jsonRpcServer = new JsonRpcServer({ port: 3000 });
  const counter = () => toHex(randomBytes(32));

  const makeRpcCall = (method: string, params: unknown) =>
    request(jsonRpcServer.server!)
      .post("/rpc")
      .send({
        method,
        params,
        jsonrpc: "2.0",
        id: counter(),
      })
      .expect(HttpStatus.OK);

  const fund = async (_actor: Actor) => {
    const actorFunding = _actor.getFundParams(_actor.client.account.address, {
      ercAmount: "10",
      // nativeAmount: "0.0005",
    });

    /**
     * Obtain tokens for user
     */

    await makeRpcCall("faucet.obtainTestTokens", actorFunding);

    /**
     * Obtain tokens for coordinator
     */
    await makeRpcCall("faucet.obtainTestTokens", _actor.getFundParams());
  };

  afterEach(async () => {
    const db = app.get(DataSource);
    await db.clear();
    await app.close();
  }, 20_000);

  describe("Single Actor Actions", () => {
    beforeEach(async () => {
      actor = new Actor();
      app = await setupTestApp(jsonRpcServer, [
        // 'debug',
        "log",
        "fatal",
        "error",
      ]);
    }, 20_000);

    it("basic use case", async () => {
      await fund(actor);

      const initDepositResponse = await makeRpcCall(
        "main.requestDeposit",
        actor.depositRequest(),
      );

      const confirmation: ConfirmationDto = initDepositResponse.body.result[0];

      const depositReqParams =
        await actor.validateAndPrepareDeposit(confirmation);

      const delegateDepositResponse = await makeRpcCall(
        "main.deposit",
        depositReqParams,
      );

      expect(
        validateNoteLockSecret(
          confirmation.note.hashLock,
          delegateDepositResponse.body.result as Hash,
        ),
      ).toBeTruthy();

      const requestSpendParams = await actor.requestSpendParams(
        confirmation.maskedNoteDigest,
        delegateDepositResponse.body.result,
      );

      const spendResponse = await makeRpcCall(
        "main.requestSpend",
        requestSpendParams,
      );

      expect(spendResponse.body.result.length).toBe(2);

      const spendConfirmation: ConfirmationDto = spendResponse.body.result[0];

      const forfeitResponse = await makeRpcCall(
        "main.forfeit",
        await actor.forfeitRequest(
          confirmation,
          spendConfirmation.note.hashLock,
        ),
      );

      expect(
        validateNoteLockSecret(
          spendConfirmation.note.hashLock,
          forfeitResponse.body.result as Hash,
        ),
      ).toBeTruthy();
    }, 100_000);
  });
});
