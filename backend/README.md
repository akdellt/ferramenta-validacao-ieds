# BACK-END -- Ferramenta de Validação de Parâmetros de IEDs

## Configuração de ambiente

Abra o terminal e digite:

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

## Possível erro

Se bibliotecas não estiverem sendo identificadas, entre em um arquivo `.py`, clique na versão do Python na barra inferior.

Na barra superior: `Enter interpreter path...` > `Find...`

Vai abrir o explorador de arquivos: `backend` > `.venv` > `Scripts` e selecione `python.exe`

## Teste com interface interativa do FASTAPI

Inicializar servidor: `uvicorn app.main:app --reload`

Acessar interface: [Ferramenta de Validação de Parâmetros](http://localhost:8000/docs)
