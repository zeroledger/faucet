SHELL := /bin/bash

-include .env

.PHONY: init typecheck clean lint test test.watch test.cov test.debug test.e2e pre-commit pre-push build lint-stg start start.dev start.debug start.debug.open start.prod up.dev build.prod up.prod clear.prod encrypt.prod

all: init clean typecheck test test.e2e

init:; npm i

typecheck :; npx tsc --noEmit --project tsconfig.json

clean :; rm -rf dist rm -rf .db rm -rf .db-test

lint :; npx eslint \{src,apps,libs,test\}/**/*.ts --fix

test :; npx jest --passWithNoTests --detectOpenHandles --forceExit

test.watch :; npx jest --passWithNoTests --watch

test.cov :; npx jest --passWithNoTests --coverage --detectOpenHandles --forceExit

test.debug :; node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand

test.e2e:; rm -rf .db/db-test; npx jest --config ./jest-e2e.config.ts --forceExit --detectOpenHandles;

pre-commit: typecheck lint-stg

pre-push : lint typecheck test

build:; npx nest build

build.watch:; npx nest build --watch

lint-stg :; npx lint-staged

adminJwt:; npx nest build && node dist/cli adminJwt

start:; npx nest start

start.dev:; npx nest start --watch

start.debug:; npx nest start --debug --watch

start.debug.open:; npx nest start --debug 0.0.0.0 --watch

start.prod:; node dist/main

# docker aliases

container.build:
	@docker compose -f docker-compose.yml build

container.up:
	@docker compose -f docker-compose.yml up -d

container.clear: 
	@docker compose -f docker-compose.yml down;

# encryption setup
encrypt:
	@npx dotenvx encrypt -f conf/.prod.secrets.env

-include ${FCT_PLUGIN_PATH}/makefile-external