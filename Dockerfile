FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    libturbojpeg0 \
    libglib2.0-0 \
    libgl1 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN python -c "from docaligner import DocAligner; DocAligner(model_cfg='fastvit_t8')"

COPY . .

ENV PORT=8000
ENV OMP_NUM_THREADS=1
ENV OPENBLAS_NUM_THREADS=1
ENV MKL_NUM_THREADS=1
EXPOSE 8000

CMD ["sh", "-c", "uvicorn api:app --host 0.0.0.0 --port ${PORT}"]