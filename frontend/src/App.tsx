import { useEffect, useState } from 'react'
import './App.css'

type Page = 'dashboard' | 'customers' | 'orders'

type Customer = {
  id: number
  name: string
  phone: string
  email: string
}

type Order = {
  id: number
  customer: string
  furniture_type: string
  description: string | null
  status: string
}

function App() {
  const [activePage, setActivePage] = useState<Page>('dashboard')

  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [ordersError, setOrdersError] = useState('')

  // Зареждане на клиентите от FastAPI
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

  // Зареждане на поръчките от FastAPI
  useEffect(() => {
    async function loadOrders() {
      try {
        const response = await fetch('http://127.0.0.1:8000/orders')

        if (!response.ok) {
          throw new Error('Неуспешно зареждане на поръчките.')
        }

        const data: Order[] = await response.json()
        setOrders(data)
      } catch {
        setOrdersError('Неуспешна връзка с FastAPI.')
      } finally {
        setOrdersLoading(false)
      }
    }

    loadOrders()
  }, [])

  return (
    <div className="app">
      {/* Странично меню */}
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

      {/* Основно съдържание */}
      <main className="content">

        {/* ТАБЛО */}
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

        {/* КЛИЕНТИ */}
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

        {/* ПОРЪЧКИ */}
        {activePage === 'orders' && (
          <section className="orders-page">
            <header>
              <h2>Поръчки</h2>
              <p>Списък с поръчките на мебелното студио.</p>
            </header>

            <div className="table-container">
              <table className="customers-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Клиент</th>
                    <th>Вид мебели</th>
                    <th>Описание</th>
                    <th>Статус</th>
                  </tr>
                </thead>

                <tbody>
                  {ordersLoading ? (
                    <tr>
                      <td colSpan={5}>Зареждане на поръчките...</td>
                    </tr>
                  ) : ordersError ? (
                    <tr>
                      <td colSpan={5}>{ordersError}</td>
                    </tr>
                  ) : orders.length === 0 ? (
                    <tr>
                      <td colSpan={5}>Няма добавени поръчки.</td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr key={order.id}>
                        <td>{order.id}</td>
                        <td>{order.customer}</td>
                        <td>{order.furniture_type}</td>
                        <td>{order.description || 'Няма описание'}</td>
                        <td>
                          <span
                            className={
                              order.status === 'Нова'
                                ? 'status-badge status-new'
                                : order.status === 'В процес'
                                  ? 'status-badge status-progress'
                                  : 'status-badge'
                            }
                          >
                            {order.status}
                          </span>
                        </td>
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