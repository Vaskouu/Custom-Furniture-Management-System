import './App.css'

function App() {
  return (
    <div className="app">
      <aside className="sidebar">
        <h1>FurniPro</h1>
        <p>Управление на мебелно студио</p>

        <nav>
          <a href="#dashboard">Табло</a>
          <a href="#customers">Клиенти</a>
          <a href="#orders">Поръчки</a>
        </nav>
      </aside>

      <main className="content">
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
      </main>
    </div>
  )
}

export default App