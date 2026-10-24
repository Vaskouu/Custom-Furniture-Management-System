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
  <section className="customers-page">
    <header>
      <h2>Клиенти</h2>
      <p>Списък с клиентите на мебелното студио.</p>
    </header>

    <div className="table-container">
      <table className="customers-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Име</th>
            <th>Телефон</th>
            <th>Имейл</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td>1</td>
            <td>Иван Петров</td>
            <td>0888123456</td>
            <td>ivan@example.com</td>
          </tr>

          <tr>
            <td>2</td>
            <td>Мария Георгиева</td>
            <td>0888987654</td>
            <td>maria@example.com</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
)}
      </main>
    </div>
  )
}

export default App