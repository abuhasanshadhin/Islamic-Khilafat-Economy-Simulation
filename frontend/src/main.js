import { createApp } from 'vue'
import { createPinia } from 'pinia'
import axios from 'axios'
import App from './App.vue'
import './styles.css'
import './lib/iziToast.min.css'
import './socket'
import router from './router'
import { showErrorToast, showSuccessToast } from './utils/toast'

axios.interceptors.response.use(
    (response) => {
        const message = response?.data?.message || response?.data?.info || response?.data?.successMessage
        if (message) showSuccessToast(message)
        return response
    },
    (error) => {
        const rawError = error?.response?.data?.error
        const isValidationError = Array.isArray(rawError)
        const message =
            !isValidationError &&
            (rawError ||
                error?.response?.data?.message ||
                error?.message ||
                'Server error')

        if (message) showErrorToast(message)
        return Promise.reject(error)
    },
)

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.mount('#app')
