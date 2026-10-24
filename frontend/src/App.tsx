import { useState } from 'react'
import './App.css'

type Page = 'dashboard' | 'customers' | 'orders'

function App() {
  const [activePage, setActivePage] = useState<Page>('dashboard')

  return (
    <div className="app">
      <aside className="sidebar">
        <h1>FurniPro</h1>
        <p>Управление на мебелно студио</p>

        <nav>
          <a
            href="#dashboard"
            onClick={() => setActivePage('dashboard')}
          >
            Табло
          </a>

          <a
            href="#customers"
            onClick={() => setActivePage('customers')}
          >
            Клиенти
          </a>

          <a
            href="#orders"
            onClick={() => setActivePage('orders')}
          >
            Поръчки
          </a>
        </nav>
      </aside>

      <main className="content">
        {activePage === 'dashboard' && (
          <>
            <header>
              <h2>Табло за управление</h2>
              <p>Добре дошли във FurniPro!</p>
            </header>

            <section className="cards">
              <div className="card">
                <h3>Клиенти</h3>
                <p>Управление на клиентите</p>
              </div>

              <div className="card">
                <h3>Поръчки</h3>
                <p>Проследяване на поръчките</p>
              </div>

              <div className="card">
                <h3>Проекти</h3>
                <p>Мебели по поръчка</p>
              </div>
            </section>
          </>
        )}

        {activePage === 'customers' && (
          <header>
            <h2>Клиенти</h2>
            <p>Тук ще управляваме клиентите на мебелното студио.</p>
          </header>
        )}

        {activePage === 'orders' && (
          <header>
            <h2>Поръчки</h2>
            <p>Тук ще управляваме поръчките за мебели.</p>
          </header>
        )}
      </main>
    </div>
  )
}

export default App