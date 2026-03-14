FROM python:3.11-slim

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

COPY pyproject.toml uv.lock /app/

RUN uv sync --frozen

COPY . .

EXPOSE 8001

CMD ["uv", "run", "fastmcp", "run", "main.py", "--transport", "sse", "--host", "0.0.0.0", "--port", "8001"]