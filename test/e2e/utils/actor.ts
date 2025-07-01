import { Client } from "core/clients/evm.clients";
import {
  Address,
  createWalletClient,
  http,
  parseEther,
  publicActions,
  toHex,
  Hash,
  encodeAbiParameters,
  keccak256,
  zeroAddress,
} from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { conf } from "../../mockAppConf";
import { ConfirmationDto } from "core/roundTransaction/roundTransaction.dto";
import { SimpleMerkleTree } from "@openzeppelin/merkle-tree";
import { PRYX_ABI } from "core/pryx/pryx.abi";
import { ERC_20_WITH_PERMIT_AND_FAUCET_ABI } from "core/erc20/erc20.abi";
import { PERMIT_TYPE } from "core/erc20/erc20.service";
import { format } from "core/utils";
import {
  DelegatedDepositDto,
  ForfeitRequestDto,
  NewNoteRequestDto,
  RecipientsConfig,
  SpendingRequestDto,
} from "main/main.dto";
import { NoteDto, ForfeitNote } from "core/pryx/pryx.dto";
import { computeRoundTransactionRoot } from "core/pryx/pryx.utils";
import { OFFCHAIN_SPENDING_ABI } from "main/spendings.abi";

const defaultFunding = {
  ercAmount: "1000",
  nativeAmount: "0.0005",
};

export class Actor {
  private pk = generatePrivateKey();
  readonly client: Readonly<Client> = createWalletClient({
    account: privateKeyToAccount(this.pk),
    chain: conf.chain,
    transport: http(),
  }).extend(publicActions) as Readonly<Client>;
  private readonly recipient = "0x67d886fb4de6f5de10e1abd0b91c0c741b96801d";

  public readonly depositValue = parseEther("10");
  // depositValue / 2n
  public readonly spendValue = parseEther("5");

  public readonly depositValueHex = toHex(this.depositValue);
  public readonly spendValueHex = toHex(this.spendValue);

  constructor() {}

  get address() {
    return this.client.account.address;
  }

  getFundParams(
    recipient?: Address,
    funding: Partial<typeof defaultFunding> = defaultFunding,
  ): {
    recipient?: Address;
    token: Address;
    ercAmount?: string;
    nativeAmount?: string;
  } {
    return {
      recipient,
      token: conf.token,
      ...funding,
    };
  }

  depositRequest() {
    return new NewNoteRequestDto([
      {
        recipient: this.address,
        value: this.depositValueHex,
        factor: Math.ceil(Math.random() * 255),
      },
    ]);
  }

  async validateAndPrepareDeposit(
    coordinatorDepositConfirmation: ConfirmationDto,
  ) {
    if (coordinatorDepositConfirmation.note.owner !== this.address) {
      throw new Error("WRONG_NOTE_OWNER");
    }

    if (coordinatorDepositConfirmation.note.value !== this.depositValueHex) {
      throw new Error("INVALID_NOTE_VALUE");
    }

    const note = NoteDto.of(coordinatorDepositConfirmation.note);

    const noteDigest = note.mask().digest();

    const isNoteIncluded = SimpleMerkleTree.verify(
      coordinatorDepositConfirmation.notesRoot,
      noteDigest,
      coordinatorDepositConfirmation.noteProof,
    );

    if (!isNoteIncluded) {
      throw new Error("INVALID_NOTES_PROOF");
    }

    const domain = await this.client.readContract({
      address: conf.pryx,
      abi: PRYX_ABI,
      functionName: "DOMAIN_SEPARATOR",
      args: [],
    });

    const roundTransactionRoot = computeRoundTransactionRoot(
      domain,
      coordinatorDepositConfirmation.notesRoot,
      conf.token,
    );

    await this.client.waitForTransactionReceipt({
      hash: coordinatorDepositConfirmation.txHash,
    });

    const roundTransactionOwner = await this.client.readContract({
      address: conf.pryx,
      abi: PRYX_ABI,
      functionName: "getRoundTransactionOwner",
      args: [roundTransactionRoot],
    });

    if (roundTransactionOwner === zeroAddress) {
      throw new Error("INVALID_ROUND_TRANSACTION_ROOT");
    }

    const depositPermitDeadline = BigInt(
      Math.round(Date.now() / 1000) + 10 * 60,
    );

    const permit = await this.signPermit(
      conf.token,
      conf.pryx,
      depositPermitDeadline,
      note.value,
    );

    return new DelegatedDepositDto(
      this.address,
      noteDigest,
      toHex(depositPermitDeadline),
      permit,
      await this.client.signMessage({
        message: {
          raw: note.hashLock,
        },
      }),
    );
  }

  async requestSpendParams(maskedNoteDigest: Hash, secret: Hash) {
    const recipientsConfig: RecipientsConfig = [
      {
        recipient: this.address,
        value: this.spendValueHex,
        factor: 0,
      },
      {
        recipient: this.recipient,
        value: this.spendValueHex,
        factor: 0,
      },
    ];
    return new SpendingRequestDto(
      [
        {
          maskedNoteDigest,
          secret,
        },
      ],
      recipientsConfig,
      await this.client.signMessage({
        message: {
          raw: keccak256(
            encodeAbiParameters(OFFCHAIN_SPENDING_ABI, [recipientsConfig]),
          ),
        },
      }),
    );
  }

  async forfeitRequest(confirmation: ConfirmationDto, lock: Hash) {
    await this.client.waitForTransactionReceipt({ hash: confirmation.txHash });
    const note = NoteDto.of(confirmation.note);
    const forfeitNote = new ForfeitNote(note.digest(), lock);

    return new ForfeitRequestDto([
      {
        maskedNoteDigest: confirmation.maskedNoteDigest,
        forfeitSignature: await this.client.signMessage({
          message: {
            raw: forfeitNote.digest(),
          },
        }),
      },
    ]);
  }

  private async signPermit(
    /** Address of the token to approve */
    contractAddress: Address,
    /** Address to grant allowance to */
    spenderAddress: Address,
    /** Expiration of this approval, in SECONDS */
    deadline: bigint,
    /** Amount to approve */
    value: bigint,
    /** Defaults to 1. Some tokens need a different version, check the [PERMIT INFORMATION](https://github.com/vacekj/wagmi-permit/blob/main/PERMIT.md) for more information */
    permitVersion: string = "1",
  ) {
    const contractConf = {
      address: contractAddress,
      abi: ERC_20_WITH_PERMIT_AND_FAUCET_ABI,
    };

    const data = await this.client.multicall({
      contracts: [
        {
          ...contractConf,
          functionName: "name",
        },
        {
          ...contractConf,
          functionName: "nonces",
          args: [this.address],
        },
      ],
    });

    const erc20Name = data[0].result;
    const nonce = data[1].result;

    const domainData = {
      name: erc20Name,
      /** We assume 1 if permit version is not specified */
      version: permitVersion,
      chainId: this.client.chain.id,
      verifyingContract: contractAddress,
    };

    const message = {
      owner: this.address,
      spender: spenderAddress,
      value,
      nonce,
      deadline,
    };

    return this.client
      .signTypedData({
        message,
        domain: domainData,
        primaryType: "Permit",
        types: PERMIT_TYPE,
      })
      .then(format);
  }
}
