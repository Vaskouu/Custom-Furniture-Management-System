from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from database import engine


app = FastAPI(title="FurniPro API")


class CustomerCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    phone: str = Field(min_length=7, max_length=20)
    email: str = Field(min_length=5, max_length=255)


class CustomerUpdate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    phone: str = Field(min_length=7, max_length=20)
    email: str = Field(min_length=5, max_length=100)


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


@app.post("/customers", status_code=201)
def create_customer(customer: CustomerCreate):
    try:
        with engine.begin() as connection:
            result = connection.execute(
                text("""
                    INSERT INTO customers (name, phone, email)
                    VALUES (:name, :phone, :email)
                    RETURNING id, name, phone, email
                """),
                {
                    "name": customer.name,
                    "phone": customer.phone,
                    "email": customer.email
                }
            )

            return dict(result.mappings().one())

    except SQLAlchemyError as error:
        print("DATABASE ERROR:", error)

        raise HTTPException(
            status_code=500,
            detail="Failed to create customer"
        )


@app.get("/customers/{customer_id}")
def get_customer_by_id(customer_id: int):
    try:
        with engine.connect() as connection:
            result = connection.execute(
                text("""
                    SELECT id, name, phone, email
                    FROM customers
                    WHERE id = :customer_id
                """),
                {"customer_id": customer_id}
            )

            customer = result.mappings().first()

            if customer is None:
                raise HTTPException(
                    status_code=404,
                    detail="Customer not found"
                )

            return dict(customer)

    except SQLAlchemyError as error:
        print("DATABASE ERROR:", error)

        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve customer"
        )

@app.put("/customers/{customer_id}")
def update_customer(customer_id: int, customer: CustomerUpdate):
    try:
        with engine.begin() as connection:
            result = connection.execute(
                text("""
                    UPDATE customers
                    SET name = :name,
                        phone = :phone,
                        email = :email
                    WHERE id = :customer_id
                    RETURNING id, name, phone, email
                """),
                {
                    "customer_id": customer_id,
                    "name": customer.name,
                    "phone": customer.phone,
                    "email": customer.email
                }
            )

            updated_customer = result.mappings().first()

            if updated_customer is None:
                raise HTTPException(
                    status_code=404,
                    detail="Customer not found"
                )

            return dict(updated_customer)

    except SQLAlchemyError as error:
        print("DATABASE ERROR:", error)
        raise HTTPException(
            status_code=500,
            detail="Failed to update customer"
        )


@app.delete("/customers/{customer_id}")
def delete_customer(customer_id: int):
    try:
        with engine.begin() as connection:
            result = connection.execute(
                text("""
                    DELETE FROM customers
                    WHERE id = :customer_id
                    RETURNING id
                """),
                {"customer_id": customer_id}
            )

            deleted_customer = result.mappings().first()

            if deleted_customer is None:
                raise HTTPException(
                    status_code=404,
                    detail="Customer not found"
                )

            return {
                "message": "Customer deleted successfully",
                "id": deleted_customer["id"]
            }

    except SQLAlchemyError as error:
        print("DATABASE ERROR:", error)
        raise HTTPException(
            status_code=500,
            detail="Failed to delete customer"
        )