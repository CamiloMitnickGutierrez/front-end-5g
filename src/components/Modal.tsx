import React, { useState } from "react";
import { 
    Dialog, DialogContent, DialogTitle, Typography, 
    Box, Stack, Button, IconButton, CircularProgress,
    Snackbar, Alert
} from "@mui/material";
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CloseIcon from '@mui/icons-material/Close';
import { jsPDF } from "jspdf";
// CAMBIO: Importamos la función correcta para el correo
import { enviarCorreoService } from "../api/email.service";

interface ModalExitoProps {
    open: boolean;
    onClose: () => void;
    datos: { nombre: string; email: string; qrUrl: string } | null;
    onSalir: () => void;
}

export const ModalExito: React.FC<ModalExitoProps> = ({ open, onClose, datos, onSalir }) => {
    const [enviando, setEnviando] = useState(false);
    const [mostrarMensaje, setMostrarMensaje] = useState(false);

    if (!datos) return null;

    const descargarPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(22);
        doc.text("TICKET DE ENTRADA", 105, 20, { align: "center" });
        doc.setFontSize(16);
        doc.text(`¡Hola, ${datos.nombre}!`, 20, 40);
        doc.setFontSize(12);
        doc.text("Presenta este código QR en la entrada del evento.", 20, 50);
        
        // Usamos PNG que es más compatible con los Base64 de códigos QR
        doc.addImage(datos.qrUrl, "PNG", 70, 65, 70, 70);
        
        doc.save(`Ticket_${datos.nombre}.pdf`);
    };

    const manejarEnvioEmail = async () => {
        setEnviando(true);
        try {
            // CAMBIO: Usamos enviarCorreoService en lugar de registrarAsistente
            await enviarCorreoService({
                email: datos.email,
                nombre: datos.nombre,
                qrUrl: datos.qrUrl
            });
            setMostrarMensaje(true);
        } catch (error: any) {
            console.error("Error al enviar:", error.response?.data || error.message);
            alert("Hubo un error al enviar el correo.");
        } finally {
            setEnviando(false);
        }
    };

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            PaperProps={{ 
                sx: { 
                    backgroundColor: '#121212', 
                    color: 'white', 
                    borderRadius: 4, 
                    textAlign: 'center', 
                    maxWidth: '400px',
                    position: 'relative'
                } 
            }}
        >
            <IconButton 
                onClick={onClose}
                sx={{ position: 'absolute', right: 8, top: 8, color: '#aaa' }}
            >
                <CloseIcon />
            </IconButton>

            <DialogTitle component="div" sx={{ pt: 4 }}>
                <CheckCircleOutlineIcon sx={{ color: '#4caf50', fontSize: 70, mb: 1 }} />
                <Typography variant="h5" fontWeight="bold" component="h2">
                    ¡Felicitaciones!
                </Typography>
                <Typography variant="h6" component="p" sx={{ color: '#fff', opacity: 0.9 }}>
                    {datos.nombre}
                </Typography>
            </DialogTitle>

            <DialogContent>
                <Typography variant="body2" sx={{ mb: 3, color: '#aaa' }}>
                    Tu registro ha sido exitoso. Guarda tu código QR:
                </Typography>
                
                <Box sx={{ 
                    backgroundColor: 'white', 
                    p: 2, 
                    borderRadius: 3, 
                    display: 'inline-block', 
                    mb: 3,
                    boxShadow: '0 0 20px rgba(255,255,255,0.1)'
                }}>
                    <img src={datos.qrUrl} alt="QR" style={{ width: 180, height: 180, display: 'block' }} />
                </Box>

                <Stack spacing={2} sx={{ mb: 2 }}>
                    <Button 
                        variant="contained" 
                        fullWidth 
                        onClick={descargarPDF}
                        sx={{ backgroundColor: '#fff', color: '#000', fontWeight: 'bold', '&:hover': { backgroundColor: '#eee' } }}
                    >
                        DESCARGAR PDF
                    </Button>

                    <Button 
                        variant="outlined" 
                        fullWidth 
                        onClick={manejarEnvioEmail}
                        disabled={enviando}
                        sx={{ color: '#fff', borderColor: '#333', '&:hover': { borderColor: '#555' } }}
                    >
                        {enviando ? <CircularProgress size={24} sx={{ color: 'white' }} /> : "ENVIAR AL EMAIL"}
                    </Button>

                    <Button 
                        variant="outlined" 
                        fullWidth 
                        onClick={onSalir}
                        sx={{ 
                            color: '#fff', 
                            borderColor: '#fff', 
                            mt: 1,
                            '&:hover': { borderColor: '#ccc', backgroundColor: 'rgba(255,255,255,0.1)' } 
                        }}
                    >
                        SALIR
                    </Button>
                </Stack>
            </DialogContent>

            <Snackbar
                open={mostrarMensaje}
                autoHideDuration={2000}
                onClose={() => setMostrarMensaje(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert 
                    onClose={() => setMostrarMensaje(false)} 
                    severity="success" 
                    sx={{ width: '100%', fontSize: '1.1rem', fontWeight: 'bold' }}
                >
                    ¡Felicidades! Correo enviado exitosamente
                </Alert>
            </Snackbar>
        </Dialog>
    );
};