from __future__ import annotations
import os, json, uuid, secrets, base64
from datetime import datetime, timedelta, timezone
from contextlib import asynccontextmanager
from typing import Any, Literal
import jwt
from pwdlib import PasswordHash
from fastapi import FastAPI, Depends, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator
from sqlalchemy import Integer, String, Text, ForeignKey, DateTime, UniqueConstraint, select
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker, Session

from pathlib import Path
from sqlalchemy import func, Boolean
from sqlalchemy.exc import IntegrityError
from database import engine
from auth import JWT_SECRET_KEY

SECRET = os.environ.get('AUTH_SECRET') or JWT_SECRET_KEY
ORIGINS = [x.strip() for x in os.environ.get('FRONTEND_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173').split(',') if x.strip()]
SECURE = os.environ.get('COOKIE_SECURE', 'false').lower() == 'true'
SessionLocal = sessionmaker(engine, expire_on_commit=False)
passwords = PasswordHash.recommended()
STATUSES = ['Нова заявка','В процес на разглеждане','Изготвяне на оферта','Очаква потвърждение','Потвърдена','В производство','Готова','Доставка / Монтаж','Завършена','Отказана']
class Base(DeclarativeBase): pass
class User(Base):
    __tablename__ = 'users'
    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(50), unique=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True, server_default='true')
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    email: Mapped[str] = mapped_column(String(254), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(Text)
    name: Mapped[str] = mapped_column(String(100), server_default='')
    phone: Mapped[str] = mapped_column(String(30), default='', server_default='')
    city: Mapped[str] = mapped_column(String(100), default='', server_default='')
    role: Mapped[str] = mapped_column(String(20), default='client')
class ProductRow(Base):
    __tablename__ = 'fp_products'
    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    payload: Mapped[str] = mapped_column(Text)
class Configuration(Base):
    __tablename__ = 'fp_configurations'
    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete='RESTRICT'), index=True)
    product_id: Mapped[str] = mapped_column(ForeignKey('fp_products.id', ondelete='RESTRICT'), index=True)
    payload: Mapped[str] = mapped_column(Text)
class Favorite(Base):
    __tablename__ = 'fp_favorites'
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'), primary_key=True)
    product_id: Mapped[str] = mapped_column(ForeignKey('fp_products.id', ondelete='CASCADE'), primary_key=True)
class InquiryRow(Base):
    __tablename__ = 'fp_inquiries'
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey('users.id', ondelete='RESTRICT'), nullable=True, index=True)
    email: Mapped[str] = mapped_column(String(254), index=True)
    payload: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(50), default=STATUSES[0])
    notes: Mapped[str] = mapped_column(Text, default='', server_default='')
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
class Resource(Base):
    __tablename__ = 'fp_resources'
    __table_args__ = (UniqueConstraint('kind','external_id'),)
    id: Mapped[int] = mapped_column(primary_key=True)
    kind: Mapped[str] = mapped_column(String(30), index=True)
    external_id: Mapped[str] = mapped_column(String(80))
    payload: Mapped[str] = mapped_column(Text)
class Audit(Base):
    __tablename__ = 'fp_audit'
    id: Mapped[int] = mapped_column(primary_key=True)
    actor_id: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete='RESTRICT'))
    action: Mapped[str] = mapped_column(String(80))
    target: Mapped[str] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
class OrderLink(Base):
    __tablename__ = 'fp_order_links'
    id: Mapped[int] = mapped_column(primary_key=True)
    legacy_order_id: Mapped[int] = mapped_column(Integer, unique=True)
    inquiry_id: Mapped[int] = mapped_column(ForeignKey('fp_inquiries.id', ondelete='RESTRICT'), unique=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete='RESTRICT'))

@asynccontextmanager
async def lifespan(app: FastAPI):
    initialize()
    yield
app = FastAPI(title='FurniPro website API', version='2.0.0', lifespan=lifespan, docs_url='/api/docs', openapi_url='/api/openapi.json')
app.add_middleware(CORSMiddleware, allow_origins=ORIGINS, allow_credentials=True, allow_methods=['GET','POST','PUT','PATCH','DELETE'], allow_headers=['Content-Type'])
@app.middleware('http')
async def security(request: Request, call_next):
    if request.method in {'POST','PUT','PATCH','DELETE'}:
        origin = request.headers.get('origin')
        if origin not in ORIGINS:
            return Response('Origin is not allowed', status_code=403)
        if len(await request.body()) > 3_000_000:
            return Response('Request too large', status_code=413)
    response = await call_next(request)
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['Cache-Control'] = 'no-store'
    return response

