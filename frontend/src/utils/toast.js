import '../lib/iziToast.min.js'

const iziToast = window.iziToast

export function showSuccessToast(message) {
    iziToast.success({
        title: 'Success',
        message,
        position: 'topRight',
        timeout: 3000,
        pauseOnHover: true,
    })
}

export function showErrorToast(message) {
    iziToast.error({
        title: 'Error',
        message,
        position: 'topRight',
        timeout: 5000,
        pauseOnHover: true,
    })
}

export function showInfoToast(message) {
    iziToast.info({
        title: 'Info',
        message,
        position: 'topRight',
        timeout: 4000,
        pauseOnHover: true,
    })
}
