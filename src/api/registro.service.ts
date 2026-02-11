
import apiUrl from "./urlApi"



export const registrarAsistente = async (datos:any) => {

    try {

        const {data} = await apiUrl.post('/registrar',datos)

        return data
        
    } catch (error:any) {
    
        throw error.response?.data?.error || "Error al conectar con el servidor"
        
    }
    
}





