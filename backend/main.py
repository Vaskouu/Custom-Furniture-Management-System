from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from auth import verify_password, create_access_token
from typing import Literal
from pwdlib import PasswordHash
from sqlalchemy.exc import IntegrityError
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
import jwt
from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from auth import decode_access_token
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
    material_id: int = Field(gt=0)
    quantity: float = Field(gt=0)


class OrderMaterialUpdate(BaseModel):
    order_id: int = Field(gt=0)
    material_id: int = Field(gt=0)
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

@app.get("/materials")
def get_materials():
    try:
        with engine.connect() as connection:
            result = connection.execute(text("""
                SELECT id, name, unit, price_per_unit
                FROM materials
                ORDER BY id
            """))
            return [dict(row) for row in result.mappings()]
    except SQLAlchemyError as error:
        print("DATABASE ERROR:", error)
        raise HTTPException(status_code=500, detail="Failed to retrieve materials")


@app.get("/order-materials")
def get_order_materials():
    try:
        with engine.connect() as connection:
            result = connection.execute(text("""
                SELECT
                    om.id,
                    om.order_id,
                    om.material_id,
                    c.name AS customer,
                    o.furniture_type,
                    m.name AS material_name,
                    m.unit,
                    m.price_per_unit,
                    om.quantity
                FROM order_materials AS om
                JOIN orders AS o ON om.order_id = o.id
                JOIN customers AS c ON o.customer_id = c.id
                JOIN materials AS m ON om.material_id = m.id
                ORDER BY om.id
            """))
            return [dict(row) for row in result.mappings()]
    except SQLAlchemyError as error:
        print("DATABASE ERROR:", error)
        raise HTTPException(status_code=500, detail="Failed to retrieve order materials")


@app.post("/order-materials", status_code=201)
def create_order_material(material: OrderMaterialCreate):
    try:
        with engine.begin() as connection:
            order_exists = connection.execute(
                text("SELECT id FROM orders WHERE id = :order_id"),
                {"order_id": material.order_id}
            ).first()
            if order_exists is None:
                raise HTTPException(status_code=404, detail="Order not found")

            material_row = connection.execute(
                text("SELECT name FROM materials WHERE id = :material_id"),
                {"material_id": material.material_id}
            ).mappings().first()
            if material_row is None:
                raise HTTPException(status_code=404, detail="Material not found")

            result = connection.execute(text("""
                INSERT INTO order_materials
                    (order_id, material_id, material_name, quantity)
                VALUES (:order_id, :material_id, :material_name, :quantity)
                RETURNING id, order_id, material_id, material_name, quantity
            """), {
                "order_id": material.order_id,
                "material_id": material.material_id,
                "material_name": material_row["name"],
                "quantity": material.quantity
            })
            return dict(result.mappings().one())
    except SQLAlchemyError as error:
        print("DATABASE ERROR:", error)
        raise HTTPException(status_code=500, detail="Failed to create order material")


@app.put("/order-materials/{material_id}")
def update_order_material(material_id: int, material: OrderMaterialUpdate):
    try:
        with engine.begin() as connection:
            order_exists = connection.execute(
                text("SELECT id FROM orders WHERE id = :order_id"),
                {"order_id": material.order_id}
            ).first()
            if order_exists is None:
                raise HTTPException(status_code=404, detail="Order not found")

            material_row = connection.execute(
                text("SELECT name FROM materials WHERE id = :material_id"),
                {"material_id": material.material_id}
            ).mappings().first()
            if material_row is None:
                raise HTTPException(status_code=404, detail="Material not found")

            result = connection.execute(text("""
                UPDATE order_materials
                SET order_id = :order_id,
                    material_id = :new_material_id,
                    material_name = :material_name,
                    quantity = :quantity
                WHERE id = :row_id
                RETURNING id, order_id, material_id, material_name, quantity
            """), {
                "row_id": material_id,
                "order_id": material.order_id,
                "new_material_id": material.material_id,
                "material_name": material_row["name"],
                "quantity": material.quantity
            })
            updated = result.mappings().first()
            if updated is None:
                raise HTTPException(status_code=404, detail="Order material not found")
            return dict(updated)
    except SQLAlchemyError as error:
        print("DATABASE ERROR:", error)
        raise HTTPException(status_code=500, detail="Failed to update order material")


