# Use official Python image
FROM python:3.11-slim

# Set working directory
WORKDIR /app
ENV PYTHONPATH=/app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    curl \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Copy entrypoint script and make it executable
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

# Create non-root user for security (optional, commented out for compatibility)
# RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
# USER appuser

# Expose port
EXPOSE 8000

# Start application using entrypoint
ENTRYPOINT ["./entrypoint.sh"]

