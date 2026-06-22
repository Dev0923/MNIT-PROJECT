aryan papa
## Tech stack

- React
- Vite
- Tailwind CSS
- Leaflet + React Leaflet
- Recharts
- Framer Motion
- Pannellum
- FastAPI + Uvicorn
- MongoDB database


## Running the code

Run `npm i` to install the dependencies.

Run `npm run dev` to start the development server.

## Backend API (FastAPI)

1. Create and activate a Python virtual environment.
2. Install backend dependencies:


    `pip install -r backend/requirements.txt`

3. Start the API server:


    `uvicorn backend.main:app --reload --port 8000`

4. Verify health endpoint:


    `http://localhost:8000/health`