def db():
    with SessionLocal() as session: yield session

def optional_user(request: Request, session: Session = Depends(db)):
    token = request.cookies.get('fp_session')
    if not token: return None
    try:
        payload = jwt.decode(token, SECRET, algorithms=['HS256'], audience='furnipro', issuer='furnipro-api')
        user = session.get(User, int(payload['sub']))
        return user if user and user.active else None
    except (jwt.PyJWTError, ValueError, KeyError): return None

def current_user(user=Depends(optional_user)):
    if user is None: raise HTTPException(401, 'Влез в профила си.')
    return user

def staff(user=Depends(current_user)):
    if user.role not in {'admin','designer'}: raise HTTPException(403, 'Необходим е служебен достъп.')
    return user

def admin(user=Depends(staff)):
    if user.role != 'admin': raise HTTPException(403, 'Необходим е администратор.')
    return user

def user_json(u): return {'id':u.id,'name':u.name,'email':u.email,'phone':u.phone,'city':u.city,'role':{'client':'customer','designer':'employee'}.get(u.role,u.role)}
def audit(session, actor, action, target): session.add(Audit(actor_id=actor.id, action=action, target=str(target)))
def cookie(response, user):
    now = datetime.now(timezone.utc)
    token = jwt.encode({'sub':str(user.id),'iat':now,'exp':now+timedelta(hours=8),'aud':'furnipro','iss':'furnipro-api','jti':secrets.token_urlsafe(16)}, SECRET, algorithm='HS256')
    response.set_cookie('fp_session', token, httponly=True, secure=SECURE, samesite='none' if SECURE else 'lax', max_age=28800, path='/')
class Register(BaseModel):
    model_config = ConfigDict(extra='forbid')
    email: EmailStr
    password: str = Field(min_length=10, max_length=128)
    name: str = Field(min_length=2, max_length=100)
    phone: str = Field(min_length=7, max_length=30, pattern=r'^\+?[0-9 ()-]+$')

    @field_validator('name', 'email', 'phone', mode='before')
    @classmethod
    def strip_contact(cls, value):
        return value.strip() if isinstance(value, str) else value

    @field_validator('phone')
    @classmethod
    def valid_phone(cls, value):
        if not 7 <= sum(c.isdigit() for c in value) <= 15:
            raise ValueError('Въведи валиден телефонен номер с 7 до 15 цифри.')
        return value
class Login(BaseModel):
    email: str = Field(min_length=1, max_length=254)
    password: str = Field(min_length=1, max_length=128)
class ProfilePatch(BaseModel):
    name: str = Field(min_length=2,max_length=100)
    phone: str = Field(default='',max_length=30)
    city: str = Field(default='',max_length=100)
@app.get('/')
def root(): return {'name':'FurniPro API','version':'2.0.0'}
@app.post('/api/auth/register',status_code=201)
def register(data:Register,response:Response,session:Session=Depends(db)):
    email = str(data.email).lower()
    if session.scalar(select(User).where(func.lower(User.email)==email)): raise HTTPException(409,'Имейлът вече е регистриран.')
    u=User(username='client_'+uuid.uuid4().hex[:24],email=email,name=data.name,phone=data.phone,password_hash=passwords.hash(data.password),role='client');session.add(u)
    try: session.commit()
    except IntegrityError:
        session.rollback();raise HTTPException(409,'Имейлът вече е регистриран.')
    cookie(response,u);return user_json(u)
@app.post('/api/auth/login')
def login(data:Login,response:Response,session:Session=Depends(db)):
    u=session.scalar(select(User).where((func.lower(User.email)==data.email.lower()) | (func.lower(User.username)==data.email.lower())))
    ok=passwords.verify(data.password,u.password_hash if u else passwords.hash('dummy-password-no-account'))
    if not u or not u.active or not ok: raise HTTPException(401,'Невалиден имейл или парола.')
    cookie(response,u);return user_json(u)
@app.post('/api/auth/logout',status_code=204)
def logout(response:Response): response.delete_cookie('fp_session',path='/',secure=SECURE,httponly=True,samesite='none' if SECURE else 'lax')
@app.get('/api/auth/me')
def me(user=Depends(current_user)): return user_json(user)
@app.patch('/api/auth/me')
def edit_profile(data:ProfilePatch,user=Depends(current_user),session:Session=Depends(db)):
    u=session.get(User,user.id)
    for k,v in data.model_dump().items(): setattr(u,k,v)
    session.commit();return user_json(u)
