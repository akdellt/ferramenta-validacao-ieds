from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from .exceptions import AppException
from .database import engine
from .routers import logs, parameter_validation, topology_validation, health, network_inventory
from . import models

@asynccontextmanager
async def lifespan(app: FastAPI):
    models.Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="Ferramenta de Validação de Parâmetros",
    lifespan=lifespan
)

origins = [
    "http://localhost:5173",
    "http://localhost:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

api_prefix = "/api"
app.include_router(parameter_validation.router, prefix=api_prefix)
app.include_router(logs.router, prefix=api_prefix)
app.include_router(topology_validation.router, prefix=api_prefix)
app.include_router(health.router, prefix=api_prefix)
app.include_router(network_inventory.router, prefix=api_prefix)

@app.get("/")
def root():
    return {"message": "Sistema rodando"}

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    return JSONResponse(status_code=422, content={"detail": exc.errors()})

@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.__class__.__name__,
            "message": exc.message,
            "filename": exc.filename,
            "details": exc.details,
            "path": str(request.url.path)
        },
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception): 
    return JSONResponse(
        status_code=500,
        content={
            "error": "InternalServerError",
            "message": "Erro interno do servidor. Tente novamente mais tarde.",
            "path": str(request.url.path)
        }
    )

