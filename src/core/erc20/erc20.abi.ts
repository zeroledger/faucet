export const ERC_20_WITH_MINT_ABI = [
  {
    type: "error",
    inputs: [
      {
        name: "spender",
        type: "address",
        baseType: "address",
      },
      {
        name: "allowance",
        type: "uint256",
        baseType: "uint256",
      },
      {
        name: "needed",
        type: "uint256",
        baseType: "uint256",
      },
    ],
    name: "ERC20InsufficientAllowance",
  },
  {
    type: "error",
    inputs: [
      {
        name: "sender",
        type: "address",
        baseType: "address",
      },
      {
        name: "balance",
        type: "uint256",
        baseType: "uint256",
      },
      {
        name: "needed",
        type: "uint256",
        baseType: "uint256",
      },
    ],
    name: "ERC20InsufficientBalance",
  },
  {
    type: "error",
    inputs: [
      {
        name: "approver",
        type: "address",
        baseType: "address",
      },
    ],
    name: "ERC20InvalidApprover",
  },
  {
    type: "error",
    inputs: [
      {
        name: "receiver",
        type: "address",
        baseType: "address",
      },
    ],
    name: "ERC20InvalidReceiver",
  },
  {
    type: "error",
    inputs: [
      {
        name: "sender",
        type: "address",
        baseType: "address",
      },
    ],
    name: "ERC20InvalidSender",
  },
  {
    type: "error",
    inputs: [
      {
        name: "spender",
        type: "address",
        baseType: "address",
      },
    ],
    name: "ERC20InvalidSpender",
  },
  {
    type: "event",
    inputs: [
      {
        name: "owner",
        type: "address",
        baseType: "address",
        indexed: true,
      },
      {
        name: "spender",
        type: "address",
        baseType: "address",
        indexed: true,
      },
      {
        name: "value",
        type: "uint256",
        baseType: "uint256",
        indexed: false,
      },
    ],
    name: "Approval",
    anonymous: false,
  },
  {
    type: "event",
    inputs: [
      {
        name: "from",
        type: "address",
        baseType: "address",
        indexed: true,
      },
      {
        name: "to",
        type: "address",
        baseType: "address",
        indexed: true,
      },
      {
        name: "value",
        type: "uint256",
        baseType: "uint256",
        indexed: false,
      },
    ],
    name: "Transfer",
    anonymous: false,
  },
  {
    type: "function",
    inputs: [
      {
        name: "owner",
        type: "address",
        baseType: "address",
      },
      {
        name: "spender",
        type: "address",
        baseType: "address",
      },
    ],
    name: "allowance",
    constant: true,
    outputs: [
      {
        name: "",
        type: "uint256",
        baseType: "uint256",
      },
    ],
    stateMutability: "view",
    payable: false,
  },
  {
    type: "function",
    inputs: [
      {
        name: "spender",
        type: "address",
        baseType: "address",
      },
      {
        name: "value",
        type: "uint256",
        baseType: "uint256",
      },
    ],
    name: "approve",
    constant: false,
    outputs: [
      {
        name: "",
        type: "bool",
        baseType: "bool",
      },
    ],
    stateMutability: "nonpayable",
    payable: false,
  },
  {
    type: "function",
    inputs: [
      {
        name: "account",
        type: "address",
        baseType: "address",
      },
    ],
    name: "balanceOf",
    constant: true,
    outputs: [
      {
        name: "",
        type: "uint256",
        baseType: "uint256",
      },
    ],
    stateMutability: "view",
    payable: false,
  },
  {
    type: "function",
    inputs: [
      {
        name: "amount",
        type: "uint256",
        baseType: "uint256",
      },
    ],
    name: "burn",
    constant: false,
    outputs: [],
    stateMutability: "nonpayable",
    payable: false,
  },
  {
    type: "function",
    inputs: [],
    name: "decimals",
    constant: true,
    outputs: [
      {
        name: "",
        type: "uint8",
        baseType: "uint8",
      },
    ],
    stateMutability: "view",
    payable: false,
  },
  {
    type: "function",
    inputs: [
      {
        name: "to",
        type: "address",
        baseType: "address",
      },
      {
        name: "amount",
        type: "uint256",
        baseType: "uint256",
      },
    ],
    name: "mint",
    constant: false,
    outputs: [],
    stateMutability: "nonpayable",
    payable: false,
  },
  {
    type: "function",
    inputs: [],
    name: "name",
    constant: true,
    outputs: [
      {
        name: "",
        type: "string",
        baseType: "string",
      },
    ],
    stateMutability: "view",
    payable: false,
  },
  {
    type: "function",
    inputs: [],
    name: "symbol",
    constant: true,
    outputs: [
      {
        name: "",
        type: "string",
        baseType: "string",
      },
    ],
    stateMutability: "view",
    payable: false,
  },
  {
    type: "function",
    inputs: [],
    name: "totalSupply",
    constant: true,
    outputs: [
      {
        name: "",
        type: "uint256",
        baseType: "uint256",
      },
    ],
    stateMutability: "view",
    payable: false,
  },
  {
    type: "function",
    inputs: [
      {
        name: "to",
        type: "address",
        baseType: "address",
      },
      {
        name: "value",
        type: "uint256",
        baseType: "uint256",
      },
    ],
    name: "transfer",
    constant: false,
    outputs: [
      {
        name: "",
        type: "bool",
        baseType: "bool",
      },
    ],
    stateMutability: "nonpayable",
    payable: false,
  },
  {
    type: "function",
    inputs: [
      {
        name: "from",
        type: "address",
        baseType: "address",
      },
      {
        name: "to",
        type: "address",
        baseType: "address",
      },
      {
        name: "value",
        type: "uint256",
        baseType: "uint256",
      },
    ],
    name: "transferFrom",
    constant: false,
    outputs: [
      {
        name: "",
        type: "bool",
        baseType: "bool",
      },
    ],
    stateMutability: "nonpayable",
    payable: false,
  },
] as const;
