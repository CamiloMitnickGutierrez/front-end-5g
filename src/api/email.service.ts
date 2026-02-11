import apiUrl from "./urlApi"

interface DatosEmail {
    email: string;
    nombre: string;
    qrUrl: string;
}

export const enviarCorreoService = async (datos: DatosEmail) => {

    try {

        const {data} = await apiUrl.post('/enviar-email',datos)

        return data
        
    } catch (error:any) {

        throw error.response?.data?.error || "Error al conectar con el servidor"
        
    }
    
}