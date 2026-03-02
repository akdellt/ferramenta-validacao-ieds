from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from .exceptions import AppException
from .database import engine, SessionLocal
from .routers import logs, processamento, topologies, auth
from . import models
import traceback


@asynccontextmanager
async def lifespan(app: FastAPI):
    db = SessionLocal()
    try:
        models.Base.metadata.create_all(bind=engine)
        
        user = db.query(models.User).filter(models.User.registration == "A123").first()
        if not user:
            master_user = models.User(
                registration="A123",
                full_name="Danyelle Machado",
                hashed_password="123456",
                role="Admin"
            )
            db.add(master_user)
            db.commit()
    except Exception as e:
        print(f"Erro na inicialização: {e}")
    finally:
        db.close()
    
    yield

app = FastAPI(
    title="Ferramenta de Validação de Parâmetros",
    lifespan=lifespan
)

origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "*" # remover depois
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

api_prefix = "/api"
app.include_router(auth.router, prefix=api_prefix)
app.include_router(processamento.router, prefix=api_prefix)
app.include_router(logs.router, prefix=api_prefix)
app.include_router(topologies.router, prefix=api_prefix)

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