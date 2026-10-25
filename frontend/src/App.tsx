import { useEffect, useState } from 'react'
import Login, { type User } from './components/Login'
import CustomerForm, { type CustomerData } from './components/CustomerForm'
import OrderForm, { type OrderData } from './components/OrderForm'
import './App.css'

type Page = 'dashboard' | 'customers' | 'orders'

type Customer = CustomerData & { id: number }

type Order = {
  id: number
  customer: string
  furniture_type: string
  description: string | null
  status: string
  customer_id?: number
}

const API_URL = 'http://127.0.0.1:8000'

function App() {
  const [activePage, setActivePage] = useState<Page>('dashboard')
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)

  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [customerActionError, setCustomerActionError] = useState('')
  const [showCustomerForm, setShowCustomerForm] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [deletingCustomerId, setDeletingCustomerId] = useState<number | null>(null)

  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState('')
  const [orderActionError, setOrderActionError] = useState('')
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [editingOrder, setEditingOrder] = useState<OrderData | null>(null)
  const [editingOrderId, setEditingOrderId] = useState<number | null>(null)
  const [loadingOrderId, setLoadingOrderId] = useState<number | null>(null)
  const [deletingOrderId, setDeletingOrderId] = useState<number | null>(null)

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
    setCustomerActionError('')
    setShowCustomerForm(false)
    setEditingCustomer(null)
    setDeletingCustomerId(null)
    setOrderActionError('')
    setShowOrderForm(false)
    setEditingOrder(null)
    setEditingOrderId(null)
    setLoadingOrderId(null)
    setDeletingOrderId(null)
    setActivePage('dashboard')
  }

  async function fetchCustomers(accessToken: string, signal?: AbortSignal) {
    const response = await fetch(`${API_URL}/customers`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal,
    })

    if (!response.ok) {
      throw new Error(
        response.status === 401 || response.status === 403
          ? 'Нямате достъп до клиентите. Влезте отново или проверете ролята си.'
          : 'Неуспешно зареждане на клиентите.'
      )
    }

    return (await response.json()) as Customer[]
  }

  useEffect(() => {
    if (!token || !isStaff) return

    const controller = new AbortController()

    async function loadCustomers() {
      setLoading(true)
      setError('')

      try {
        const data = await fetchCustomers(token!, controller.signal)
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

  async function fetchOrders(accessToken: string, signal?: AbortSignal) {
    const response = await fetch(`${API_URL}/orders`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal,
    })
    if (!response.ok) {
      throw new Error(
        response.status === 401 || response.status === 403
          ? 'Нямате достъп до поръчките. Влезте отново или проверете ролята си.'
          : 'Неуспешно зареждане на поръчките.'
      )
    }
    return (await response.json()) as Order[]
  }

  useEffect(() => {
    if (!token || !isStaff) return
    const controller = new AbortController()
    async function loadOrders() {
      setOrdersLoading(true)
      setOrdersError('')
      try {
        const data = await fetchOrders(token!, controller.signal)
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

  function openAddCustomer() {
    setEditingCustomer(null)
    setCustomerActionError('')
    setShowCustomerForm(true)
  }

  function openEditCustomer(customer: Customer) {
    setEditingCustomer(customer)
    setCustomerActionError('')
    setShowCustomerForm(true)
  }

  function closeCustomerForm() {
    setShowCustomerForm(false)
    setEditingCustomer(null)
  }

  async function saveCustomer(data: CustomerData) {
    if (!token || !isStaff) throw new Error('Необходим е служебен достъп.')

    const editingId = editingCustomer?.id
    const response = await fetch(
      editingId === undefined
        ? `${API_URL}/customers`
        : `${API_URL}/customers/${editingId}`,
      {
        method: editingId === undefined ? 'POST' : 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    )

    if (!response.ok) {
      throw new Error(
        response.status === 401 || response.status === 403
          ? 'Нямате право да променяте клиенти. Влезте отново.'
          : response.status === 422
            ? 'Проверете въведените данни за клиента.'
            : 'Неуспешно запазване на клиента.'
      )
    }

    const savedCustomer = (await response.json()) as Customer
    setCustomers((previous) =>
      editingId === undefined
        ? [...previous, savedCustomer]
        : previous.map((customer) =>
            customer.id === editingId ? savedCustomer : customer
          )
    )
    setError('')
    setCustomerActionError('')
    closeCustomerForm()
  }

  async function deleteCustomer(customer: Customer) {
    if (!token || !isStaff || deletingCustomerId !== null) return
    if (!window.confirm(`Сигурни ли сте, че искате да изтриете ${customer.name}?`)) return

    setDeletingCustomerId(customer.id)
    setCustomerActionError('')

    try {
      const response = await fetch(`${API_URL}/customers/${customer.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error(
          response.status === 401 || response.status === 403
            ? 'Нямате право да изтривате клиенти. Влезте отново.'
            : response.status === 409 || response.status === 400
              ? 'Клиентът не може да бъде изтрит, вероятно има свързани поръчки.'
              : 'Неуспешно изтриване. Възможно е клиентът да има свързани поръчки.'
        )
      }

      setCustomers((previous) => previous.filter((item) => item.id !== customer.id))
    } catch (err) {
      setCustomerActionError(
        err instanceof Error ? err.message : 'Неуспешна връзка с FastAPI.'
      )
    } finally {
      setDeletingCustomerId(null)
    }
  }

  function openAddOrder() {
    setEditingOrder(null)
    setEditingOrderId(null)
    setOrderActionError('')
    setShowOrderForm(true)
  }

  async function openEditOrder(order: Order) {
    if (!token || loadingOrderId !== null) return
    setLoadingOrderId(order.id)
    setOrderActionError('')
    try {
      const response = await fetch(`${API_URL}/orders/${order.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error('Неуспешно зареждане на поръчката за редактиране.')
      const detail = (await response.json()) as Order
      // The order detail must identify the customer by ID, not just by name.
      if (typeof detail.customer_id !== 'number' || detail.customer_id <= 0) {
        throw new Error('API не върна customer_id. Трябва да проверим GET /orders/{order_id}.')
      }
      if (!customers.some((customer) => customer.id === detail.customer_id)) {
        throw new Error('Клиентът на тази поръчка липсва в списъка с клиенти.')
      }
      setEditingOrder({
        customer_id: detail.customer_id,
        furniture_type: detail.furniture_type,
        description: detail.description,
        status: detail.status,
      })
      setEditingOrderId(order.id)
      setShowOrderForm(true)
    } catch (err) {
      setOrderActionError(err instanceof Error ? err.message : 'Грешка при зареждане.')
    } finally {
      setLoadingOrderId(null)
    }
  }

  function closeOrderForm() {
    setShowOrderForm(false)
    setEditingOrder(null)
    setEditingOrderId(null)
  }

  async function saveOrder(data: OrderData) {
    if (!token || !isStaff) throw new Error('Необходим е служебен достъп.')
    const response = await fetch(
      editingOrderId === null ? `${API_URL}/orders` : `${API_URL}/orders/${editingOrderId}`,
      {
        method: editingOrderId === null ? 'POST' : 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingOrderId === null
          ? {
              customer_id: data.customer_id,
              furniture_type: data.furniture_type,
              description: data.description,
            }
          : data),
      }
    )
    if (!response.ok) {
      throw new Error(
        response.status === 401 || response.status === 403
          ? 'Нямате право да променяте поръчки. Влезте отново.'
          : response.status === 422
            ? 'Проверете данните на поръчката.'
            : 'Неуспешно запазване на поръчката.'
      )
    }
    // Refresh the joined customer name and status from the canonical API list.
    try {
      setOrders(await fetchOrders(token))
      setOrdersError('')
    } catch {
      setOrdersError('Поръчката е запазена, но списъкът не се обнови. Презаредете страницата.')
    }
    setOrderActionError('')
    closeOrderForm()
  }

  async function deleteOrder(order: Order) {
    if (!token || !isStaff || deletingOrderId !== null) return
    if (!window.confirm(`Сигурни ли сте, че искате да изтриете поръчка №${order.id}?`)) return
    setDeletingOrderId(order.id)
    setOrderActionError('')
    try {
      const response = await fetch(`${API_URL}/orders/${order.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) {
        throw new Error(
          response.status === 401 || response.status === 403
            ? 'Нямате право да изтривате поръчки.'
            : 'Неуспешно изтриване. Възможно е поръчката да има свързани материали.'
        )
      }
      setOrders((previous) => previous.filter((item) => item.id !== order.id))
    } catch (err) {
      setOrderActionError(err instanceof Error ? err.message : 'Грешка при изтриване.')
    } finally {
      setDeletingOrderId(null)
    }
  }

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

            <div style={{ marginBottom: '16px' }}>
              <button type="button" onClick={openAddCustomer} disabled={showCustomerForm}>
                + Добави клиент
              </button>
            </div>

            {showCustomerForm && (
              <div style={{ marginBottom: '24px' }}>
                <CustomerForm
                  key={editingCustomer?.id ?? 'new'}
                  initialData={editingCustomer ?? undefined}
                  onSave={saveCustomer}
                  onCancel={closeCustomerForm}
                />
              </div>
            )}

            {customerActionError && (
              <p role="alert" style={{ color: '#b42318' }}>{customerActionError}</p>
            )}

            <div className="table-container">
              <table className="customers-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Име</th>
                    <th>Телефон</th>
                    <th>Имейл</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5}>Зареждане на клиентите...</td></tr>
                  ) : error ? (
                    <tr><td colSpan={5}>{error}</td></tr>
                  ) : customers.length === 0 ? (
                    <tr><td colSpan={5}>Няма добавени клиенти.</td></tr>
                  ) : (
                    customers.map((customer) => (
                      <tr key={customer.id}>
                        <td>{customer.id}</td>
                        <td>{customer.name}</td>
                        <td>{customer.phone}</td>
                        <td>{customer.email}</td>
                        <td>
                          <button
                            type="button"
                            onClick={() => openEditCustomer(customer)}
                            disabled={deletingCustomerId !== null}
                            style={{ marginRight: '8px' }}
                          >
                            Редактирай
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteCustomer(customer)}
                            disabled={deletingCustomerId !== null}
                          >
                            {deletingCustomerId === customer.id ? 'Изтриване...' : 'Изтрий'}
                          </button>
                        </td>
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

            <div style={{ marginBottom: '16px' }}>
              <button type="button" onClick={openAddOrder} disabled={showOrderForm || loading}>
                + Добави поръчка
              </button>
            </div>

            {showOrderForm && (
              <div style={{ marginBottom: '24px' }}>
                <OrderForm
                  key={editingOrderId ?? 'new'}
                  customers={customers}
                  initialData={editingOrder ?? undefined}
                  onSave={saveOrder}
                  onCancel={closeOrderForm}
                />
              </div>
            )}

            {orderActionError && (
              <p role="alert" style={{ color: '#b42318' }}>{orderActionError}</p>
            )}

            <div className="table-container">
              <table className="customers-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Клиент</th>
                    <th>Вид мебели</th>
                    <th>Описание</th>
                    <th>Статус</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {ordersLoading ? (
                    <tr><td colSpan={6}>Зареждане на поръчките...</td></tr>
                  ) : ordersError ? (
                    <tr><td colSpan={6}>{ordersError}</td></tr>
                  ) : orders.length === 0 ? (
                    <tr><td colSpan={6}>Няма добавени поръчки.</td></tr>
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
                        <td>
                          <button
                            type="button"
                            onClick={() => void openEditOrder(order)}
                            disabled={loadingOrderId !== null || deletingOrderId !== null}
                            style={{ marginRight: '8px' }}
                          >
                            {loadingOrderId === order.id ? 'Зареждане...' : 'Редактирай'}
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteOrder(order)}
                            disabled={loadingOrderId !== null || deletingOrderId !== null}
                          >
                            {deletingOrderId === order.id ? 'Изтриване...' : 'Изтрий'}
                          </button>
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
