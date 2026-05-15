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

const routes = [
    { path: '/', name: 'Dashboard', component: Dashboard, meta: { requiresAuth: true } },
    { path: '/state', name: 'State', component: StateDashboard },
    { path: '/marketplace', name: 'Marketplace', component: Marketplace },
    { path: '/stocks', name: 'Stocks', component: StockMarket },
    { path: '/shura', name: 'Shura', component: ShuraDashboard },
    { path: '/members', name: 'Members', component: MemberDirectory, meta: { requiresAuth: true } },
    { path: '/profile/:username', name: 'Profile', component: ProfileView, meta: { requiresAuth: true } },
    { path: '/send-gold', name: 'SendGold', component: SendGoldView, meta: { requiresAuth: true } },
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
            if (payload.role !== to.meta.requiresRole) return '/'
        } catch {
            return '/login'
        }
    }
    return true
})

export default router
