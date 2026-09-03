FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# system deps for common packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# copy requirements and install
COPY apps/api/requirements.txt ./apps/api/requirements.txt
RUN python -m pip install --upgrade pip && \
    pip install -r ./apps/api/requirements.txt

# copy the project
COPY . /app

EXPOSE 8000 8001

CMD ["sh", "-c", "PYTHONPATH=. uvicorn apps.api.app.main:app --host 0.0.0.0 --port 8000"]
