from fastapi import FastAPI, HTTPException
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from database import engine

app = FastAPI(title="FurniPro API")


@app.get("/")
def home():
    return {"message": "FurniPro API is working!"}

@app.get("/health")
def health_check():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "healthy",
            "api": "online",
            "database": "connected"
        }

    except SQLAlchemyError as error:
        print("HEALTH CHECK ERROR:", error)

        raise HTTPException(
            status_code=503,
            detail={
                "status": "unhealthy",
                "api": "online",
                "database": "disconnected"
            }
        )
        
@app.get("/customers")
def get_customers():
    try:
        with engine.connect() as connection:
            result = connection.execute(
                text("SELECT * FROM customers ORDER BY id")
            )
            return [dict(row) for row in result.mappings()]

    except SQLAlchemyError as error:
        print("DATABASE ERROR:", error)
        raise HTTPException(
            status_code=500,
            detail="Database query failed"
        )


@app.get("/orders")
def get_orders():
    try:
        with engine.connect() as connection:
            result = connection.execute(
                text("""
                    SELECT
                        o.id,
                        c.name AS customer,
                        o.furniture_type,
                        o.description,
                        o.status
                    FROM orders AS o
                    JOIN customers AS c
                        ON o.customer_id = c.id
                    ORDER BY o.id
                """)
            )
            return [dict(row) for row in result.mappings()]

    except SQLAlchemyError as error:
        print("DATABASE ERROR:", error)
        raise HTTPException(
            status_code=500,
            detail="Database query failed"
        )