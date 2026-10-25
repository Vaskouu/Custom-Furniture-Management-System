import { useState, type FormEvent } from 'react'

type User = {
  id: number
  username: string
  role: 'admin' | 'designer' | 'client'
}

type LoginResponse = {
  access_token: string
  token_type: string
  user: User
}

type LoginProps = {
  onLogin: (token: string, user: User) => void
}

function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('http://127.0.0.1:8000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Невалидно потребителско име или парола.')
        }

        throw new Error('Възникна грешка при вход.')
      }

      const data: LoginResponse = await response.json()
      onLogin(data.access_token, data.user)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Неуспешна връзка със сървъра.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={handleSubmit}>
        <h1>FurniPro</h1>
        <p>Вход в системата за управление на мебелно студио</p>

        <label htmlFor="username">Потребителско име</label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          required
          autoComplete="username"
        />

        <label htmlFor="password">Парола</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          autoComplete="current-password"
        />

        {error && <p className="login-error" role="alert">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Влизане...' : 'Вход'}
        </button>
      </form>
    </div>
  )
}

export default Login
export type { User }