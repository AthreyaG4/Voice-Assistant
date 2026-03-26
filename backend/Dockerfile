# FROM python:3.11-slim

# COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# WORKDIR /app

# COPY pyproject.toml uv.lock /app/

# RUN uv sync --frozen

# COPY . .

# EXPOSE 8000

# CMD ["uv", "run", "fastapi", "run", "main.py", "--host", "0.0.0.0"]

FROM python:3.11-slim

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app/backend

COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --frozen

COPY mcp-servers/pyproject.toml mcp-servers/uv.lock /app/mcp-servers/
RUN cd /app/mcp-servers && uv sync --frozen

COPY backend/ .
COPY mcp-servers/ /app/mcp-servers

EXPOSE 8000

CMD ["uv", "run", "fastapi", "run", "main.py", "--host", "0.0.0.0"]