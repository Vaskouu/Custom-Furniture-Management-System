import { useState, type FormEvent } from 'react'

export type CustomerData = {
  name: string
  phone: string
  email: string
}

type CustomerFormProps = {
  initialData?: CustomerData
  onSave: (data: CustomerData) => Promise<void>
  onCancel: () => void
}

function CustomerForm({
  initialData,
  onSave,
  onCancel,
}: CustomerFormProps) {
  const [name, setName] = useState(initialData?.name ?? '')
  const [phone, setPhone] = useState(initialData?.phone ?? '')
  const [email, setEmail] = useState(initialData?.email ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSaving(true)

    try {
      await onSave({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
      })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Възникна грешка при запазването.'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="customer-form" onSubmit={handleSubmit}>
      <h3>{initialData ? 'Редактиране на клиент' : 'Добавяне на клиент'}</h3>

      <label htmlFor="customer-name">Име</label>
      <input
        id="customer-name"
        type="text"
        value={name}
        onChange={(event) => setName(event.target.value)}
        minLength={2}
        maxLength={100}
        required
      />

      <label htmlFor="customer-phone">Телефон</label>
      <input
        id="customer-phone"
        type="tel"
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
        minLength={7}
        maxLength={20}
        required
      />

      <label htmlFor="customer-email">Имейл</label>
      <input
        id="customer-email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        minLength={5}
        maxLength={initialData ? 100 : 255}
        required
      />

      {error && <p className="form-error" role="alert">{error}</p>}

      <div className="form-actions">
        <button type="button" onClick={onCancel} disabled={saving}>
          Отказ
        </button>
        <button type="submit" disabled={saving}>
          {saving ? 'Запазване...' : 'Запази'}
        </button>
      </div>
    </form>
  )
}

export default CustomerForm