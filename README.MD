# SIQ - Sistema Integrado de Qualificações

Sistema Integrado de Qualificações para gestão de voos, tripulantes e qualificações da Esquadra 502.

O SIQ é uma aplicação full-stack desenvolvida para facilitar a gestão de:
- **Voo**s: Registro e edição de voos (Modelo 1M)
- **Tripulantes**: Gestão de pilotos e elementos de tripulação
- **Qualificações**: Rastreamento de qualificações e validações de tripulantes
- **Dashboard**: Visualização estatística e relatórios

---

## 🏗️ Arquitetura

- **Frontend**: React 18 com Vite, Chakra UI, React Router
- **Backend**: Python Flask com SQLAlchemy ORM
- **Database**: PostgreSQL (produção) ou SQLite (desenvolvimento)
- **Autenticação**: JWT com Flask-JWT-Extended
- **Build**: Docker & Docker Compose

---

## 🚀 Instalação e Configuração

### Pré-requisitos

- Python 3.12+
- Node.js 18+
- PostgreSQL (opcional, para produção)
- Docker & Docker Compose (recomendado)

### Configuração da API

1. Navegar para o diretório da API:
```bash
cd api
```

2. Instalar dependências Python:
```bash
# Com pip
pip install -r requirements.txt

# Ou com uv (recomendado)
uv sync
```

3. Criar ficheiro `.env` na pasta `api/`:
```env
# Database Configuration
user=your_db_user
password=your_db_password
host=your_db_host
port=5432
dbname=your_db_name

# JWT Configuration
JWT_KEY=your_secret_jwt_key_here_make_it_long_and_random

# CORS Configuration
APPLY_CORS=true

# Development Mode (set to 0 for production)
DEV=1

# Google Drive Integration (opcional)
ID_PASTA_VOO=your_google_drive_folder_id_for_flights
ID_PASTA_PDF=your_google_drive_folder_id_for_pdfs

# SMTP Configuration (para envio de emails)
SMTP_SERVER=mail.esq502.pt
SMTP_PORT=465
SMTP_USER=noreply@esq502.pt
SMTP_PASSWORD=your_smtp_password
```

4. Configurar base de dados:
```bash
# Com Alembic (migrations)
cd api
alembic upgrade head

# Ou criar tabelas diretamente
python -c "from app import app, setup_database; setup_database()"
```

5. Executar API:
```bash
# Desenvolvimento
python wsgi.py

# Produção com Gunicorn
gunicorn -w 4 -b 0.0.0.0:5051 wsgi:app
```

### Configuração do Frontend

1. Navegar para o diretório do frontend:
```bash
cd frontend
```

2. Instalar dependências:
```bash
npm install
```

3. Criar ficheiro `.env` na pasta `frontend/`:
```env
# API URL
VITE_API_URL=http://localhost:5051/api
```

4. Executar em modo desenvolvimento:
```bash
npm run dev
```

5. Build para produção:
```bash
npm run build
```

---

## 🐳 Execução com Docker

A forma mais fácil de executar toda a aplicação é usando Docker Compose:

1. Clonar o repositório:
```bash
git clone <repository-url>
cd DinamicQualification
```

2. Configurar variáveis de ambiente:
   - Editar `api/.env` com as configurações da API
   - Editar `frontend/.env` com a URL da API

3. Executar com Docker Compose:
```bash
docker-compose up -d
```

Os serviços estarão disponíveis em:
- **Frontend**: http://localhost:5173
- **API**: http://localhost:5051
- **Database**: localhost:3306 (MySQL para desenvolvimento)

### Docker Compose Override

Para configuração de produção, pode criar um `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  api:
    build:
      dockerfile: Dockerfile  # Produção
    environment:
      - APPLY_CORS=0
      # ... outras variáveis

  frontend:
    build:
      dockerfile: Dockerfile  # Produção
    ports:
      - "80:80"  # Porta HTTP padrão
```

---

## 📋 Variáveis de Ambiente

