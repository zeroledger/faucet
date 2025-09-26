interface IErrorWithMeta extends Error {
  status?: number;
  code?: string;
}

interface AggregateError extends Error {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors: any[];
}

type EncryptedData = {
  data: `0x${string}`;
};
