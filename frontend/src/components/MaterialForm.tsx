import { useState, type FormEvent } from 'react'

export type MaterialData = {
  name: string
  unit: string
  price_per_unit: number
}

type Props = {
  initialData?: MaterialData
  onSave: (data: MaterialData) => Promise<void>
  onCancel: () => void
}

export default function MaterialForm({ initialData, onSave, onCancel }: Props) {
  const [name, setName] = useState(initialData?.name ?? '')
  const [unit, setUnit] = useState(initialData?.unit ?? '')
  const [price, setPrice] = useState(String(initialData?.price_per_unit ?? ''))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const amount = Number(price)
    if (!name.trim() || name.trim().length > 100 || !unit.trim() || unit.trim().length > 20 || !price.trim() || !Number.isFinite(amount) || amount < 0) {
      setError('Попълнете име (до 100 знака), мерна единица (до 20 знака) и валидна неотрицателна цена.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave({ name: name.trim(), unit: unit.trim(), price_per_unit: amount })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неуспешно запазване на материала.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="customer-form" onSubmit={(event) => void submit(event)}>
      <h3>{initialData ? 'Редактиране на материал' : 'Добавяне на материал'}</h3>
      <label htmlFor="material-name">Име</label>
      <input id="material-name" value={name} maxLength={100} onChange={(event) => setName(event.target.value)} required />
      <label htmlFor="material-unit">Мерна единица</label>
      <input id="material-unit" value={unit} maxLength={20} onChange={(event) => setUnit(event.target.value)} placeholder="кв.м., бр., м" required />
      <label htmlFor="material-price">Цена за единица (€)</label>
      <input id="material-price" type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} required />
      {error && <p role="alert" style={{ color: '#b42318' }}>{error}</p>}
      <div className="form-actions">
        <button type="button" onClick={onCancel} disabled={saving}>Отказ</button>
        <button type="submit" disabled={saving}>{saving ? 'Запазване...' : 'Запази'}</button>
      </div>
    </form>
  )
}
