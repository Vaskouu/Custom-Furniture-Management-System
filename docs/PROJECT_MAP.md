# Ориентир в FurniPro

Отвори `FurniPro.code-workspace` във Visual Studio Code. Зависимостите, компилираните файлове и резервните копия са скрити само от Explorer, без да са изтрити.

| Какво търся? | Къде е? |
| --- | --- |
| Главна навигация | `frontend/src/App.tsx` |
| Каталог и изображения | `frontend/src/features/catalog/` |
| Конфигуратор, опции и геометрия | `frontend/src/features/configurator/` |
| Детски вратички | `fronts.ts`, `FrontControls.tsx` в конфигуратора |
| Кухненски планировчик | `frontend/src/features/kitchen/` |
| Регистрация и профил | `frontend/src/features/account/` |
| Клиентски запитвания | `frontend/src/features/inquiries/` |
| Административно студио | `frontend/src/features/studio/`, разделите са в `pages/` |
| Любими и общо състояние | `frontend/src/store.tsx` |
| Общи компоненти и вход | `frontend/src/components.tsx` |
| API клиент | `frontend/src/api.ts` |
| Начални модели и типове | `frontend/src/data.ts` |
| Ориентировъчни цени | `frontend/src/pricing.ts` |
| Оригинален CRUD | `backend/main.py` |
| Профили, любими, конфигурации | `backend/public_api.py` |
| Връзка със старите таблици | `backend/studio_api.py` |
| Таблици и миграции | `backend/sql/` и неговото `README.md` |
| Миграционен механизъм | `backend/migrations.py`, `backend/manage.py` |
| Тестове | `frontend/tests/`, `backend/test_public_api.py`, `backend/verify_migrations.py` |
| Брояч на редовете | `scripts/project_stats.py` |

## Стартиране след рестарт

1. PostgreSQL услугата трябва да работи.
2. От корена: `cd backend`, после `.\.venv\Scripts\python.exe -m uvicorn main:app --reload`.
3. Втори терминал от корена: `cd frontend`, после `npm run dev`.
4. Отвори http://localhost:5173 и остави двата терминала отворени.

Не е нужно да инсталираш зависимостите отново при всяко включване.
