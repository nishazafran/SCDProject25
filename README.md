# NodeVault Project

## Overview

NodeVault is a Node.js-based application for storing, managing, and interacting with records securely. It uses MongoDB as the backend database. This project has been containerized using Docker and Docker Compose for easy setup and deployment.

## Features

* Add, list, update, delete, and search records.
* Sort records and export data.
* View vault statistics.
* Dockerized setup for local development.

## Prerequisites

* Docker
* Docker Compose
* Node.js (for local development if not using Docker)

## Getting Started with Docker

1. Clone the repository:

```bash
git clone https://github.com/nishazafran/SCDProject25.git
cd SCDProject25
```

2. Add your environment variables in the `.env` file:

```env
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=admin123
MONGO_DB=nodevaultDB
PORT=3000
MONGO_URI=mongodb://mongodb-server:27017/nodevaultDB
```

3. Build and start the containers:

```bash
docker compose up --build -d
```

4. Check running containers:

```bash
docker ps
```

5. Access the interactive NodeVault menu:

```bash
docker exec -it server-backend /bin/sh
node main.js
```

## Stopping Containers

```bash
docker compose down
```

## Notes

* The backend container depends on MongoDB. Ensure MongoDB container is running.
* All services are accessible via ports:

  * Backend: `http://localhost:3000`
  * MongoDB: `localhost:27017`

## Contributing

Feel free to fork the repository, make changes, and submit pull requests.

## License

ISC
