
include .account
export

REPO = ghcr.io/pixelaw/server
VERSION = $(shell cat VERSION)


docker_build:
	echo $$private_key && \
	docker build -t $(REPO):$(VERSION) -t $(REPO):latest \
	--secret id=DOJO_KEYSTORE_PASSWORD \
  	--network=host \
	--progress=plain .

docker_run:
	docker run \
		--name pixelaw-server \
		--rm \
		-ti \
		-p 3001:3001 \
		-e WORLD_ADDRESS=0xfc685b398bc4692ab3a4acd380859e71f97d2c319f188854d3a01948ba276a \
		$(REPO):$(VERSION)

docker_shell:
	docker run \
		--name pixelaw-server \
		--rm \
		-ti \
		-p 3001:3001 \
		-e WORLD_ADDRESS=0xfc685b398bc4692ab3a4acd380859e71f97d2c319f188854d3a01948ba276a \
		$(REPO):$(VERSION) \
		/bin/bash
