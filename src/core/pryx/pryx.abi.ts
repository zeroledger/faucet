const ERRORS_ABI = [
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "root",
        type: "bytes32",
      },
    ],
    name: "AlreadyCommitted",
    type: "error",
  },
  {
    inputs: [],
    name: "DepositDoesNotExist",
    type: "error",
  },
  {
    inputs: [],
    name: "DuplicatedDeposit",
    type: "error",
  },
  {
    inputs: [],
    name: "InconsistentNotesError",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidMerkleProof",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidNote",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidRedemptionStatus",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidSecret",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "expectedSigner",
        type: "address",
      },
    ],
    name: "InvalidSignature",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "expectedSigner",
        type: "address",
      },
    ],
    name: "InvalidSignatures",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidSweepRoot",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidToken",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "root",
        type: "bytes32",
      },
    ],
    name: "NotCommitted",
    type: "error",
  },
  {
    inputs: [],
    name: "TimeExpired",
    type: "error",
  },
  {
    inputs: [],
    name: "TimeHasNotPassed",
    type: "error",
  },
] as const;

export const PRYX_ABI = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  ...ERRORS_ABI,
  {
    inputs: [],
    name: "AccessControlBadConfirmation",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "neededRole",
        type: "bytes32",
      },
    ],
    name: "AccessControlUnauthorizedAccount",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "target",
        type: "address",
      },
    ],
    name: "AddressEmptyCode",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "implementation",
        type: "address",
      },
    ],
    name: "ERC1967InvalidImplementation",
    type: "error",
  },
  {
    inputs: [],
    name: "ERC1967NonPayable",
    type: "error",
  },
  {
    inputs: [],
    name: "FailedCall",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidInitialization",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidSweepRoot",
    type: "error",
  },
  {
    inputs: [],
    name: "NotInitializing",
    type: "error",
  },
  {
    inputs: [],
    name: "UUPSUnauthorizedCallContext",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "slot",
        type: "bytes32",
      },
    ],
    name: "UUPSUnsupportedProxiableUUID",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "encryptedDigest",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint240",
        name: "value",
        type: "uint240",
      },
    ],
    name: "CollaborativeRedemption",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "depositor",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint240",
        name: "value",
        type: "uint240",
      },
      {
        indexed: true,
        internalType: "address",
        name: "token",
        type: "address",
      },
    ],
    name: "Deposit",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "depositor",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint240",
        name: "value",
        type: "uint240",
      },
      {
        indexed: true,
        internalType: "address",
        name: "token",
        type: "address",
      },
    ],
    name: "DepositCancelled",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "depositor",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint240",
        name: "value",
        type: "uint240",
      },
      {
        indexed: true,
        internalType: "address",
        name: "token",
        type: "address",
      },
    ],
    name: "DepositCollected",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [],
    name: "EIP712DomainChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "encryptedDigest",
        type: "bytes32",
      },
    ],
    name: "ForceNoteWithdrawal",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint64",
        name: "version",
        type: "uint64",
      },
    ],
    name: "Initialized",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "roundTxRoot",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "token",
        type: "address",
      },
    ],
    name: "NewRoundTransaction",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "previousAdminRole",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "newAdminRole",
        type: "bytes32",
      },
    ],
    name: "RoleAdminChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "RoleGranted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "RoleRevoked",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "sweepRoot",
        type: "bytes32",
      },
    ],
    name: "Sweep",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "sweepRoot",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "token",
        type: "address",
      },
    ],
    name: "SweepChallenge",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "implementation",
        type: "address",
      },
    ],
    name: "Upgraded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "encryptedDigest",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint240",
        name: "value",
        type: "uint240",
      },
    ],
    name: "UserForceRedemptionChallenge",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "encryptedDigest",
        type: "bytes32",
      },
    ],
    name: "UserForceRedemptionChallengeCancel",
    type: "event",
  },
  {
    inputs: [],
    name: "DEFAULT_ADMIN_ROLE",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "DOMAIN_SEPARATOR",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "UPGRADE_INTERFACE_VERSION",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "bytes32",
            name: "hashLock",
            type: "bytes32",
          },
          {
            internalType: "address",
            name: "token",
            type: "address",
          },
          {
            internalType: "address",
            name: "depositor",
            type: "address",
          },
          {
            internalType: "uint240",
            name: "value",
            type: "uint240",
          },
        ],
        internalType: "struct StoredDepositParams",
        name: "params",
        type: "tuple",
      },
      {
        internalType: "address",
        name: "coordinator",
        type: "address",
      },
    ],
    name: "cancelDeposit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "token",
            type: "address",
          },
          {
            components: [
              {
                internalType: "address",
                name: "owner",
                type: "address",
              },
              {
                internalType: "bytes32",
                name: "hashLock",
                type: "bytes32",
              },
              {
                internalType: "uint240",
                name: "value",
                type: "uint240",
              },
              {
                internalType: "uint8",
                name: "factor",
                type: "uint8",
              },
            ],
            internalType: "struct Note",
            name: "note",
            type: "tuple",
          },
          {
            components: [
              {
                internalType: "uint8",
                name: "v",
                type: "uint8",
              },
              {
                internalType: "bytes32",
                name: "r",
                type: "bytes32",
              },
              {
                internalType: "bytes32",
                name: "s",
                type: "bytes32",
              },
            ],
            internalType: "struct Signature",
            name: "ownerSignature",
            type: "tuple",
          },
          {
            internalType: "uint256",
            name: "deadline",
            type: "uint256",
          },
          {
            components: [
              {
                internalType: "uint8",
                name: "v",
                type: "uint8",
              },
              {
                internalType: "bytes32",
                name: "r",
                type: "bytes32",
              },
              {
                internalType: "bytes32",
                name: "s",
                type: "bytes32",
              },
            ],
            internalType: "struct Signature",
            name: "permit",
            type: "tuple",
          },
        ],
        internalType: "struct CollaborativeRedemptionParams",
        name: "params",
        type: "tuple",
      },
    ],
    name: "collaborativeRedemption",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "bytes32",
            name: "hashLock",
            type: "bytes32",
          },
          {
            internalType: "address",
            name: "token",
            type: "address",
          },
          {
            internalType: "address",
            name: "depositor",
            type: "address",
          },
          {
            internalType: "uint240",
            name: "value",
            type: "uint240",
          },
        ],
        internalType: "struct StoredDepositParams",
        name: "params",
        type: "tuple",
      },
      {
        internalType: "bytes32",
        name: "coordinatorSecret",
        type: "bytes32",
      },
    ],
    name: "collectDeposit",
    outputs: [
      {
        internalType: "bytes32",
        name: "dh",
        type: "bytes32",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "token",
            type: "address",
          },
          {
            components: [
              {
                internalType: "bytes32",
                name: "mask",
                type: "bytes32",
              },
              {
                internalType: "uint240",
                name: "value",
                type: "uint240",
              },
            ],
            internalType: "struct MaskedNote[]",
            name: "notes",
            type: "tuple[]",
          },
          {
            internalType: "uint256",
            name: "deadline",
            type: "uint256",
          },
          {
            components: [
              {
                internalType: "uint8",
                name: "v",
                type: "uint8",
              },
              {
                internalType: "bytes32",
                name: "r",
                type: "bytes32",
              },
              {
                internalType: "bytes32",
                name: "s",
                type: "bytes32",
              },
            ],
            internalType: "struct Signature",
            name: "permit",
            type: "tuple",
          },
        ],
        internalType: "struct CommitParams",
        name: "params",
        type: "tuple",
      },
    ],
    name: "commit",
    outputs: [
      {
        internalType: "bytes32",
        name: "roundTxRoot",
        type: "bytes32",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "token",
            type: "address",
          },
          {
            internalType: "uint240",
            name: "value",
            type: "uint240",
          },
          {
            internalType: "uint256",
            name: "deadline",
            type: "uint256",
          },
          {
            internalType: "bytes32",
            name: "hashLock",
            type: "bytes32",
          },
          {
            internalType: "address",
            name: "depositor",
            type: "address",
          },
          {
            components: [
              {
                internalType: "uint8",
                name: "v",
                type: "uint8",
              },
              {
                internalType: "bytes32",
                name: "r",
                type: "bytes32",
              },
              {
                internalType: "bytes32",
                name: "s",
                type: "bytes32",
              },
            ],
            internalType: "struct Signature",
            name: "permit",
            type: "tuple",
          },
          {
            components: [
              {
                internalType: "uint8",
                name: "v",
                type: "uint8",
              },
              {
                internalType: "bytes32",
                name: "r",
                type: "bytes32",
              },
              {
                internalType: "bytes32",
                name: "s",
                type: "bytes32",
              },
            ],
            internalType: "struct Signature",
            name: "signedLock",
            type: "tuple",
          },
        ],
        internalType: "struct DepositParams",
        name: "params",
        type: "tuple",
      },
    ],
    name: "deposit",
    outputs: [
      {
        internalType: "bytes32",
        name: "dh",
        type: "bytes32",
      },
      {
        internalType: "uint256",
        name: "deadline",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "eip712Domain",
    outputs: [
      {
        internalType: "bytes1",
        name: "fields",
        type: "bytes1",
      },
      {
        internalType: "string",
        name: "name",
        type: "string",
      },
      {
        internalType: "string",
        name: "version",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "chainId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "verifyingContract",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "salt",
        type: "bytes32",
      },
      {
        internalType: "uint256[]",
        name: "extensions",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "bytes32",
            name: "hashLock",
            type: "bytes32",
          },
          {
            internalType: "address",
            name: "token",
            type: "address",
          },
          {
            internalType: "address",
            name: "depositor",
            type: "address",
          },
          {
            internalType: "uint240",
            name: "value",
            type: "uint240",
          },
        ],
        internalType: "struct StoredDepositParams",
        name: "params",
        type: "tuple",
      },
      {
        internalType: "address",
        name: "coordinator",
        type: "address",
      },
    ],
    name: "getDepositDeadline",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "encryptedDigest",
        type: "bytes32",
      },
    ],
    name: "getRedemptionState",
    outputs: [
      {
        components: [
          {
            internalType: "enum RedemptionStatus",
            name: "status",
            type: "uint8",
          },
          {
            internalType: "uint256",
            name: "deadline",
            type: "uint256",
          },
          {
            internalType: "uint240",
            name: "value",
            type: "uint240",
          },
          {
            internalType: "address",
            name: "token",
            type: "address",
          },
        ],
        internalType: "struct RedemptionState",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
    ],
    name: "getRoleAdmin",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "roundTransactionRoot",
        type: "bytes32",
      },
    ],
    name: "getRoundTransactionOwner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "grantRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "hasRole",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "challengeDeadline",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "deadlineIncrement",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "admin",
        type: "address",
      },
    ],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        components: [
          {
            internalType: "bytes32",
            name: "mask",
            type: "bytes32",
          },
          {
            internalType: "uint240",
            name: "value",
            type: "uint240",
          },
        ],
        internalType: "struct MaskedNote[]",
        name: "notes",
        type: "tuple[]",
      },
    ],
    name: "openSweepChallenge",
    outputs: [
      {
        internalType: "bytes32",
        name: "sweepRoot",
        type: "bytes32",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "bytes32",
            name: "maskedNoteDigest",
            type: "bytes32",
          },
          {
            internalType: "bytes32",
            name: "hashLock",
            type: "bytes32",
          },
        ],
        internalType: "struct Forfeit",
        name: "forfeit",
        type: "tuple",
      },
      {
        components: [
          {
            internalType: "uint8",
            name: "v",
            type: "uint8",
          },
          {
            internalType: "bytes32",
            name: "r",
            type: "bytes32",
          },
          {
            internalType: "bytes32",
            name: "s",
            type: "bytes32",
          },
        ],
        internalType: "struct Signature",
        name: "signature",
        type: "tuple",
      },
      {
        components: [
          {
            internalType: "address",
            name: "owner",
            type: "address",
          },
          {
            internalType: "bytes32",
            name: "hashLock",
            type: "bytes32",
          },
          {
            internalType: "uint240",
            name: "value",
            type: "uint240",
          },
          {
            internalType: "uint8",
            name: "factor",
            type: "uint8",
          },
        ],
        internalType: "struct Note",
        name: "note",
        type: "tuple",
      },
      {
        internalType: "bytes32",
        name: "coordinatorSecret",
        type: "bytes32",
      },
    ],
    name: "proofForfeit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "proxiableUUID",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "callerConfirmation",
        type: "address",
      },
    ],
    name: "renounceRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "revokeRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "token",
            type: "address",
          },
          {
            components: [
              {
                internalType: "address",
                name: "owner",
                type: "address",
              },
              {
                internalType: "bytes32",
                name: "hashLock",
                type: "bytes32",
              },
              {
                internalType: "uint240",
                name: "value",
                type: "uint240",
              },
              {
                internalType: "uint8",
                name: "factor",
                type: "uint8",
              },
            ],
            internalType: "struct Note",
            name: "note",
            type: "tuple",
          },
          {
            internalType: "bytes32[]",
            name: "notesProof",
            type: "bytes32[]",
          },
          {
            internalType: "bytes32",
            name: "notesRoot",
            type: "bytes32",
          },
          {
            internalType: "bytes32",
            name: "coordinatorSecret",
            type: "bytes32",
          },
        ],
        internalType: "struct RedemptionParams",
        name: "params",
        type: "tuple",
      },
      {
        components: [
          {
            internalType: "uint8",
            name: "v",
            type: "uint8",
          },
          {
            internalType: "bytes32",
            name: "r",
            type: "bytes32",
          },
          {
            internalType: "bytes32",
            name: "s",
            type: "bytes32",
          },
        ],
        internalType: "struct Signature",
        name: "ownerSignature",
        type: "tuple",
      },
    ],
    name: "startRedemptionChallenge",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes4",
        name: "interfaceId",
        type: "bytes4",
      },
    ],
    name: "supportsInterface",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "sweepRoot",
        type: "bytes32",
      },
    ],
    name: "sweep",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "challengeDeadline",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "deadlineIncrement",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "upgradeCallBack",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newImplementation",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
    ],
    name: "upgradeToAndCall",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "owner",
            type: "address",
          },
          {
            internalType: "bytes32",
            name: "hashLock",
            type: "bytes32",
          },
          {
            internalType: "uint240",
            name: "value",
            type: "uint240",
          },
          {
            internalType: "uint8",
            name: "factor",
            type: "uint8",
          },
        ],
        internalType: "struct Note",
        name: "note",
        type: "tuple",
      },
    ],
    name: "withdrawNote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export const MASKED_NOTE_ABI = [
  {
    name: "encryptedOwner",
    type: "bytes32",
  },
  {
    name: "value",
    type: "uint240",
  },
];

