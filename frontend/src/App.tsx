import { useEffect, useState } from 'react'
import Login, { type User } from './components/Login'
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

const API_URL = 'http://127.0.0.1:8000'

function App() {
  const [activePage, setActivePage] = useState<Page>('dashboard')
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)

  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState('')

  const isStaff = user?.role === 'admin' || user?.role === 'designer'

  function handleLogin(accessToken: string, loggedInUser: User) {
    setToken(accessToken)
    setUser(loggedInUser)
    setActivePage('dashboard')
  }

  function handleLogout() {
    setToken(null)
    setUser(null)
    setCustomers([])
    setOrders([])
    setError('')
    setOrdersError('')
    setActivePage('dashboard')
  }

  useEffect(() => {
    if (!token || !isStaff) return

    const controller = new AbortController()

    async function loadCustomers() {
      setLoading(true)
      setError('')

      try {
        const response = await fetch(`${API_URL}/customers`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(
            response.status === 401 || response.status === 403
              ? 'Нямате достъп до клиентите. Влезте отново или проверете ролята си.'
              : 'Неуспешно зареждане на клиентите.'
          )
        }

        const data: Customer[] = await response.json()
        if (!controller.signal.aborted) setCustomers(data)
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Неуспешна връзка с FastAPI.')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    void loadCustomers()
    return () => controller.abort()
  }, [token, isStaff])

  useEffect(() => {
    if (!token || !isStaff) return

    const controller = new AbortController()

    async function loadOrders() {
      setOrdersLoading(true)
      setOrdersError('')

      try {
        const response = await fetch(`${API_URL}/orders`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(
            response.status === 401 || response.status === 403
              ? 'Нямате достъп до поръчките. Влезте отново или проверете ролята си.'
              : 'Неуспешно зареждане на поръчките.'
          )
        }

        const data: Order[] = await response.json()
        if (!controller.signal.aborted) setOrders(data)
      } catch (err) {
        if (!controller.signal.aborted) {
          setOrdersError(err instanceof Error ? err.message : 'Неуспешна връзка с FastAPI.')
        }
      } finally {
        if (!controller.signal.aborted) setOrdersLoading(false)
      }
    }

    void loadOrders()
    return () => controller.abort()
  }, [token, isStaff])

  if (!token || !user) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div className="app">
      {/* Странично меню */}
      <aside className="sidebar">
        <h1>FurniPro</h1>
        <p>Управление на мебелно студио</p>

        <nav>
          <a href="#dashboard" onClick={() => setActivePage('dashboard')}>
            Табло
          </a>

          {isStaff && (
            <>
              <a href="#customers" onClick={() => setActivePage('customers')}>
                Клиенти
              </a>
              <a href="#orders" onClick={() => setActivePage('orders')}>
                Поръчки
              </a>
            </>
          )}
        </nav>

        <div style={{ marginTop: '2rem' }}>
          <p>Потребител: <strong>{user.username}</strong></p>
          <p>Роля: <strong>{user.role}</strong></p>
          <button type="button" onClick={handleLogout}>Изход</button>
        </div>
      </aside>

      {/* Основно съдържание */}
      <main className="content">
        {/* ТАБЛО */}
        {activePage === 'dashboard' && (
          <>
            <header>
              <h2>Табло за управление</h2>
              <p>Добре дошли във FurniPro, {user.username}!</p>
            </header>

            {isStaff ? (
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
            ) : (
              <section className="cards">
                <div className="card">
                  <h3>Клиентски профил</h3>
                  <p>Влязохте успешно. Функционалностите за клиенти предстои да бъдат добавени.</p>
                </div>
              </section>
            )}
          </>
        )}

        {/* КЛИЕНТИ */}
        {isStaff && activePage === 'customers' && (
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
                    <tr><td colSpan={4}>Зареждане на клиентите...</td></tr>
                  ) : error ? (
                    <tr><td colSpan={4}>{error}</td></tr>
                  ) : customers.length === 0 ? (
                    <tr><td colSpan={4}>Няма добавени клиенти.</td></tr>
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
        {isStaff && activePage === 'orders' && (
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
                    <tr><td colSpan={5}>Зареждане на поръчките...</td></tr>
                  ) : ordersError ? (
                    <tr><td colSpan={5}>{ordersError}</td></tr>
                  ) : orders.length === 0 ? (
                    <tr><td colSpan={5}>Няма добавени поръчки.</td></tr>
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
