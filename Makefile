update:
	docker compose --profile updater run --rm cox7-updater

update-dry:
	docker compose --profile updater run --rm cox7-updater npx tsx --tsconfig tsconfig.json src/main.ts --dry-run

seed:
	docker compose --profile updater run --rm cox7-updater npx tsx --tsconfig tsconfig.json src/main.ts --seed

logs:
	docker compose logs --tail=200 cox7-updater