@app.delete("/order-materials/{material_id}")
def delete_order_material(material_id: int):
    try:
        with engine.begin() as connection:
            result = connection.execute(text("""
                DELETE FROM order_materials
                WHERE id = :material_id
                RETURNING id
            """), {"material_id": material_id})
            deleted = result.mappings().first()
            if deleted is None:
                raise HTTPException(status_code=404, detail="Order material not found")
            return {
                "message": "Order material deleted successfully",
                "deleted_id": deleted["id"]
            }
    except SQLAlchemyError as error:
        print("DATABASE ERROR:", error)
        raise HTTPException(status_code=500, detail="Failed to delete order material")

@app.get("/users")
def get_users():
    try:
        with engine.connect() as connection:
            result = connection.execute(
                text("""
                    SELECT
                        id,
                        username,
                        email,
                        role,
                        created_at
                    FROM users
                    ORDER BY id
                """)
            )

            return [dict(row) for row in result.mappings().all()]

    except SQLAlchemyError:
        raise HTTPException(
            status_code=500,
            detail="Database error while fetching users"
        )


# ==========================================
# USER MANAGEMENT
# ==========================================

password_hasher = PasswordHash.recommended()


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=8)
    role: Literal["admin", "designer", "client"]


@app.post("/users", status_code=201)
def create_user(user: UserCreate):
    hashed_password = password_hasher.hash(user.password)

    try:
        with engine.begin() as connection:
            result = connection.execute(
                text("""
                    INSERT INTO users (
                        username,
                        email,
                        password_hash,
                        role
                    )
                    VALUES (
                        :username,
                        :email,
                        :password_hash,
                        :role
                    )
                    RETURNING
                        id,
                        username,
                        email,
                        role,
                        created_at
                """),
                {
                    "username": user.username,
                    "email": user.email,
                    "password_hash": hashed_password,
                    "role": user.role,
                },
            ).mappings().one()

            return dict(result)

    except IntegrityError:
        raise HTTPException(
            status_code=409,
            detail="Username or email already exists"
        )

    except SQLAlchemyError:
        raise HTTPException(
            status_code=500,
            detail="Database error while creating user"
        )


        # ==========================================
# AUTHENTICATION
# ==========================================

class LoginRequest(BaseModel):
    username: str
    password: str


@app.post("/auth/login")
def login(data: LoginRequest):
    try:
        with engine.connect() as connection:
            user = connection.execute(
                text("""
                    SELECT id, username, password_hash, role
                    FROM users
                    WHERE username = :username
                """),
                {"username": data.username},
            ).mappings().first()

    except SQLAlchemyError:
        raise HTTPException(
            status_code=500,
            detail="Database error during login"
        )

    if user is None or not verify_password(
        data.password, user["password_hash"]
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(user["id"])

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "username": user["username"],
            "role": user["role"],
        },
    }

    # ==========================================
# CURRENT AUTHENTICATED USER
# ==========================================

bearer_scheme = HTTPBearer()


@app.get("/auth/me")
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)
):
    try:
        user_id = decode_access_token(credentials.credentials)

    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        with engine.connect() as connection:
            user = connection.execute(
                text("""
                    SELECT id, username, email, role
                    FROM users
                    WHERE id = :user_id
                """),
                {"user_id": user_id},
            ).mappings().first()

    except SQLAlchemyError:
        raise HTTPException(
            status_code=500,
            detail="Database error while fetching current user",
        )

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="User no longer exists",
        )

    return dict(user)