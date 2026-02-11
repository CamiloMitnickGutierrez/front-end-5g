import axios from 'axios'

const apiUrl = axios.create({
    // Ya no es localhost, ahora es tu URL de Azure
    baseURL: 'https://backend-5g-evento-gca4bdcrb8ejc8ef.canadacentral-01.azurewebsites.net/api/asistentes',
    headers: {
        'Content-Type': 'application/json'
    }
})

export default apiUrl