export const NOTE_ABI = [
  {
    name: "owner",
    type: "address",
  },
  {
    name: "hashLock",
    type: "bytes32",
  },
  {
    name: "value",
    type: "uint240",
  },
  {
    name: "factor",
    type: "uint8",
  },
];

export const SECRET_ABI = [
  {
    name: "secret",
    type: "bytes32",
  },
];

export const MASK_ABI = [
  {
    name: "owner",
    type: "address",
  },
  {
    name: "hashLock",
    type: "bytes32",
  },
  {
    name: "factor",
    type: "uint8",
  },
];

export const FORFEIT_NOTE_ABI = [
  {
    name: "noteDigest",
    type: "bytes32",
  },
  {
    name: "hashLock",
    type: "bytes32",
  },
];

export const ROUND_TRANSACTION_ROOT_ABI = [
  {
    name: "domain",
    type: "bytes32",
  },
  {
    name: "notesRoot",
    type: "bytes32",
  },
  {
    name: "token",
    type: "address",
  },
];

export const DEPOSIT_HASH_ABI = [
  {
    components: [
      {
        internalType: "bytes32",
        name: "hashLock",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        internalType: "address",
        name: "depositor",
        type: "address",
      },
      {
        internalType: "uint240",
        name: "value",
        type: "uint240",
      },
    ],
    name: "params",
    type: "tuple",
  },
  {
    name: "coordinator",
    type: "address",
  },
];
