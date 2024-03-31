## Installation

```bash
$ cp .env.example .env
$ pnpm install
```

## Running the app

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod

# docker
$ docker-compose up -d
```

## Database commands
```bash
# run DB in docker
$ docker-compose up -d db

# generate migration
$ pnpm migrate:dev

# run migration
$ pnpm migrate:deploy

# run seed
$ pnpm seed
```
## Documentation
### Swagger
http://localhost:8080/docs
