Build the project packages.

Steps:
1. If argument is "backend": run `make build-backend`
2. If argument is "web": run `make build-web`
3. If argument is "docker": run `make docker-build`
4. If argument is "docker-nocache": run `make docker-build-nocache`
5. If no argument: run `make build` to build all packages
6. Report any build errors

Argument: $ARGUMENTS (optional: backend, web, docker, docker-nocache)
