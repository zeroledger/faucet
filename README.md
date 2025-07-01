[![Quality gate](https://github.com/pryx-protocol/coordinator/actions/workflows/quality-gate.yml/badge.svg)](https://github.com/pryx-protocol/coordinator/actions/workflows/quality-gate.yml)

# Pryx Coordinator

A Coordinator Node for Pryx Protocol

## Technologies

- [Nestjs](https://nestjs.com/) with [Typescript](https://www.typescriptlang.org/) and [SWC](https://swc.rs/)
- [LevelDB](https://leveljs.org/) for fast record management
- [Jest](https://jestjs.io/) for unit and e2e testing
- [Docker](https://www.docker.com/) & [Docker-compose](https://docs.docker.com/compose/) for dev & prod.
- linters, code formatter, pre-commit and pre-push hooks
- Custom github action and quality gate workflow for fast CI strategy implementation
- Flexible env configuration with encryption, thanks to [dotenvx](https://dotenvx.com/)

## Requirements

- [Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
  - You'll know you've done it right if you can run `git --version`
- [Node.js](https://nodejs.org/en) v20+
- [Make](https://www.gnu.org/software/make/manual/make.html)
- [Docker](https://www.docker.com/)

## API SPEC

`/api` endpoint

## Installation

```sh
make
```

## Configuration

### Unsecure code

This is PoC code. Please use it carefully

### Environment

To properly run coordinator you'll need to configure env files in `conf/` directory. All environment variabless
are commented for context and assigned to mock values at `*.example` files.

### Local development

1. Create and modify .env file in `conf` folder:

   ```sh
   cp conf/.example.env conf/.env \
   ```

   **note**: for running with docker, please set environments in `conf/node-*` folders according to docker-compose.yml

### Production

1. Create and modify .prod.secrets.env files:

   ```sh
   cp conf/.example.secrets.env conf/.prod.secrets.env
   ```

2. Encrypt secrets:

   ```sh
   make encrypt
   ```

   **note**: generated .prod.secrets.env can be publicly shared with anyone after encryption

3. Keep generated .env.keys safe and do not commit it into repo

## Running

### Locally

```sh
# Prod mode
make build; make start.prod
```

```sh
# dev mode with life updates & debug
make start.debug.open
```

### Docker

```sh
# production mode
make up
```

#### DB access issue

Please, check local db folder access in case of having DB opening issue

```sh
ERROR [ExceptionHandler] Database is not open
```

## Testing

```sh
# e2e tests
make test.e2e
```

```sh
# unit tests
make test
```

## Contributing

Contributions are always welcome! Open a PR or an issue!

## Notes

And you probably already have `make` installed... but if not [try looking here.](https://askubuntu.com/questions/161104/how-do-i-install-make)
