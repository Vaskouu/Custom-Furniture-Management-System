import json
from datetime import datetime, timezone
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from sqlalchemy import MetaData, Table, select, delete, update, insert, text
from sqlalchemy.exc import IntegrityError
from public_api import db, staff, User, Resource, passwords, audit

router = APIRouter(prefix='/api/studio')
KINDS = {'customers', 'orders', 'materials', 'users'}
STATUS = Literal['Нова', 'В процес', 'Завършена', 'Отказана']


class Record(BaseModel):
    model_config = ConfigDict(extra='forbid', allow_inf_nan=False)
    id: str = Field(min_length=1, max_length=80)


class Customer(Record):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr | Literal['']
    phone: str = Field(max_length=30)
    city: str = Field(default='', max_length=100)
    address: str = Field(default='', max_length=300)
    notes: str = Field(default='', max_length=5000)
    createdAt: str = ''


class Material(Record):
    sku: str = Field(min_length=1, max_length=80)
    name: str = Field(min_length=1, max_length=100)
    category: str = Field(max_length=100)
    unit: str = Field(min_length=1, max_length=20)
    stock: float = Field(ge=0)
    minimum: float = Field(ge=0)
    color: str = Field(max_length=100)
    supplier: str = Field(max_length=200)
    notes: str = Field(max_length=5000)


class Dimensions(BaseModel):
    w: float = Field(gt=0, le=1000, allow_inf_nan=False)
    d: float = Field(gt=0, le=1000, allow_inf_nan=False)
    h: float = Field(gt=0, le=1000, allow_inf_nan=False)


class Allocation(BaseModel):
    materialId: str
    quantity: float = Field(gt=0, allow_inf_nan=False)


class Order(Record):
    number: str = Field(max_length=80)
    customerId: str
    title: str = Field(min_length=1, max_length=150)
    furnitureType: str = Field(min_length=2, max_length=100)
    description: str = Field(min_length=5, max_length=5000)
    dimensions: Dimensions
    quantity: int = Field(ge=1, le=100)
    status: STATUS
    dueDate: str = Field(max_length=30)
    createdAt: str = ''
    amount: float = Field(ge=0, le=10000000)
    assignedTo: str
    materials: list[Allocation] = Field(max_length=200)
    notes: str = Field(max_length=5000)
    history: list[dict] = Field(default_factory=list, max_length=2000)


class TeamUser(Record):
    name: str = Field(min_length=2, max_length=100)
    username: str = Field(min_length=3, max_length=50, pattern=r'^[a-zA-Z0-9_.-]+$')
    email: EmailStr
    role: Literal['admin', 'worker']
    active: bool
    password: str | None = Field(default=None, min_length=10, max_length=128)


MODELS = {'customers': Customer, 'materials': Material, 'orders': Order, 'users': TeamUser}


def table(session, name):
    return Table(name, MetaData(), autoload_with=session.connection())


def extra(session, kind, ident):
    return session.scalar(select(Resource).where(Resource.kind == 'studio_'+kind, Resource.external_id == str(ident)))


def state(session):
    result = {'version': 1, 'customers': [], 'materials': [], 'orders': [], 'users': []}
    metadata = {(r.kind[7:], r.external_id): json.loads(r.payload) for r in session.scalars(select(Resource).where(Resource.kind.like('studio_%')))}
    allocations = {}
    for row in session.execute(select(table(session, 'order_materials'))).mappings():
        allocations.setdefault(str(row['order_id']), []).append({'materialId': str(row['material_id']), 'quantity': float(row['quantity'])})
    for kind in ('customers', 'materials', 'orders'):
        for row in session.execute(select(table(session, kind))).mappings():
            ident = str(row['id'])
            data = metadata.get((kind, ident), {})
            if kind == 'customers':
                item = dict(city='', address='', notes='', createdAt=str(row.get('created_at') or ''))
                item.update(data)
                item.update(id=ident, name=row['name'], email=row['email'] or '', phone=row['phone'] or '')
            elif kind == 'materials':
                item = dict(sku='MAT-'+ident, category='', stock=0, minimum=0, color='', supplier='', notes='')
                item.update(data)
                item.update(id=ident, name=row['name'], unit=row['unit'])
            else:
                item = dict(number='FP-'+ident, title=row['furniture_type'], dimensions={'w':100,'h':100,'d':60}, quantity=1, dueDate='', createdAt=str(row.get('created_at') or ''), amount=0, assignedTo='', notes='', history=[])
                item.update(data)
                item.update(id=ident, customerId=str(row['customer_id']), furnitureType=row['furniture_type'], description=row['description'] or '', status={'new':'Нова','pending':'Нова','in_progress':'В процес','completed':'Завършена','cancelled':'Отказана'}.get(row['status'],row['status']), materials=allocations.get(ident, []))
            result[kind].append(item)
    for user in session.scalars(select(User).where(User.role.in_(['admin', 'designer']))):
        result['users'].append(dict(id=str(user.id), name=user.name or user.username, username=user.username, email=user.email, role='admin' if user.role=='admin' else 'worker', active=user.active))
    return result


@router.get('/state')
def get_state(user=Depends(staff), session=Depends(db)):
    return state(session)


class Mutation(BaseModel):
    record: dict | None = None
    previous: dict | None = None


