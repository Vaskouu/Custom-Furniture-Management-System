import os,tempfile
from pathlib import Path
os.environ['FURNIPRO_TESTING']='1'
os.environ['JWT_SECRET_KEY']='a-test-only-secret-with-over-thirty-two-characters'
os.environ['DATABASE_URL']='sqlite:///'+str(Path(tempfile.mkdtemp())/'test.db')
os.environ['AUTH_SECRET']='a-test-only-secret-with-over-thirty-two-characters'
os.environ['COOKIE_SECURE']='false'
os.environ['FRONTEND_ORIGINS']='http://localhost:5173'
from fastapi.testclient import TestClient
from main import app
from public_api import SessionLocal,User,passwords,engine,Base
from sqlalchemy import select,text
ORIGIN={'Origin':'http://localhost:5173'}

def test_favorites_are_private_persistent_and_idempotent():
    with TestClient(app) as c:
        assert c.get('/api/favorites').status_code==401
        products=c.get('/api/products').json()
        pid=products[0]['id']
        path='/api/favorites/'+pid
        assert c.put(path,headers=ORIGIN).status_code==401
        customer(c,'favorites-a@example.com')
        assert c.put(path,headers=ORIGIN).status_code==204
        assert c.put(path,headers=ORIGIN).status_code==204
        assert c.get('/api/favorites').json()==[pid]
        c.post('/api/auth/logout',headers=ORIGIN)
        customer(c,'favorites-b@example.com')
        assert c.get('/api/favorites').json()==[]
        c.delete(path,headers=ORIGIN)
        c.post('/api/auth/logout',headers=ORIGIN)
        c.post('/api/auth/login',json={'email':'favorites-a@example.com','password':'a-valid-long-password'},headers=ORIGIN)
        assert c.get('/api/favorites').json()==[pid]
        assert c.put('/api/favorites/missing-product',headers=ORIGIN).status_code==404
        assert c.delete(path,headers=ORIGIN).status_code==204
        assert c.get('/api/favorites').json()==[]
def customer(client,email='client@example.com'):
    return client.post('/api/auth/register',json={'name':'Test User','email':email,'phone':'+359 888 111 222','password':'a-valid-long-password'},headers=ORIGIN)
def inquiry(client):
    return client.post('/api/inquiries',json={'name':'Иван Петров','email':'test@example.com','phone':'+359888111222','city':'Бургас','category':'Бюра','description':'Работно бюро за кабинет','budget':500,'dimensions':'140x75x60','material':'МДФ'},headers=ORIGIN)

def test_customer_registration_contacts_password_and_login():
    payload={'name':'  Иван Петров  ','email':' New.Customer@Example.com ','phone':'+359 888 123 456','password':'my-personal-password'}
    with TestClient(app) as c:
        response=c.post('/api/auth/register',json=payload,headers=ORIGIN)
        assert response.status_code==201,response.text
        account=response.json()
        assert account['name']=='Иван Петров'
        assert account['email']=='new.customer@example.com'
        assert account['phone']==payload['phone']
        assert account['role']=='customer'
        assert 'password' not in account and 'password_hash' not in account
        assert c.get('/api/auth/me').json()['id']==account['id']
        assert c.get('/api/studio/state').status_code==403
        with SessionLocal() as db:
            stored=db.get(User,account['id'])
            assert stored.role=='client' and stored.password_hash!=payload['password']
            assert passwords.verify(payload['password'],stored.password_hash)
        assert c.post('/api/auth/register',json=payload,headers=ORIGIN).status_code==409
        c.post('/api/auth/logout',headers=ORIGIN)
        assert c.post('/api/auth/login',json={'email':account['email'],'password':'wrong-password'},headers=ORIGIN).status_code==401
        assert c.post('/api/auth/login',json={'email':account['email'],'password':payload['password']},headers=ORIGIN).status_code==200
        assert c.get('/api/auth/me').json()['phone']==payload['phone']

def test_registration_rejects_invalid_contacts_and_short_password():
    payload={'name':'Test Customer','email':'valid@example.com','phone':'+359888123456','password':'a-valid-long-password'}
    with TestClient(app) as c:
        for patch in ({'name':'  '},{'email':'not-an-email'},{'phone':'abcdefghi'},{'phone':'-------'},{'password':'short'},{'role':'admin'}):
            assert c.post('/api/auth/register',json={**payload,**patch},headers=ORIGIN).status_code==422
