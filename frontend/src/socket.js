import { io } from 'socket.io-client'
import { useStore } from './stores/useStore'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin
const socket = io(SOCKET_URL, { transports: ['websocket'] })

socket.on('connect', () => {
    console.log('socket connected', socket.id)
    const token = localStorage.getItem('token')
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]))
            if (payload.userId) socket.emit('identify', payload.userId)
        } catch {}
    }
})

socket.on('state_reserves_updated', (payload) => {
    const store = useStore()
    store.setBaitulMal({
        goldReserve: payload.goldReserve?.toString?.() ?? String(payload.goldReserve),
        oilReserve: payload.oilReserve,
        gasReserve: payload.gasReserve,
        totalZakatCollected: payload.totalZakatCollected?.toString?.() ?? String(payload.totalZakatCollected)
    })
})

socket.on('transaction_created', (payload) => {
    const store = useStore()
    store.addTransaction({
        id: payload.id ?? Date.now(),
        type: payload.type,
        amount: String(payload.amount),
        senderId: payload.senderId,
        receiverId: payload.receiverId,
        timestamp: payload.timestamp ?? new Date().toISOString(),
    })
})

socket.on('new_trade_occurred', (payload) => {
    const store = useStore()
    store.addTransaction({
        id: Date.now(),
        type: 'TRADE',
        amount: payload.totalPrice,
        senderId: payload.buyerId,
        receiverId: payload.sellerId,
        timestamp: new Date().toISOString()
    })
})

socket.on('zakat_deducted', (payload) => {
    const store = useStore()
    if (payload.newBalance) store.setUser({ goldBalance: payload.newBalance })
    store.addTransaction({ id: Date.now(), type: 'ZAKAT', amount: payload.deducted, timestamp: new Date().toISOString() })
    store.setZakatToast({ deducted: payload.deducted, newBalance: payload.newBalance })
})

socket.on('reputation_changed', (payload) => {
    const store = useStore()
    if (payload.newScore !== undefined) store.setUser({ reputationScore: payload.newScore })
})

socket.on('price_changed', (payload) => {
    const store = useStore()
    // payload: { resource, oldPrice, newPrice, event }
    const updated = { ...store.prices }
    updated[payload.resource] = { resource: payload.resource, priceInGoldMg: payload.newPrice, updatedAt: new Date().toISOString(), event: payload.event }
    store.prices = updated
})

socket.on('market:new-listing', () => {
    // Trigger a product list reload — component can watch store.marketRefreshKey
    const store = useStore()
    store.marketRefreshKey = (store.marketRefreshKey ?? 0) + 1
})

socket.on('shares_changed', (payload) => {
    const store = useStore()
    // Trigger stock list refresh
    store.stockRefreshKey = (store.stockRefreshKey ?? 0) + 1
    store.addTransaction({
        id: Date.now(),
        type: 'TRADE',
        amount: String(payload.totalCost ?? '0'),
        senderId: payload.buyerId,
        timestamp: new Date().toISOString(),
    })
})

socket.on('dividends_distributed', (payload) => {
    const store = useStore()
    store.stockRefreshKey = (store.stockRefreshKey ?? 0) + 1
    // update balance if dividend received
    if (payload.receivedAmount && store.user.id) {
        try {
            const current = BigInt(store.user.goldBalance || '0')
            const received = BigInt(payload.receivedAmount)
            store.setUser({ goldBalance: (current + received).toString() })
        } catch {}
    }
})

export default socket
