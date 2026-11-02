import { useState, type FormEvent } from 'react'

export type OrderMaterialData = {
  order_id: number
  material_id: number
  quantity: number
}

type MaterialOption = {
  id: number
  name: string
  unit: string
}

type OrderMaterialFormProps = {
  orderId: number
  materials: MaterialOption[]
  initialData?: OrderMaterialData
  onSave: (data: OrderMaterialData) => Promise<void>
  onCancel: () => void
}

function OrderMaterialForm({
  orderId,
  materials,
  initialData,
  onSave,
  onCancel,
}: OrderMaterialFormProps) {
  const [materialId, setMaterialId] = useState(
    String(initialData?.material_id ?? materials[0]?.id ?? '')
  )
  const [quantity, setQuantity] = useState(
    String(initialData?.quantity ?? 1)
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const selectedMaterialId = Number(materialId)
    const selectedQuantity = Number(quantity)

    if (
      !Number.isInteger(selectedMaterialId) ||
      selectedMaterialId <= 0 ||
      !Number.isFinite(selectedQuantity) ||
      selectedQuantity <= 0
    ) {
      setError('Изберете материал и въведете количество над 0.')
      return
    }

    setSaving(true)
    setError('')

    try {
      await onSave({
        order_id: orderId,
        material_id: selectedMaterialId,
        quantity: selectedQuantity,
      })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Неуспешно запазване на материала.'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)}>
      <h3>
        {initialData ? 'Редактиране на материал' : 'Добавяне на материал'}
        {' '}към поръчка №{orderId}
      </h3>

      <div>
        <label htmlFor="order-material-select">Материал</label>
        <select
          id="order-material-select"
          value={materialId}
          onChange={(event) => setMaterialId(event.target.value)}
          required
          disabled={saving}
        >
          {materials.length === 0 && (
            <option value="">Няма налични материали</option>
          )}
          {materials.map((material) => (
            <option key={material.id} value={material.id}>
              {material.name} ({material.unit})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="order-material-quantity">Количество</label>
        <input
          id="order-material-quantity"
          type="number"
          min="0.01"
          step="any"
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          required
          disabled={saving}
        />
      </div>

      {error && <p role="alert" style={{ color: '#b42318' }}>{error}</p>}

      <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
        <button type="submit" disabled={saving || materials.length === 0}>
          {saving ? 'Запазване...' : 'Запази'}
        </button>
        <button type="button" onClick={onCancel} disabled={saving}>
          Отказ
        </button>
      </div>
    </form>
  )
}

export default OrderMaterialForm