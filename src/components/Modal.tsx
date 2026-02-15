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
// Importar imagen local del banner
import banerImage from '../assets/img/baner.png';

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

    const descargarPDF = async () => {
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // Fondo gris claro
        doc.setFillColor(240, 240, 240);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');

      
   

        // Cargar la imagen de los líderes desde assets local
        try {
            const response = await fetch(banerImage);
            const blob = await response.blob();
            const reader = new FileReader();
            
            reader.onloadend = () => {
                const base64data = reader.result as string;
                
                // Agregar imagen
                doc.addImage(base64data, 'PNG', 5, 22, pageWidth - 10, 60);

              

                // Ícono de calendario mejorado
                doc.setFillColor(220, 53, 69); // Rojo
                doc.roundedRect(9, 110, 12, 12, 1.5, 1.5, 'FD');
                doc.setFillColor(180, 40, 55); // Encabezado del calendario
                doc.roundedRect(9, 110, 12, 3, 1.5, 1.5, 'F');
                doc.setFillColor(255, 255, 255);
                // Aros del calendario
                doc.circle(11.5, 109.5, 0.6, 'F');
                doc.circle(18.5, 109.5, 0.6, 'F');
                // Números del calendario
                doc.setFontSize(6);
                doc.setTextColor(255, 255, 255);
                doc.text('6', 11.5, 116.5, { align: 'center' });
                doc.text('7', 15, 116.5, { align: 'center' });
                doc.text('8', 18.5, 116.5, { align: 'center' });

                // Fecha
                doc.setFontSize(18);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(40, 40, 40);
                doc.text('6-7-8 DE MARZO', 25, 118);

                // Ícono de ubicación mejorado (pin de mapa)
                doc.setFillColor(25, 135, 84); // Verde
                // Pin principal (círculo)
                doc.circle(15, 132, 5, 'F');
                // Círculo interior blanco
                doc.setFillColor(255, 255, 255);
                doc.circle(15, 132, 2, 'F');
                // Punta del pin (usando líneas para formar triángulo)
                doc.setFillColor(25, 135, 84);
                doc.setDrawColor(25, 135, 84);
                doc.setLineWidth(0.1);
                // Dibujar triángulo con líneas
                doc.line(15, 137, 13, 134);
                doc.line(15, 137, 17, 134);
                doc.line(13, 134, 17, 134);
                // Rellenar el área del triángulo
                for (let i = 0; i < 3; i++) {
                    doc.line(13 + i * 0.5, 134 + i, 17 - i * 0.5, 134 + i);
                }

                // Dirección
                doc.setFontSize(14);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(60, 60, 60);
                doc.text('Calle 29 #45-64 - Medellín / Antioquia', 24, 137);

                // Ícono de reloj
                doc.setDrawColor(40, 40, 40);
                doc.setLineWidth(1);
                doc.circle(15, 155, 5);
                doc.line(15, 155, 15, 151);
                doc.line(15, 155, 18, 155);

                // Horarios
                doc.setFontSize(13);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(60, 60, 60);
                doc.text('Viernes 6:30pm', 24, 150);
                doc.text('Sábado 3:00pm', 24, 157);
                doc.text('Domingo 9:00am', 24, 164);

                // Cuadro decorativo con fondo blanco para el QR
                doc.setDrawColor(40, 40, 40);
                doc.setLineWidth(0.5);
                doc.setFillColor(255, 255, 255);
                doc.rect(pageWidth - 95, 105, 85, 70, 'FD');

                // Título del QR
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(40, 40, 40);
                doc.text('TU CÓDIGO QR', pageWidth - 52.5, 115, { align: 'center' });

                // Agregar código QR centrado en el recuadro
                const qrSize = 50; // Tamaño del QR en mm
                const qrX = pageWidth - 95 + (85 - qrSize) / 2; // Centrar horizontalmente
                const qrY = 120; // Posición vertical
                doc.addImage(datos.qrUrl, 'PNG', qrX, qrY, qrSize, qrSize);

                // Líneas decorativas curvas (simplificadas)
                doc.setDrawColor(200, 200, 200);
                doc.setLineWidth(0.3);
                for (let i = 0; i < 15; i++) {
                    const startX = pageWidth / 2 - 20;
                    const startY = 85;
                    const endX = pageWidth - 15 + i * 2;
                    const endY = 120 + i * 3;
                    doc.line(startX, startY, endX, endY);
                }

                // Guardar PDF
                doc.save('generacion-5-ministerios.pdf');
            };
            
            reader.readAsDataURL(blob);
        } catch (error) {
            console.error('Error al cargar la imagen:', error);
            
            // Generar PDF sin imagen si hay error
            doc.setTextColor(100, 100, 100);
            doc.setFontSize(12);
            doc.text('[Imagen de líderes]', pageWidth / 2, 50, { align: 'center' });
            
            // Continuar con el resto del contenido
            doc.save('generacion-5-ministerios.pdf');
        }
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