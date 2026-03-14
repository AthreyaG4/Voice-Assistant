from fastapi import FastAPI
from routes.health import router as health_router
from routes.spotify import router as spotify_router
from routes.chat import router as chat_router
from fastapi.middleware.cors import CORSMiddleware
from db import init_db

app = FastAPI()

origins = [
    "http://localhost",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await init_db()


app.include_router(health_router)
app.include_router(spotify_router)
app.include_router(chat_router)
