# TeamFlow Backend

Spring Boot REST API for the TeamFlow workspace.

## Technology

- Java 17
- Spring Boot 3.4
- Spring Web, Spring Data JPA, Jakarta Validation
- MySQL Connector/J
- H2 for integration tests

## Configure MySQL

Initialize the MySQL database and tables by opening and running [`database/teamflow.sql`](./database/teamflow.sql) in MySQL Workbench, or use the configured local JDBC URL to let Hibernate create/update the tables when the database account has permission:

```sql
CREATE DATABASE teamflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

The schema contains `users`, `teams`, `team_members`, `projects`, `tasks`, and `notifications`. It also creates `project_members`, the join table required by the existing project-members API.

Configure connection values in the shell before starting the API:

```powershell
$env:DB_URL = "jdbc:mysql://localhost:3306/teamflow?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"
$env:DB_USERNAME = "root"
$env:DB_PASSWORD = "<your-local-mysql-password>"
```

Do not commit real database credentials. `spring.jpa.hibernate.ddl-auto=update` is convenient for local development; it creates/updates the tables from the entities. Use versioned schema migrations and a non-mutating Hibernate setting before production.

## Run

Install Maven 3.9+ and a JDK 17, then run from the `backend` directory:

```powershell
mvn spring-boot:run
```

The API listens on `http://localhost:8080`. Configure the comma-separated `CORS_ALLOWED_ORIGINS` environment variable if the frontend is served from another origin.

Run the integration suite without requiring a MySQL server:

```powershell
mvn test
```

## REST endpoints

All endpoints are under `/api` and accept/return JSON.

| Resource | Endpoints |
| --- | --- |
| Users | `GET/POST /api/users`, `GET/PUT/DELETE /api/users/{id}` |
| Teams | `GET/POST /api/teams`, `GET/PUT/DELETE /api/teams/{id}` |
| Projects | `GET/POST /api/projects`, `GET/PUT/DELETE /api/projects/{id}`; optional `?teamId={id}` |
| Tasks | `GET/POST /api/tasks`, `GET/PUT/DELETE /api/tasks/{id}`; optional `?projectId={id}`, `?assigneeId={id}`, `?status=todo` |
| Notifications | `GET /api/notifications?userId={id}[&unreadOnly=true]`, `POST /api/notifications`, `GET/DELETE /api/notifications/{id}`, `PATCH /api/notifications/{id}/read`, `PATCH /api/notifications/read-all?userId={id}` |

Task status values are `todo`, `in-progress`, and `done`; priorities are `low`, `medium`, and `high`. Project status values should be `active` or `completed`.

Example create flow:

```json
POST /api/users
{"name":"Jordan Reed","email":"jordan@example.com","role":"Member"}

POST /api/teams
{"name":"Product Team","memberIds":[1]}

POST /api/projects
{"name":"Launch","status":"active","teamId":1,"memberIds":[1]}

POST /api/tasks
{"title":"Prepare release","status":"todo","priority":"high","projectId":1,"assigneeId":1}
```

This stage provides CRUD and workspace data APIs. Authentication/authorization, password handling, and production migrations are not included yet.
