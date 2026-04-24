FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml README.md /app/
COPY src /app/src
COPY templates /app/templates
COPY docs /app/docs
COPY config /app/config

RUN pip install --no-cache-dir .

CMD ["python", "-m", "osint_agent.main", "--help"]