def validate_order(row, snapshot):
    if row['customerId'] not in {x['id'] for x in snapshot['customers']}:
        raise HTTPException(422, 'Избери съществуващ клиент.')
    if row['assignedTo'] and row['assignedTo'] not in {x['id'] for x in snapshot['users'] if x['active']}:
        raise HTTPException(422, 'Избери активен служител.')
    seen = set()
    for line in row['materials']:
        material = next((m for m in snapshot['materials'] if m['id']==line['materialId']), None)
        if not material or material['id'] in seen:
            raise HTTPException(422, 'Невалиден или повторен материал.')
        seen.add(material['id'])
        reserved = sum(a['quantity'] for o in snapshot['orders'] if o['id']!=row['id'] and o['status'] in ('Нова','В процес') for a in o['materials'] if a['materialId']==material['id'])
        if row['status'] in ('Нова','В процес') and reserved+line['quantity'] > material['stock']:
            raise HTTPException(409, 'Недостатъчна наличност: '+material['name'])


@router.put('/{kind}/{ident}')
def mutate(kind: str, ident: str, change: Mutation, user=Depends(staff), session=Depends(db)):
    if kind not in KINDS:
        raise HTTPException(404)
    if session.bind.dialect.name == 'postgresql':
        session.execute(text('SELECT pg_advisory_xact_lock(736291)'))
    snapshot = state(session)
    old = next((r for r in snapshot[kind] if r['id']==ident), None)
    if old != change.previous:
        raise HTTPException(409, 'Данните са променени. Презареди страницата и опитай отново.')
    row = change.record
    if row is not None:
        from pydantic import ValidationError
        try:
            row = MODELS[kind].model_validate(row).model_dump()
        except ValidationError as error:
            raise HTTPException(422, str(error))
        if row['id'] != ident:
            raise HTTPException(422, 'Идентификаторът не съвпада.')
    if user.role != 'admin':
        if kind!='orders' or old is None or row is None or any(row[k]!=v for k,v in old.items() if k not in ('status','history')):
            raise HTTPException(403, 'Необходим е администратор.')
    if row is None:
        if old is None:
            raise HTTPException(404)
        linked = any((kind=='customers' and o['customerId']==ident) or (kind=='materials' and any(a['materialId']==ident for a in o['materials'])) or (kind=='users' and o['assignedTo']==ident) for o in snapshot['orders'])
        if linked or (kind=='users' and ident==str(user.id)):
            raise HTTPException(409, 'Записът се използва и не може да бъде изтрит.')
    elif kind=='orders':
        validate_order(row, snapshot)
        history = old['history'][:] if old else []
        if not old or row['status']!=old['status'] or row['history']!=history:
            note = str(row['history'][-1].get('note',''))[:5000] if row['history'] else ''
            history.append({'id': __import__('uuid').uuid4().hex, 'status':row['status'], 'at':datetime.now(timezone.utc).isoformat(), 'actor':user.name or user.username, 'note':note})
        row['history'] = history
    elif kind=='materials':
        if any(m['id']!=ident and m['sku'].lower()==row['sku'].lower() for m in snapshot['materials']):
            raise HTTPException(409, 'Кодът на материала вече съществува.')
        snapshot['materials'] = [m for m in snapshot['materials'] if m['id']!=ident]+[row]
        for order in snapshot['orders']:
            if any(a['materialId']==ident for a in order['materials']):
                validate_order(order, snapshot)
    elif kind=='users':
        if ident==str(user.id) and (not row['active'] or row['role']!='admin'):
            raise HTTPException(409, 'Не можеш да ограничиш собствения си достъп.')
        if not old and not row['password']:
            raise HTTPException(422, 'Въведи парола за новия потребител.')
    try:
        target = table(session, kind)
        if row is None:
            if kind=='orders':
                lines = table(session, 'order_materials')
                session.execute(delete(lines).where(lines.c.order_id==int(ident)))
            session.execute(delete(target).where(target.c.id==int(ident)))
            meta = extra(session,kind,ident)
            if meta: session.delete(meta)
        else:
            if kind=='customers': values = {k:row[k] for k in ('name','email','phone')}
            elif kind=='materials': values = {k:row[k] for k in ('name','unit')}
            elif kind=='orders': values = dict(customer_id=int(row['customerId']), furniture_type=row['furnitureType'], description=row['description'], status=row['status'])
            else:
                values = {k:row[k] for k in ('name','username','email','active')}
                values['role'] = 'admin' if row['role']=='admin' else 'designer'
                if row.pop('password', None): values['password_hash'] = passwords.hash(change.record['password'])
            if old:
                session.execute(update(target).where(target.c.id==int(ident)).values(**values))
            else:
                ident = str(session.execute(insert(target).values(**values).returning(target.c.id)).scalar_one())
            row['id'] = ident
            if kind=='orders':
                lines = table(session, 'order_materials')
                session.execute(delete(lines).where(lines.c.order_id==int(ident)))
                for line in row['materials']:
                    name = next(m['name'] for m in snapshot['materials'] if m['id']==line['materialId'])
                    session.execute(insert(lines).values(order_id=int(ident), material_id=int(line['materialId']), material_name=name, quantity=line['quantity']))
            if kind!='users':
                meta = extra(session,kind,ident)
                if not meta:
                    meta = Resource(kind='studio_'+kind, external_id=ident, payload='{}'); session.add(meta)
                meta.payload = json.dumps(row,ensure_ascii=False)
        audit(session,user,kind+'.'+('delete' if row is None else 'save'),ident)
        session.commit()
    except IntegrityError:
        session.rollback()
        raise HTTPException(409, 'Записът се използва или име/имейл вече съществува.')
    return state(session)