class ProductSize(BaseModel):
    id: str = Field(max_length=80)
    w: float = Field(gt=0,le=1000,allow_inf_nan=False)
    h: float = Field(gt=0,le=1000,allow_inf_nan=False)
    d: float = Field(gt=0,le=1000,allow_inf_nan=False)
    label: str | None = None

class ProductIn(BaseModel):
    model_config=ConfigDict(extra='forbid',allow_inf_nan=False)
    variant: str | None = None
    cleanImage: str | None = None
    decorationTheme: str | None = None
    sizeOptions: list[ProductSize] | None = None
    purpose: str | None = None
    frequent: bool = False
    bestseller: bool = False
    priceOnRequest: bool = False
    id: str = Field(max_length=80)
    name: str = Field(min_length=1,max_length=150)
    category: str = Field(max_length=100)
    kind: str = Field(max_length=30)
    description: str = Field(max_length=2000)
    style: str = Field(max_length=100)
    material: str = Field(max_length=100)
    color: str = Field(max_length=100)
    price: float = Field(ge=0,le=1000000)
    w: int = Field(gt=0,le=1000)
    h: int = Field(gt=0,le=1000)
    d: int = Field(gt=0,le=1000)
    image: str = Field(max_length=1_400_000)
    @field_validator('image', 'cleanImage')
    @classmethod
    def image_source(cls, value):
        if not value: return value
        if value.startswith('data:'):
            return InquiryIn.validate_image(value)
        if not value.startswith(('https://', '/assets/', 'photo-')):
            raise ValueError('Invalid image URL')
        return value
@app.get('/api/library')
def public_library(session:Session=Depends(db)):
    return {kind:[json.loads(r.payload) for r in session.scalars(select(Resource).where(Resource.kind==kind))] for kind in ['materials','portfolio','pricing']}

@app.get('/api/products')
def products(session:Session=Depends(db)): return [json.loads(p.payload) for p in session.scalars(select(ProductRow))]

@app.get('/api/favorites')
def favorites(user=Depends(current_user),session:Session=Depends(db)):
    return list(session.scalars(select(Favorite.product_id).where(Favorite.user_id==user.id).order_by(Favorite.product_id)))

@app.put('/api/favorites/{pid}',status_code=204)
def add_favorite(pid:str,user=Depends(current_user),session:Session=Depends(db)):
    if not session.get(ProductRow,pid): raise HTTPException(404,'Моделът не е наличен.')
    if not session.get(Favorite,(user.id,pid)):
        session.add(Favorite(user_id=user.id,product_id=pid))
        try: session.commit()
        except IntegrityError:
            session.rollback()
            if not session.get(Favorite,(user.id,pid)): raise HTTPException(409,'Моделът вече не е наличен.')

@app.delete('/api/favorites/{pid}',status_code=204)
def remove_favorite(pid:str,user=Depends(current_user),session:Session=Depends(db)):
    favorite=session.get(Favorite,(user.id,pid))
    if favorite:
        session.delete(favorite);session.commit()
@app.post('/api/admin/products',status_code=201)
def add_product(data:ProductIn,user=Depends(admin),session:Session=Depends(db)):
    if session.get(ProductRow,data.id): raise HTTPException(409,'Моделът съществува.')
    session.add(ProductRow(id=data.id,payload=data.model_dump_json()));audit(session,user,'product.create',data.id);session.commit();return data
@app.put('/api/admin/products/{pid}')
def edit_product(pid:str,data:ProductIn,user=Depends(admin),session:Session=Depends(db)):
    p=session.get(ProductRow,pid)
    if not p: raise HTTPException(404,'Няма такъв модел.')
    if pid != data.id: raise HTTPException(422,'Идентификаторът не съвпада.')
    p.payload=data.model_dump_json();audit(session,user,'product.update',pid);session.commit();return data
@app.delete('/api/admin/products/{pid}',status_code=204)
def delete_product(pid:str,user=Depends(admin),session:Session=Depends(db)):
    p=session.get(ProductRow,pid)
    if not p: raise HTTPException(404)
    if session.scalar(select(Configuration).where(Configuration.product_id==pid)): raise HTTPException(409,'Моделът се използва в конфигурации.')
    session.delete(p);audit(session,user,'product.delete',pid);session.commit()
