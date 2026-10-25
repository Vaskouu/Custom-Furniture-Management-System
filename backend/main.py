from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from database import engine


app = FastAPI(title="FurniPro API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CustomerCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    phone: str = Field(min_length=7, max_length=20)
    email: str = Field(min_length=5, max_length=255)


class CustomerUpdate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    phone: str = Field(min_length=7, max_length=20)
    email: str = Field(min_length=5, max_length=100)

class OrderCreate(BaseModel):
    customer_id: int = Field(gt=0)
    furniture_type: str = Field(min_length=2, max_length=100)
    description: str | None = None

class OrderUpdate(BaseModel):
    customer_id: int = Field(gt=0)
    furniture_type: str = Field(min_length=2, max_length=100)
    description: str | None = None
    status: str = Field(min_length=2, max_length=50)

class OrderMaterialCreate(BaseModel):
    order_id: int = Field(gt=0)
    material_name: str = Field(min_length=2, max_length=100)
    quantity: float = Field(gt=0)

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




@app.post("/orders", status_code=201)        
def create_order(order: OrderCreate):
    try:
        with engine.begin() as connection:
            customer = connection.execute(
                text("SELECT id FROM customers WHERE id = :customer_id"),
                {"customer_id": order.customer_id}
            ).first()

            if customer is None:
                raise HTTPException(
                    status_code=404,
                    detail="Customer not found"
                )

            result = connection.execute(
                text("""
                    INSERT INTO orders (
                        customer_id,
                        furniture_type,
                        description
                    )
                    VALUES (
                        :customer_id,
                        :furniture_type,
                        :description
                    )
                    RETURNING
                        id,
                        customer_id,
                        furniture_type,
                        description,
                        status,
                        created_at
                """),
                {
                    "customer_id": order.customer_id,
                    "furniture_type": order.furniture_type,
                    "description": order.description
                }
            )

            return dict(result.mappings().one())

    except SQLAlchemyError as error:
        print("DATABASE ERROR:", error)
        raise HTTPException(
            status_code=500,
            detail="Failed to create order"
        )


@app.get("/orders/{order_id}")
def get_order_by_id(order_id: int):
    try:
        with engine.connect() as connection:
            result = connection.execute(
                text("""
                    SELECT
                        o.id,
                        o.customer_id,
                        c.name AS customer,
                        o.furniture_type,
                        o.description,
                        o.status,
                        o.created_at
                    FROM orders AS o
                    JOIN customers AS c ON o.customer_id = c.id
                    WHERE o.id = :order_id
                """),
                {"order_id": order_id}
            )

            order = result.mappings().first()

            if order is None:
                raise HTTPException(
                    status_code=404,
                    detail="Order not found"
                )

            return dict(order)

    except SQLAlchemyError as error:
        print("DATABASE ERROR:", error)
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve order"
        )

@app.put("/orders/{order_id}")
def update_order(order_id: int, order: OrderUpdate):
    try:
        with engine.begin() as connection:
            customer = connection.execute(
                text("""
                    SELECT id
                    FROM customers
                    WHERE id = :customer_id
                """),
                {"customer_id": order.customer_id}
            ).first()

            if customer is None:
                raise HTTPException(
                    status_code=404,
                    detail="Customer not found"
                )

            result = connection.execute(
                text("""
                    UPDATE orders
                    SET
                        customer_id = :customer_id,
                        furniture_type = :furniture_type,
                        description = :description,
                        status = :status
                    WHERE id = :order_id
                    RETURNING
                        id,
                        customer_id,
                        furniture_type,
                        description,
                        status,
                        created_at
                """),
                {
                    "order_id": order_id,
                    "customer_id": order.customer_id,
                    "furniture_type": order.furniture_type,
                    "description": order.description,
                    "status": order.status
                }
            )

            updated_order = result.mappings().first()

            if updated_order is None:
                raise HTTPException(
                    status_code=404,
                    detail="Order not found"
                )

            return dict(updated_order)

    except SQLAlchemyError as error:
        print("DATABASE ERROR:", error)
        raise HTTPException(
            status_code=500,
            detail="Failed to update order"
        )

@app.delete("/orders/{order_id}")
def delete_order(order_id: int):
    try:
        with engine.begin() as connection:
            result = connection.execute(
                text("""
                    DELETE FROM orders
                    WHERE id = :order_id
                    RETURNING id
                """),
                {"order_id": order_id}
            )

            deleted_order = result.mappings().first()

            if deleted_order is None:
                raise HTTPException(
                    status_code=404,
                    detail="Order not found"
                )

            return {
                "message": "Order deleted successfully",
                "id": deleted_order["id"]
            }

    except SQLAlchemyError as error:
        print("DATABASE ERROR:", error)
        raise HTTPException(
            status_code=500,
            detail="Failed to delete order"
        )

@app.get("/order-materials")
def get_order_materials():
    try:
        with engine.connect() as connection:
            result = connection.execute(
                text("""
                    SELECT
                        m.id,
                        m.order_id,
                        c.name AS customer,
                        o.furniture_type,
                        m.material_name,
                        m.quantity
                    FROM order_materials AS m
                    JOIN orders AS o
                        ON m.order_id = o.id
                    JOIN customers AS c
                        ON o.customer_id = c.id
                    ORDER BY m.id
                """)
            )

            return [dict(row) for row in result.mappings()]

    except SQLAlchemyError as error:
        print("DATABASE ERROR:", error)

        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve order materials"
        )


@app.post("/order-materials", status_code=201)
def create_order_material(material: OrderMaterialCreate):
    try:
        with engine.begin() as connection:
            order_exists = connection.execute(
                text("SELECT id FROM orders WHERE id = :order_id"),
                {"order_id": material.order_id}
            ).first()

            if order_exists is None:
                raise HTTPException(
                    status_code=404,
                    detail="Order not found"
                )

            result = connection.execute(
                text("""
                    INSERT INTO order_materials (
                        order_id,
                        material_name,
                        quantity
                    )
                    VALUES (
                        :order_id,
                        :material_name,
                        :quantity
                    )
                    RETURNING id, order_id, material_name, quantity
                """),
                {
                    "order_id": material.order_id,
                    "material_name": material.material_name,
                    "quantity": material.quantity
                }
            )

            return dict(result.mappings().one())

    except SQLAlchemyError as error:
        print("DATABASE ERROR:", error)

        raise HTTPException(
            status_code=500,
            detail="Failed to create order material"
        )