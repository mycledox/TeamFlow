# TeamFlow Frontend

The dashboard pages use the Spring Boot REST API as the source of truth for users, teams, projects, tasks, and notifications. Changes are sent to the API and reflected in the UI after the server confirms them. `localStorage` is only used as a temporary cache.

## Run locally

1. Create the MySQL database and tables using [`../backend/database/teamflow.sql`](../backend/database/teamflow.sql).
2. Configure `DB_USERNAME` and `DB_PASSWORD`, then start the backend from `backend/` with `mvn spring-boot:run`. The API should be available at `http://localhost:8080/api`.
3. Serve this `frontent/` folder over HTTP using VS Code Live Server (port 5500 is allowed by the backend CORS configuration). Open `pages/dashboard.html`.

Do not open dashboard pages directly as `file://` URLs; browsers restrict API requests from that origin. If the API runs at a different address, set `window.TEAMFLOW_API_URL` to its `/api` URL before `js/app.js` loads.

On the first successful dashboard connection, the frontend creates a default user and team only if the API has none. Existing records are loaded from the API; old demo records in `localStorage` are not imported.

Login, registration, password reset, and social sign-in still need a real authentication service; the current backend does not implement authentication.
