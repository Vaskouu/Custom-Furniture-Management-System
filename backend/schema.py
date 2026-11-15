"""SQLite API-test fixture only. PostgreSQL uses the files in backend/sql."""
from sqlalchemy import MetaData, Table, Column, Integer, String, Text, Numeric, ForeignKey, DateTime, func


def initialize_legacy(engine):
    metadata = MetaData()
    Table('users', metadata, Column('id', Integer, primary_key=True))
    customers = Table('customers', metadata,
        Column('id', Integer, primary_key=True), Column('name', String(100), nullable=False),
        Column('phone', String(30), nullable=False), Column('email', String(255), nullable=False),
        Column('user_id', Integer, ForeignKey('users.id', ondelete='SET NULL'), unique=True))
    orders = Table('orders', metadata,
        Column('id', Integer, primary_key=True), Column('customer_id', Integer, ForeignKey('customers.id'), nullable=False),
        Column('furniture_type', String(100), nullable=False), Column('description', Text),
        Column('status', String(50), nullable=False, server_default='Нова'),
        Column('created_at', DateTime, server_default=func.now()))
    materials = Table('materials', metadata,
        Column('id', Integer, primary_key=True), Column('name', String(100), nullable=False, unique=True),
        Column('unit', String(20), nullable=False, server_default='бр.'),
        Column('price_per_unit', Numeric(10,2), nullable=False, server_default='0'))
    lines = Table('order_materials', metadata,
        Column('id', Integer, primary_key=True), Column('order_id', Integer, ForeignKey('orders.id', ondelete='CASCADE'), nullable=False),
        Column('material_id', Integer, ForeignKey('materials.id'), nullable=False),
        Column('material_name', String(100), nullable=False), Column('quantity', Numeric(10,2), nullable=False))
    metadata.create_all(engine, tables=[customers, orders, materials, lines])
