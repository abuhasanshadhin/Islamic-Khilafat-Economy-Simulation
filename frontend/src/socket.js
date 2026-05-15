import { io } from 'socket.io-client'
import { useStore } from './stores/useStore'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin
const socket = io(SOCKET_URL, { transports: ['websocket'] })

socket.on('connect', () => {
    console.log('socket connected', socket.id)
    // if the client knows user id, it should emit identify after login
})

socket.on('state_reserves_updated', (payload) => {
    const store = useStore()
    // payload expected: { goldReserve: string, oilReserve: number, gasReserve: number, totalZakatCollected: string }
    store.setBaitulMal({
        goldReserve: payload.goldReserve?.toString?.() ?? String(payload.goldReserve),
        oilReserve: payload.oilReserve,
        gasReserve: payload.gasReserve,
        totalZakatCollected: payload.totalZakatCollected?.toString?.() ?? String(payload.totalZakatCollected)
    })
})

socket.on('new_trade_occurred', (payload) => {
    const store = useStore()
    store.addTransaction({
        id: Date.now(),
        type: 'TRADE',
        productId: payload.productId,
        amount: payload.totalPrice,
        buyerId: payload.buyerId,
        sellerId: payload.sellerId,
        timestamp: new Date().toISOString()
    })
})

socket.on('zakat_deducted', (payload) => {
    const store = useStore()
    // notify user; also update balance if provided
    if (payload.newBalance) store.setUser({ goldBalance: payload.newBalance })
    store.addTransaction({ id: Date.now(), type: 'ZAKAT', amount: payload.deducted, timestamp: new Date().toISOString() })
})

socket.on('reputation_changed', (payload) => {
    const store = useStore()
    if (payload.newScore !== undefined) store.setUser({ reputationScore: payload.newScore })
})

export default socket
