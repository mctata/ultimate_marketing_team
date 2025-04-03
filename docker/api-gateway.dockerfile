FROM python:3.10-slim

WORKDIR /app

COPY src/api/staging_main.py .

RUN pip install fastapi uvicorn

ENV ENVIRONMENT=staging

EXPOSE 8000

CMD ["uvicorn", "staging_main:app", "--host", "0.0.0.0", "--port", "8000"]
