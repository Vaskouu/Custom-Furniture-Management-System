# FurniPro frontend

React + TypeScript + Vite. Дизайнът, страниците и изображенията са копирани от предоставения завършен проект.

```powershell
npm install
npm run dev
```

Стартирай и FastAPI от `backend`. По подразбиране `/api` се препраща към `http://127.0.0.1:8000`. `VITE_DEMO=true` включва оригиналното локално демо; нормалният режим записва в базата.

`npm run build` — production build. `npm test` — тестове на конфигуратора, кухните и студиото.

`node scripts/export-catalog.mjs` обновява началния JSON каталог в бекенда от изходните TypeScript модели; не променя вече записаните продукти в PostgreSQL.

Подробните инструкции са в основния README.md.
