.PHONY: dev build css lint

dev:
	npx tailwindcss -i ./input.css -o ./static/css/main.css --watch &
	zola serve

build:
	npx tailwindcss -i ./input.css -o ./static/css/main.css --minify
	zola build

css:
	npx tailwindcss -i ./input.css -o ./static/css/main.css --watch

lint:
	npx dprint check
	npx biome check static/js/
	djlint templates/ --check
	git diff --exit-code
