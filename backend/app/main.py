from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import processamento

app = FastAPI(
    title="Ferramenta de Validação de Parâmetros"
)

origins = [
    "http://localhost:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

api_prefix = "/api"
app.include_router(processamento.router, prefix=api_prefix)

@app.get("/")
def root():
    return {"message": "Sistema rodando"}