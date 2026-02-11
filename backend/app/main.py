from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from .exceptions import AppException
from .database import engine, Base
from .routers import processamento, historico
import traceback

Base.metadata.create_all(bind=engine)

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
app.include_router(historico.router, prefix=api_prefix)

@app.get("/")
def root():
    return {"message": "Sistema rodando"}

@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "erro": exc.__class__.__name__,
            "mensagem": exc.mensagem,
            "arquivo": getattr(exc, "nome_arquivo", None),
            "detalhes": getattr(exc, "detalhes", None),
            "caminho": str(request.url.path)
        },
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception): 
    print(f"ERRO NÃO TRATADO: {exc}")
    traceback.print_exc()

    return JSONResponse(
        status_code=500,
        content={
            "erro": "InternalServerError",
            "mensagem": "Erro interno do servidor. Tente novamente mais tarde.",
            "caminho": str(request.url.path)
        }
    )