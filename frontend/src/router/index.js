import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../components/Dashboard.vue'
import Marketplace from '../components/Marketplace.vue'
import ShuraDashboard from '../components/ShuraDashboard.vue'
import AdminView from '../components/AdminView.vue'
import LoginView from '../components/LoginView.vue'
import StockMarket from '../components/StockMarket.vue'
import MemberDirectory from '../components/MemberDirectory.vue'
import ProfileView from '../components/ProfileView.vue'

const routes = [
    { path: '/', name: 'Dashboard', component: Dashboard, meta: { requiresAuth: true } },
    { path: '/marketplace', name: 'Marketplace', component: Marketplace },
    { path: '/stocks', name: 'Stocks', component: StockMarket },
    { path: '/shura', name: 'Shura', component: ShuraDashboard },
    { path: '/members', name: 'Members', component: MemberDirectory, meta: { requiresAuth: true } },
    { path: '/profile/:username', name: 'Profile', component: ProfileView, meta: { requiresAuth: true } },
    { path: '/admin', name: 'Admin', component: AdminView, meta: { requiresAuth: true, requiresRole: 'KHALIFA' } },
    { path: '/login', name: 'Login', component: LoginView }
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

router.beforeEach((to, _from, next) => {
    const token = localStorage.getItem('token')
    if (to.meta.requiresAuth && !token) return next('/login')
    if (to.meta.requiresRole) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]))
            if (payload.role !== to.meta.requiresRole) return next('/')
        } catch {
            return next('/login')
        }
    }
    next()
})

export default router
