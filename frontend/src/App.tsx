import { useEffect, useState } from 'react'
import './App.css'

type Page = 'dashboard' | 'customers' | 'orders'

type Customer = {
  id: number
  name: string
  phone: string
  email: string
}

function App() {
  const [activePage, setActivePage] = useState<Page>('dashboard')

const [customers, setCustomers] = useState<Customer[]>([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState('')

useEffect(() => {
  async function loadCustomers() {
    try {
      const response = await fetch('http://127.0.0.1:8000/customers')

      if (!response.ok) {
        throw new Error('Неуспешно зареждане на клиентите.')
      }

      const data: Customer[] = await response.json()
      setCustomers(data)
    } catch {
      setError('Неуспешна връзка с FastAPI.')
    } finally {
      setLoading(false)
    }
  }

  loadCustomers()
}, [])
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
  {loading ? (
    <tr>
      <td colSpan={4}>Зареждане на клиентите...</td>
    </tr>
  ) : error ? (
    <tr>
      <td colSpan={4}>{error}</td>
    </tr>
  ) : customers.length === 0 ? (
    <tr>
      <td colSpan={4}>Няма добавени клиенти.</td>
    </tr>
  ) : (
    customers.map((customer) => (
      <tr key={customer.id}>
        <td>{customer.id}</td>
        <td>{customer.name}</td>
        <td>{customer.phone}</td>
        <td>{customer.email}</td>
      </tr>
    ))
  )}
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