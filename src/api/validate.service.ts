import apiUrl from "./urlApi";

export const validarAccesoService = async (id: string) => {
    try {
        const response = await apiUrl.put(`/validar/${id}`);
        return response.data;
    } catch (error: any) {
        const errorMsg = error.response?.data?.message || error.response?.data?.error || "Error al validar";
        throw errorMsg;
    }
};

// En api/validate.service.ts

export const obtenerConteoService = async () => {
  try {
    const {data} = await apiUrl.get("/conteo");
    return data; // { total: 45 }
  } catch (error: any) {
    throw error.response?.data?.message || "Error al obtener conteo";
  }
};