class ConfigIn(BaseModel):
    model_config=ConfigDict(extra='allow')
    id: str = Field(max_length=80)
    productId: str = Field(max_length=80)
    name: str = Field(max_length=150)
    w: int = Field(ge=30,le=400)
    h: int = Field(ge=25,le=280)
    d: int = Field(ge=25,le=240)
    quantity: int = Field(ge=1,le=20)
@app.get('/api/configurations')
def configurations(user=Depends(current_user),session:Session=Depends(db)):
    return [json.loads(c.payload) for c in session.scalars(select(Configuration).where(Configuration.user_id==user.id))]
@app.post('/api/configurations',status_code=201)
def save_config(data:ConfigIn,user=Depends(current_user),session:Session=Depends(db)):
    if not session.get(ProductRow,data.productId): raise HTTPException(422,'Моделът не е наличен.')
    if session.get(Configuration,data.id): raise HTTPException(409,'Конфигурацията вече съществува.')
    session.add(Configuration(id=data.id,user_id=user.id,product_id=data.productId,payload=data.model_dump_json()));session.commit();return data
@app.delete('/api/configurations/{cid}',status_code=204)
def remove_config(cid:str,user=Depends(current_user),session:Session=Depends(db)):
    c=session.get(Configuration,cid)
    if not c or c.user_id!=user.id: raise HTTPException(404)
    session.delete(c);session.commit()
class InquiryIn(BaseModel):
    model_config=ConfigDict(extra='forbid')
    name:str=Field(min_length=2,max_length=100)
    email:EmailStr
    phone:str=Field(min_length=6,max_length=30,pattern=r'^[+0-9 ()-]+$')
    city:str=Field(min_length=1,max_length=100)
    category:str=Field(max_length=100)
    description:str=Field(min_length=10,max_length=5000)
    budget:float=Field(ge=0,le=1000000)
    dimensions:str=Field(default='',max_length=150)
    material:str=Field(default='',max_length=150)
    config:dict[str,Any]|None=None
    attachment:str|None=None
    @field_validator('attachment')
    @classmethod
    def validate_image(cls,v):
        if not v:return v
        if len(v)>2_800_000:raise ValueError('Image too large')
        try:
            head,encoded=v.split(',',1)
            if head not in {'data:image/jpeg;base64','data:image/png;base64','data:image/webp;base64'}:raise ValueError()
            raw=base64.b64decode(encoded,validate=True)
            valid=(head.startswith('data:image/jpeg') and raw.startswith(b'\xff\xd8\xff')) or (head.startswith('data:image/png') and raw.startswith(b'\x89PNG\r\n\x1a\n')) or (head.startswith('data:image/webp') and raw.startswith(b'RIFF') and raw[8:12]==b'WEBP')
            if not valid: raise ValueError()
        except Exception: raise ValueError('Invalid image')
        return v
class InquiryPatch(BaseModel):
    model_config=ConfigDict(extra='forbid')
    status:str|None=None
    notes:str|None=Field(default=None,max_length=5000)
    description:str|None=Field(default=None,min_length=10,max_length=10000)

def inquiry_json(q,include_notes=False):
    data=json.loads(q.payload);data.update(id=q.id,status=q.status,created_at=q.created_at.isoformat())
    if include_notes:data['notes']=q.notes
    return data
@app.post('/api/inquiries',status_code=201)
def create_inquiry(data:InquiryIn,user=Depends(optional_user),session:Session=Depends(db)):
    q=InquiryRow(user_id=user.id if user else None,email=str(data.email).lower(),payload=data.model_dump_json(),status=STATUSES[0]);session.add(q);session.commit();return inquiry_json(q)
@app.get('/api/inquiries')
def inquiries(user=Depends(current_user),session:Session=Depends(db)):
    query=select(InquiryRow).order_by(InquiryRow.created_at.desc())
    if user.role=='client':query=query.where(InquiryRow.user_id==user.id)
    return [inquiry_json(q,user.role!='client') for q in session.scalars(query)]
