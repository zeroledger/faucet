export const OFFCHAIN_SPENDING_ABI = [
  {
    components: [
      {
        name: "value",
        type: "uint240",
      },
      {
        name: "recipient",
        type: "address",
      },
      {
        name: "factor",
        type: "uint8",
      },
    ],
    internalType: "struct RecipientConfig[]",
    name: "config",
    type: "tuple[]",
  },
];
