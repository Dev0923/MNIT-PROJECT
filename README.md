# Khatu Shayam ji Sign Up page

This is a code bundle for Khatu Shayam ji Sign Up page. The original project is available at https://www.figma.com/design/ayPhnHK4zF7ytgf7kpTfqK/Khatu-Shayam-ji-Sign-Up-page.

## Tech stack

- React
- Vite
- Tailwind CSS
- Leaflet + React Leaflet
- Recharts
- Framer Motion
- Pannellum
- FastAPI + Uvicorn

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
