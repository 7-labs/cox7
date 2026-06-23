DOCKER ?= docker
UPDATER_RUNNER ?= host
UPDATER_IMAGE ?= cox7-updater:local
UPDATER_ENV_FILE ?= updater/.env
UPDATER_NETWORK ?= supabase_default
DOCKER_BUILD_NETWORK ?= host
NODE_BASE_IMAGE ?= public.ecr.aws/docker/library/node:22-alpine

UPDATER_ENV_ARGS := $(shell if [ -f "$(UPDATER_ENV_FILE)" ]; then printf '%s' "--env-file $(UPDATER_ENV_FILE)"; fi)
UPDATER_NETWORK_ARGS := $(shell if $(DOCKER) network inspect "$(UPDATER_NETWORK)" >/dev/null 2>&1; then printf '%s' "--network $(UPDATER_NETWORK)"; fi)

.PHONY: build-updater update update-dry seed logs

build-updater:
ifeq ($(UPDATER_RUNNER),docker)
	$(DOCKER) build --network=$(DOCKER_BUILD_NETWORK) --build-arg NODE_BASE_IMAGE=$(NODE_BASE_IMAGE) -f updater/Dockerfile -t $(UPDATER_IMAGE) .
else
	@test -d updater/node_modules || (echo "updater/node_modules is missing; run npm install in updater on the approved runtime lane" && exit 1)
endif

update: build-updater
ifeq ($(UPDATER_RUNNER),docker)
	$(DOCKER) run --rm $(UPDATER_ENV_ARGS) $(UPDATER_NETWORK_ARGS) $(UPDATER_IMAGE)
else
	cd updater && npm run start
endif

update-dry: build-updater
ifeq ($(UPDATER_RUNNER),docker)
	$(DOCKER) run --rm $(UPDATER_ENV_ARGS) $(UPDATER_NETWORK_ARGS) $(UPDATER_IMAGE) npx tsx --tsconfig tsconfig.json src/main.ts --dry-run
else
	cd updater && npm run dry-run
endif

seed: build-updater
ifeq ($(UPDATER_RUNNER),docker)
	$(DOCKER) run --rm $(UPDATER_ENV_ARGS) $(UPDATER_NETWORK_ARGS) $(UPDATER_IMAGE) npx tsx --tsconfig tsconfig.json src/main.ts --seed
else
	cd updater && npm run start -- --seed
endif

logs:
	@echo "Use journalctl after systemd install: journalctl -u cox7-updater.service -n 200 --no-pager"
	@echo "For one-off runs, inspect the terminal output or /tmp run logs created during manual validation."
