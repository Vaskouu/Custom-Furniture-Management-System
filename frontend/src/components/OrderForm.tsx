import { useState, type FormEvent } from 'react'

export type OrderData = {
  customer_id: number
  furniture_type: string
  description: string | null
  status: string
}

type CustomerOption = {
  id: number
  name: string
}

type OrderFormProps = {
  customers: CustomerOption[]
  initialData?: OrderData
  onSave: (data: OrderData) => Promise<void>
  onCancel: () => void
}

function OrderForm({
  customers,
  initialData,
  onSave,
  onCancel,
}: OrderFormProps) {
  const [customerId, setCustomerId] = useState(
    initialData?.customer_id ?? customers[0]?.id ?? 0
  )
  const [furnitureType, setFurnitureType] = useState(
    initialData?.furniture_type ?? ''
  )
  const [description, setDescription] = useState(
    initialData?.description ?? ''
  )
  const [status, setStatus] = useState(initialData?.status ?? 'Нова')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSaving(true)

    try {
      await onSave({
        customer_id: customerId,
        furniture_type: furnitureType.trim(),
        description: description.trim() || null,
        status,
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
      <h3>
        {initialData ? 'Редактиране на поръчка' : 'Добавяне на поръчка'}
      </h3>

      <label htmlFor="order-customer">Клиент</label>
      <select
        id="order-customer"
        value={customerId}
        onChange={(event) => setCustomerId(Number(event.target.value))}
        required
      >
        {customers.length === 0 && (
          <option value={0}>Няма налични клиенти</option>
        )}
        {customers.map((customer) => (
          <option key={customer.id} value={customer.id}>
            {customer.name}
          </option>
        ))}
      </select>

      <label htmlFor="order-furniture">Вид мебели</label>
      <input
        id="order-furniture"
        type="text"
        value={furnitureType}
        onChange={(event) => setFurnitureType(event.target.value)}
        minLength={2}
        maxLength={100}
        required
      />

      <label htmlFor="order-description">Описание</label>
      <textarea
        id="order-description"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        rows={4}
      />

      {initialData && (
        <>
          <label htmlFor="order-status">Статус</label>
          <select
            id="order-status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="Нова">Нова</option>
            <option value="В процес">В процес</option>
            <option value="Завършена">Завършена</option>
            <option value="Отказана">Отказана</option>
          </select>
        </>
      )}

      {error && <p className="form-error" role="alert">{error}</p>}

      <div className="form-actions">
        <button type="button" onClick={onCancel} disabled={saving}>
          Отказ
        </button>
        <button type="submit" disabled={saving || customers.length === 0}>
          {saving ? 'Запазване...' : 'Запази'}
        </button>
      </div>
    </form>
  )
}

export default OrderForm