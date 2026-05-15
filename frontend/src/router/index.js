import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import Marketplace from '../views/Marketplace.vue'
import ShuraDashboard from '../views/ShuraDashboard.vue'
import StateDashboard from '../views/StateDashboard.vue'
import AdminView from '../views/AdminView.vue'
import LoginView from '../views/LoginView.vue'
import StockMarket from '../views/StockMarket.vue'
import MemberDirectory from '../views/MemberDirectory.vue'
import ProfileView from '../views/ProfileView.vue'
import SendGoldView from '../views/SendGoldView.vue'
import TransactionsView from '../views/TransactionsView.vue'
import MyListingsView from '../views/MyListingsView.vue'

const routes = [
    { path: '/', name: 'Dashboard', component: Dashboard, meta: { requiresAuth: true } },
    { path: '/state', name: 'State', component: StateDashboard },
    { path: '/marketplace', name: 'Marketplace', component: Marketplace },
    { path: '/stocks', name: 'Stocks', component: StockMarket },
    { path: '/shura', name: 'Shura', component: ShuraDashboard, meta: { requiresAuth: true, requiresRole: ['SHURA', 'KHALIFA', 'MUHTASIB'] } },
    { path: '/members', name: 'Members', component: MemberDirectory },
    { path: '/profile/:username', name: 'Profile', component: ProfileView },
    { path: '/send-gold', name: 'SendGold', component: SendGoldView, meta: { requiresAuth: true } },
    { path: '/transactions', name: 'Transactions', component: TransactionsView, meta: { requiresAuth: true } },
    { path: '/my-listings', name: 'MyListings', component: MyListingsView, meta: { requiresAuth: true } },
    { path: '/admin', name: 'Admin', component: AdminView, meta: { requiresAuth: true, requiresRole: 'KHALIFA' } },
    { path: '/login', name: 'Login', component: LoginView }
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

router.beforeEach((to, _from) => {
    const token = localStorage.getItem('token')
    if (to.meta.requiresAuth && !token) return '/login'
    if (to.meta.requiresRole) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]))
            const required = to.meta.requiresRole
            if (Array.isArray(required)) {
                if (!required.includes(payload.role)) return '/'
            } else {
                if (payload.role !== required) return '/'
            }
        } catch {
            return '/login'
        }
    }
    return true
})

export default router