### API (.env)

| Variável | Descrição | Obrigatória | Default |
|----------|-----------|-------------|---------|
| `user` | Usuário da base de dados | ✅ | - |
| `password` | Password da base de dados | ✅ | - |
| `host` | Host da base de dados | ✅ | localhost |
| `port` | Porta da base de dados | ✅ | 5432 |
| `dbname` | Nome da base de dados | ✅ | - |
| `JWT_KEY` | Chave secreta para JWT | ✅ | - |
| `APPLY_CORS` | Ativar CORS (true/false) | ❌ | true |
| `DEV` | Modo desenvolvimento (0/1) | ❌ | 0 |
| `ID_PASTA_VOO` | ID pasta Google Drive voos | ❌ | - |
| `ID_PASTA_PDF` | ID pasta Google Drive PDFs | ❌ | - |
| `SMTP_SERVER` | Servidor SMTP | ❌ | mail.esq502.pt |
| `SMTP_PORT` | Porta SMTP | ❌ | 465 |
| `SMTP_USER` | Usuário SMTP | ❌ | noreply@esq502.pt |
| `SMTP_PASSWORD` | Password SMTP | ❌ | - |

### Frontend (.env)

| Variável | Descrição | Obrigatória | Default |
|----------|-----------|-------------|---------|
| `VITE_API_URL` | URL da API backend | ✅ | http://localhost:5051/api |

---

## 🗄️ Estrutura da Base de Dados

### Tabelas Principais

- **flights_table**: Informações dos voos (Modelo 1M)
- **flight_pilots**: Relação voos-tripulantes com estatísticas
- **tripulantes**: Dados dos pilotos e elementos de tripulação
- **qualificacoes**: Catálogo de qualificações
- **tripulante_qualificacao**: Validações de qualificações por tripulante

---

## 🔐 Autenticação

A aplicação usa JWT (JSON Web Tokens) para autenticação:

- Tokens expiram em **1 hora**
- Refresh automático de tokens expirados
- Redirecionamento para login em caso de 401

### Criar utilizador admin

```python
python -c "
from app import app
from models.tripulantes import Tripulante
from api import engine
from sqlalchemy.orm import Session

with Session(engine) as session:
    admin = Tripulante(
        nip=123456789,
        name='Admin',
        rank='Cap',
        tipo='ADMIN'
    )
    session.add(admin)
    session.commit()
"
```

---

## 📚 Scripts Úteis

### Importar voos
```bash
cd api
python import_flights.py
```

### Migrações da base de dados
```bash
cd api
# Criar nova migração
alembic revision --autogenerate -m "descricao"

# Aplicar migrações
alembic upgrade head

# Reverter última migração
alembic downgrade -1
```

---

## 🛠️ Desenvolvimento

### Tech Stack

**Backend:**
- Flask 3.1+
- SQLAlchemy 2.0+
- Alembic (migrations)
- Flask-JWT-Extended
- PostgreSQL/MySQL driver
- Google API Client (Drive integration)
- ReportLab (PDF generation)

**Frontend:**
- React 18
- Vite 6
- Chakra UI
- React Router
- Axios
- React Hook Form

### Linting e Formatação

**Backend:**
```bash
# MyPy (type checking)
mypy api/

# Ruff (linting & formatting)
ruff check api/
ruff format api/
```

**Frontend:**
```bash
# ESLint
npm run lint

# Prettier (automatic on save se configurado)
npx prettier --write .
```

---

## 🤝 Contribuidores

- **Cap. PilAv Tiago Branco**
- **Maj. PilAv Pedro Andrade**

*Elefantes - Sobre as asas ínclitas da Fama*

---

## 📝 Notas

- Para produção, configurar NGINX como reverse proxy
- Backups regulares da base de dados recomendados
- Logs de erro disponíveis no console/terminal
- Google Drive integration requer configuração OAuth

---

## 📄 Licença

Este é um projeto interno da Esquadra 502.
