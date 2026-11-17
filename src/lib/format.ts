const currency = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' })
const number = new Intl.NumberFormat('tr-TR')
const dateTime = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

export const formatMoney = (value: number | { toString(): string }) => currency.format(Number(value))
export const formatNumber = (value: number) => number.format(value)
export const formatDateTime = (date: Date) => dateTime.format(date)
