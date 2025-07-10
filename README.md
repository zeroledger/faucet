[![Quality gate](https://github.com/zeroledger/faucet/actions/workflows/quality-gate.yml/badge.svg)](https://github.com/zeroledger/faucet/actions/workflows/quality-gate.yml)

# Faucet Node

A Faucet Node for ZeroLedger protocol

## Technologies

- [Nestjs](https://nestjs.com/) with [Typescript](https://www.typescriptlang.org/) and [SWC](https://swc.rs/)
- [Jest](https://jestjs.io/) for unit and e2e testing
- [Docker](https://www.docker.com/) & [Docker-compose](https://docs.docker.com/compose/) for dev & prod.
- linters, code formatter, pre-commit and pre-push hooks
- Custom github action and quality gate workflow for fast CI strategy implementation
- Flexible env configuration with encryption, thanks to [dotenvx](https://dotenvx.com/)

## Requirements

- [Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
  - You'll know you've done it right if you can run `git --version`
- [Node.js](https://nodejs.org/en) v20+
- [Docker](https://www.docker.com/)

## Installation

```sh
npm i
```

## Configuration

### Unsecure code

This is PoC code. Please use it carefully

### Environment

To properly run node you'll need to configure env files in `conf/` directory. All environment variabless
are commented for context and assigned to mock values at `*.example` files.

### Local development

1. Create and modify .env file in `conf` folder:

   ```sh
   cp conf/.example.env conf/.env \
   ```

### Production

1. Create and modify env files:

   ```sh
   cp conf/.example.env conf/.prod.env
   ```

2. Encrypt secrets:

   ```sh
   npm run encrypt
   ```

   **note**: generated .prod.secrets.env can be publicly shared with anyone after encryption

3. Keep generated .env.keys safe and do not commit it into repo

## Running

### Locally

```sh
# Prod mode
npm run build; npm run dev
```

## Testing

```sh
# unit tests
npm run test
```

## Contributing

Contributions are always welcome! Open a PR or an issue!

## Notes

And you probably already have `make` installed... but if not [try looking here.](https://askubuntu.com/questions/161104/how-do-i-install-make)