def test_registration_cannot_elevate_role():
    with TestClient(app) as c:
        r=c.post('/api/auth/register',json={'name':'Test','email':'elevate@example.com','phone':'+359888111222','password':'a-valid-long-password','role':'admin'},headers=ORIGIN)
        assert r.status_code==422
        assert customer(c).status_code==201
        assert c.get('/api/auth/me').json()['role']=='customer'
        assert c.get('/api/admin/customers').status_code==403

def test_inquiry_ownership_and_internal_notes():
    with TestClient(app) as c:
        customer(c,'owner@example.com');q=inquiry(c).json();qid=q['id']
        assert c.patch('/api/inquiries/'+str(qid),json={'status':'В производство'},headers=ORIGIN).status_code==403
        with SessionLocal() as db:
            user=db.scalar(select(User).where(User.email=='owner@example.com'));user.role='admin';db.commit()
        assert c.patch('/api/inquiries/'+str(qid),json={'notes':'secret internal note','status':'Изготвяне на оферта'},headers=ORIGIN).status_code==200
        with SessionLocal() as db:
            user=db.scalar(select(User).where(User.email=='owner@example.com'));user.role='client';db.commit()
        assert 'notes' not in c.get('/api/inquiries').json()[0]
        c.post('/api/auth/logout',headers=ORIGIN);customer(c,'other@example.com')
        assert c.get('/api/inquiries').json()==[]
        assert c.patch('/api/inquiries/'+str(qid),json={'description':'Malicious change attempt'},headers=ORIGIN).status_code==404

def test_missing_origin_is_rejected():
    with TestClient(app) as c:
        assert c.post('/api/auth/login',json={'email':'x@example.com','password':'anything'}).status_code==403

def test_invalid_attachment_and_budget():
    with TestClient(app) as c:
        assert c.post('/api/inquiries',json={'name':'Test','email':'a@example.com','phone':'1234567','city':'Burgas','category':'desk','description':'Long description','budget':-5},headers=ORIGIN).status_code==422
        assert c.post('/api/inquiries',json={'name':'Test','email':'a@example.com','phone':'1234567','city':'Burgas','category':'desk','description':'Long description','budget':5,'attachment':'data:image/svg+xml;base64,abcd'},headers=ORIGIN).status_code==422

def test_admin_crud_and_product_reference():
    with TestClient(app) as c:
        customer(c,'admin@example.com')
        with SessionLocal() as db:
            u=db.scalar(select(User).where(User.email=='admin@example.com'));u.role='admin';db.commit()
        p={'id':'test-product','name':'Test Desk','category':'Бюра','kind':'desk','description':'Desk','style':'Съвременен','material':'МДФ','color':'Кашмир','price':500,'w':140,'h':75,'d':60,'image':'photo-1'}
        assert c.post('/api/admin/products',json=p,headers=ORIGIN).status_code==201
        assert any(x['id']=='test-product' for x in c.get('/api/products').json())
        assert c.post('/api/configurations',json={'id':'cfg1','productId':'test-product','name':'Desk','w':140,'h':25,'d':60,'quantity':1},headers=ORIGIN).status_code==201
        assert c.delete('/api/admin/products/test-product',headers=ORIGIN).status_code==409
        assert c.delete('/api/configurations/cfg1',headers=ORIGIN).status_code==204
        assert c.delete('/api/admin/products/test-product',headers=ORIGIN).status_code==204

def test_legacy_tables_are_not_destroyed():
    with engine.begin() as conn:
        conn.execute(text('CREATE TABLE IF NOT EXISTS customers (id INTEGER PRIMARY KEY, name TEXT)'))
        conn.execute(text('CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY, customer_id INTEGER REFERENCES customers(id))'))
        conn.execute(text("INSERT INTO customers (id,name,phone,email) VALUES (999,'Original customer','1234567','original@example.com')"))
    Base.metadata.create_all(engine)
    with engine.connect() as conn:
        assert conn.execute(text('SELECT name FROM customers WHERE id=999')).scalar()=='Original customer'