@app.patch('/api/inquiries/{qid}')
def update_inquiry(qid:int,data:InquiryPatch,user=Depends(current_user),session:Session=Depends(db)):
    q=session.get(InquiryRow,qid)
    if not q:raise HTTPException(404)
    if user.role=='client':
        if q.user_id!=user.id:raise HTTPException(404)
        if data.status is not None or data.notes is not None:raise HTTPException(403)
        if STATUSES.index(q.status)>=5:raise HTTPException(409,'Производството е започнало.')
    if data.status is not None:
        if data.status not in STATUSES:raise HTTPException(422,'Невалиден статус.')
        q.status=data.status
    if data.notes is not None:q.notes=data.notes
    if data.description is not None:
        payload=json.loads(q.payload);payload['description']=data.description;q.payload=json.dumps(payload,ensure_ascii=False)
    audit(session,user,'inquiry.update',qid);session.commit();return inquiry_json(q,user.role!='client')
@app.delete('/api/inquiries/{qid}',status_code=204)
def remove_inquiry(qid:int,user=Depends(admin),session:Session=Depends(db)):
    q=session.get(InquiryRow,qid)
    if not q:raise HTTPException(404)
    if session.scalar(select(OrderLink).where(OrderLink.inquiry_id==qid)):raise HTTPException(409,'Запитването е свързано с поръчка.')
    session.delete(q);audit(session,user,'inquiry.delete',qid);session.commit()
RESOURCES={'customers','materials','portfolio','pricing'}
class ResourceIn(BaseModel):
    id:str=Field(max_length=80)
    name:str=Field(min_length=1,max_length=150)
    description:str=Field(default='',max_length=5000)
    email:str=Field(default='',max_length=254)
    phone:str=Field(default='',max_length=30)
    value:float=Field(default=0,ge=0,le=1000000)
def resource_query(kind):
    if kind not in RESOURCES:raise HTTPException(404)
    return select(Resource).where(Resource.kind==kind)
@app.get('/api/admin/{kind}')
def resource_list(kind:str,user=Depends(staff),session:Session=Depends(db)):
    return [json.loads(r.payload) for r in session.scalars(resource_query(kind))]
@app.post('/api/admin/{kind}',status_code=201)
def resource_create(kind:str,data:ResourceIn,user=Depends(admin),session:Session=Depends(db)):
    resource_query(kind)
    if session.scalar(resource_query(kind).where(Resource.external_id==data.id)):raise HTTPException(409)
    session.add(Resource(kind=kind,external_id=data.id,payload=data.model_dump_json()));audit(session,user,kind+'.create',data.id);session.commit();return data
@app.put('/api/admin/{kind}/{rid}')
def resource_edit(kind:str,rid:str,data:ResourceIn,user=Depends(admin),session:Session=Depends(db)):
    r=session.scalar(resource_query(kind).where(Resource.external_id==rid))
    if not r:raise HTTPException(404)
    if rid!=data.id:raise HTTPException(422)
    r.payload=data.model_dump_json();audit(session,user,kind+'.update',rid);session.commit();return data
@app.delete('/api/admin/{kind}/{rid}',status_code=204)
def resource_delete(kind:str,rid:str,user=Depends(admin),session:Session=Depends(db)):
    r=session.scalar(resource_query(kind).where(Resource.external_id==rid))
    if not r:raise HTTPException(404)
    session.delete(r);audit(session,user,kind+'.delete',rid);session.commit()


def initialize():
    if engine.dialect.name == 'sqlite' and os.environ.get('FURNIPRO_TESTING') == '1':
        Base.metadata.create_all(engine)
        from schema import initialize_legacy
        initialize_legacy(engine)
    else:
        from migrations import migrate
        migrate(engine)
    with SessionLocal() as session:
        seeded = session.scalar(select(Resource).where(Resource.kind=='bootstrap',Resource.external_id=='catalog-68-v1'))
        if seeded:
            return
        for p in json.loads(Path(__file__).with_name('catalog.json').read_text(encoding='utf-8')):
            if not session.get(ProductRow,p['id']):
                session.add(ProductRow(id=p['id'],payload=json.dumps(p,ensure_ascii=False)))
        for kind, rows in json.loads(Path(__file__).with_name('library.json').read_text(encoding='utf-8')).items():
            for row in rows:
                if not session.scalar(select(Resource).where(Resource.kind==kind,Resource.external_id==row['id'])):
                    session.add(Resource(kind=kind,external_id=row['id'],payload=json.dumps(row,ensure_ascii=False)))
        session.add(Resource(kind='bootstrap',external_id='catalog-68-v1',payload='{}'))
        session.commit()

from studio_api import router as studio_router
app.include_router(studio_router)
