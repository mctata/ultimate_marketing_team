FROM python:3.10-slim

WORKDIR /app

COPY src/api/staging_main.py /app/

RUN pip install fastapi uvicorn

EXPOSE 8000

CMD ["python", "staging_main.py"]
