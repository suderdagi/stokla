import { describe, expect, it } from 'vitest'
import { movementSchema, productSchema, registerSchema } from '@/lib/validation'
import { hashToken } from '@/lib/tokens'

describe('productSchema', () => {
  const valid = { name: 'Hoodie', sku: 'hd-grey-m', unit: 'PIECE', costPrice: '280', salePrice: '599.999', minQuantity: '8' }

  it('parses form strings into clean values', () => {
    expect(productSchema.parse(valid)).toMatchObject({ sku: 'HD-GREY-M', costPrice: 280, salePrice: 600, minQuantity: 8 })
  })

  it('rejects a sale price below the cost price', () => {
    const result = productSchema.safeParse({ ...valid, salePrice: '100' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toEqual(['salePrice'])
  })
})

describe('movementSchema', () => {
  it('requires at least 1 unit for IN and OUT but allows 0 for a stock count', () => {
    expect(movementSchema.safeParse({ productId: 'p', type: 'OUT', quantity: '0' }).success).toBe(false)
    expect(movementSchema.safeParse({ productId: 'p', type: 'ADJUSTMENT', quantity: '0' }).success).toBe(true)
  })
})

describe('registerSchema', () => {
  it('normalizes emails', () => {
    const data = registerSchema.parse({ organizationName: 'Moda', name: 'Sude', email: ' Sude@Mail.COM ', password: '12345678' })
    expect(data.email).toBe('sude@mail.com')
  })
})

describe('hashToken', () => {
  it('is deterministic and does not contain the token', () => {
    expect(hashToken('abc')).toBe(hashToken('abc'))
    expect(hashToken('abc')).not.toContain('abc')
    expect(hashToken('abc')).toHaveLength(64)
  })
})
