# Ferramenta de Validação de Parâmetros de IEDs

Sistema que valida automaticamente parâmetros de IEDs comparando Ordens de Ajuste
com arquivos de configuração, e topologias de subestação via arquivos SCD,
gerando relatórios e histórico por usuário.

## Tecnologias

- **Backend:** Python, FastAPI, PostgreSQL
- **Frontend:** React (Vite), TailwindCSS
- **Infraestrutura:** Docker, Docker Compose

## Pré-requisitos

- Docker instalado

## Setup rápido

Crie um arquivo `.env` na pasta raiz do projeto com base no `.env.example` e substitua as informações:

> **Importante:** Certifique-se de que a senha em `POSTGRES_PASSWORD` seja a mesma usada na string `DATABASE_URL`.

```env
POSTGRES_PASSWORD=sua_senha_aqui
DATABASE_URL=postgresql://admin:sua_senha_aqui@db:5432/equatorial_db
MASTER_USER_PASSWORD=crie_senha_aqui
```

### Com Docker (recomendado)

```bash
docker-compose up -d --build
```

### Manualmente

Veja as instruções em [backend/README.md](./backend/README.md)
e [frontend/README.md](./frontend/README.md)

### Teste de Rede (Simulação)

Para liberar a busca de dados via FTP/Telnet de forma simulada, siga esses passos:

1. Instale as dependências no ambiente virtual: `pip install pyftpdlib telnetlib3`
2. Em um terminal separado, execute o simulador:
   ```bash
   python mocks/server_mock.py
   ```

## Acessos rápidos

- Frontend: http://localhost:5173
- API/Documentação: http://localhost:8000/docs

## Comandos úteis

- **Logs:** `docker-compose logs -f`
- **Derrubar o sistema:** `docker-compose down`
- **Reiniciar backend:** `docker-compose restart backend`

## Colaborando no projeto

1. Clone o repositório: `git clone <url-do-repositorio>`
2. Crie uma branch a partir da `main`:

```bash
   git checkout -b nome-da-branch
```

3. Faça suas alterações e commit seguindo o padrão:

```bash
   git add .
   git commit -m "descrição curta do que foi feito"
```

4. Envie a branch: `git push origin nome-da-branch`
5. Abra um Pull Request para a `main`

## Estrutura do repositório

```
├── backend/
├── frontend/
├── mocks/
├── docker-compose.yml
└── .env.example
```

## Roadmap

### Funcionando

[x] Extração e validação de parâmetros (Excel x TXT)  
[x] Relatório de validação de parâmetros  
[x] Extração e validação de arquivos .SCD  
[x] Sistema de autenticação e gestão de históricos  
[x] Refatoração do código
[x] Módulo de rede FTP/Telnet (simulação do sistema)
[X] Tela de formulário de subestação  
[X] Visualização gráfica dos erros de validação

### Em desenvolvimento

[ ] Requisição de senhas para acesso dos IEDs
[ ] Implementação de testes

### A implementar

[ ] Formulário de referência dinâmico (usuário constrói circuito)  
[ ] Responsividade das telas