def test_studio_persists_legacy_rows_and_enforces_stock_and_permissions():
    import copy
    with TestClient(app) as c:
        customer(c,'studio-admin@example.com')
        with SessionLocal() as db:
            u=db.scalar(select(User).where(User.email=='studio-admin@example.com'))
            u.role='admin';u.username='studio_admin';db.commit()
        def save(kind,row,previous=None):
            return c.put('/api/studio/'+kind+'/'+row['id'],json={'record':row,'previous':previous},headers=ORIGIN)
        state=c.get('/api/studio/state').json()
        admin=next(u for u in state['users'] if u['username']=='studio_admin')
        client={'id':'new-client','name':'Studio Client','email':'studio-client@example.com','phone':'1234567','city':'Бургас','address':'','notes':'','createdAt':''}
        r=save('customers',client);assert r.status_code==200,r.text
        client=next(x for x in r.json()['customers'] if x['email']==client['email'])
        material={'id':'new-material','sku':'TEST-001','name':'Test oak','category':'Wood','unit':'м²','stock':10,'minimum':1,'color':'','supplier':'','notes':''}
        r=save('materials',material);assert r.status_code==200,r.text
        material=next(x for x in r.json()['materials'] if x['sku']=='TEST-001')
        worker={'id':'new-worker','name':'Test Worker','username':'test_worker','email':'worker@example.com','role':'worker','active':True,'password':'worker-long-password'}
        r=save('users',worker);assert r.status_code==200,r.text
        worker=next(x for x in r.json()['users'] if x['username']=='test_worker')
        assert 'password' not in worker
        order={'id':'new-order','number':'FP-TEST','customerId':client['id'],'title':'Desk','furnitureType':'Бюро','description':'A working desk','dimensions':{'w':140,'d':60,'h':75},'quantity':1,'status':'Нова','dueDate':'','createdAt':'','amount':500,'assignedTo':worker['id'],'materials':[{'materialId':material['id'],'quantity':6}],'notes':'','history':[]}
        r=save('orders',order);assert r.status_code==200,r.text
        order=next(x for x in r.json()['orders'] if x['number']=='FP-TEST')
        assert order['history'][0]['actor']=='Test User'
        second=copy.deepcopy(order);second.update(id='second-order',number='FP-SECOND')
        assert save('orders',second).status_code==409
        updated=copy.deepcopy(order);updated['amount']=600
        assert save('orders',updated,order).status_code==200
        assert save('orders',updated,order).status_code==409
        with engine.connect() as conn:
            assert conn.execute(text('SELECT name FROM customers WHERE id=:id'),{'id':int(client['id'])}).scalar()=='Studio Client'
            assert conn.execute(text('SELECT quantity FROM order_materials WHERE order_id=:id'),{'id':int(order['id'])}).scalar()==6
        c.post('/api/auth/logout',headers=ORIGIN)
        assert c.post('/api/auth/login',json={'email':'test_worker','password':'worker-long-password'},headers=ORIGIN).status_code==200
        assert save('customers',{**client,'name':'Unauthorized'},client).status_code==403
        state=c.get('/api/studio/state').json();order=next(x for x in state['orders'] if x['id']==order['id'])
        changed=copy.deepcopy(order);changed['status']='В процес'
        assert save('orders',changed,order).status_code==200
        order=next(x for x in c.get('/api/studio/state').json()['orders'] if x['id']==order['id'])
        assert save('orders',{**order,'amount':1},order).status_code==403
        # Both login contracts use the same user and password hash.
        old_login=c.post('/auth/login',json={'username':'test_worker','password':'worker-long-password'})
        assert old_login.status_code==200
        assert c.get('/orders',headers={'Authorization':'Bearer '+old_login.json()['access_token']}).status_code==200
        with SessionLocal() as db:
            u=db.get(User,int(worker['id']));u.active=False;db.commit()
        assert c.get('/api/studio/state').status_code==401
        assert c.get('/orders',headers={'Authorization':'Bearer '+old_login.json()['access_token']}).status_code==401


def test_catalog_fields_survive_edit_and_restart():
    with TestClient(app) as c:
        customer(c,'catalog-admin@example.com')
        with SessionLocal() as db:
            u=db.scalar(select(User).where(User.email=='catalog-admin@example.com'));u.role='admin';db.commit()
        products=c.get('/api/products').json()
        assert len(products)>=68
        product=products[0]
        product.update(name='Updated product',purpose='Кабинет',frequent=True,sizeOptions=[{'id':'size1','w':140,'h':75,'d':60}])
        r=c.put('/api/admin/products/'+product['id'],json=product,headers=ORIGIN)
        assert r.status_code==200,r.text
    with TestClient(app) as c:
        updated=next(p for p in c.get('/api/products').json() if p['id']==product['id'])
        assert updated['name']=='Updated product' and updated['frequent'] is True
        assert updated['sizeOptions'][0]['w']==140
        assert c.post('/api/auth/login',json={'email':'catalog-admin@example.com','password':'a-valid-long-password'},headers=ORIGIN).status_code==200
        bad={**updated,'image':'javascript:alert(1)'}
        assert c.put('/api/admin/products/'+updated['id'],json=bad,headers=ORIGIN).status_code==422
        assert c.delete('/api/admin/products/'+updated['id'],headers=ORIGIN).status_code==204
    with TestClient(app) as c:
        assert not any(p['id']==product['id'] for p in c.get('/api/products').json())
