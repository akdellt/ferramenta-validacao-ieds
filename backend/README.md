# BACK-END -- Ferramenta de Validação de Parâmetros de IEDs

Responsável pelo processamento dos arquivos (OA, IEDs, SCDs) e validação de regras.

## Tecnologias

- **Python 3.12+**
- **FastAPI** (framework web)
- **PostgreSQL** (banco de dados)
- **SQLAlchemy** (ORM)
- **Pydantic** (validação de dados)

## Estrutura

```
backend/
├── app/
│   ├── core/           # Configurações globais e de segurança
│   ├── routers/        # Rotas da API
│   ├── schemas/        # Modelos de dados Pydantic
│   ├── services/       # Lógica de negócio
│   ├── validators/     # Regras de validação para topologia
│   ├── database.py     # Configuração da sessão
│   ├── exceptions.py   # Erros customizados
│   ├── main.py         # Inicialização do FastAPI
│   └── models.py       # Definições das tabelas do banco de dados
└── requirements.txt
```

## Configuração de ambiente local

> **Requisito:** Python 3.12 ou superior.

1. Acesse a pasta: `cd backend`
2. Crie o ambiente virtual: `python -m venv .venv`
3. Ative a venv:
   - Windows: `.\.venv\Scripts\activate`
   - Linux/Mac: `source .venv/bin/activate`
4. Instale as dependências: `pip install -r requirements.txt`

## Possível erro - VS Code

Se o VS Code não reconhecer as bibliotecas:

1. `Ctrl + Shift + P` > `Python: Select Interpreter`.
2. Escolha o caminho: `./backend/.venv/Scripts/python.exe`.

## Teste com interface interativa do FASTAPI

Inicializar servidor: `uvicorn app.main:app --reload`  
Acessar documentação interativa: http://localhost:8000/docs
