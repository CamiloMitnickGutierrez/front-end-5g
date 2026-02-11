import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode"; 
import { 
  Box, Paper, TextField, Button, Typography, 
  Container, Stack, ThemeProvider, createTheme, 
  CssBaseline, Fade, CircularProgress, Avatar, Chip 
} from "@mui/material";
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PeopleIcon from '@mui/icons-material/People';
import { validarAccesoService, obtenerConteoService } from "../api/validate.service";

const staffTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#90caf9' },
    background: { default: '#0a0a0a', paper: '#1a1a1a' },
    success: { main: '#2e7d32' },
    error: { main: '#d32f2f' },
  },
  shape: { borderRadius: 16 }
});

export const Scanner = () => {
  const [pin, setPin] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'success' | 'error' | 'idle'>('idle');
  const [message, setMessage] = useState("");
  const [totalIngresos, setTotalIngresos] = useState(0);
  
  const ultimoQrRef = useRef<{ id: string; timestamp: number } | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  const PIN_CORRECTO = "2026";
  const COOLDOWN_MS = 3000;

  const actualizarConteo = async () => {
    try {
      const data = await obtenerConteoService();
      setTotalIngresos(data.total);
    } catch (error) {
      console.error("Error al obtener conteo:", error);
    }
  };

  const handleLogin = () => {
    if (pin === PIN_CORRECTO) {
      setIsAuthenticated(true);
    } else {
      alert("PIN Incorrecto");
      setPin("");
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      actualizarConteo();
      const scanner = new Html5Qrcode("reader");
      html5QrCodeRef.current = scanner;

      const config = { 
        fps: 25, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      const startCamera = async () => {
        try {
          await scanner.start(
            { facingMode: "environment" },
            config,
            (text) => validarAcceso(text),
            () => {} 
          );
        } catch (err) {
          try {
            await scanner.start({ facingMode: "user" }, config, (text) => validarAcceso(text), () => {});
          } catch (e) {
            console.error("Error crítico de cámara:", e);
          }
        }
      };
      startCamera();
    }

    return () => {
      if (html5QrCodeRef.current) {
        if (html5QrCodeRef.current.isScanning) {
          html5QrCodeRef.current.stop().catch(e => console.error(e));
        }
      }
    };
  }, [isAuthenticated]);

  const validarAcceso = async (id: string) => {
    const ahora = Date.now();
    const ultimo = ultimoQrRef.current;
    
    if (loading || (ultimo && ultimo.id === id && (ahora - ultimo.timestamp) < COOLDOWN_MS)) {
      return;
    }

    // Pausar el escáner manteniendo el video fluido
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        html5QrCodeRef.current.pause(false); 
      } catch (e) {
        console.log("Error al pausar:", e);
      }
    }

    ultimoQrRef.current = { id, timestamp: ahora };
    setLoading(true);
    
    try {
      const data = await validarAccesoService(id);
      if (navigator.vibrate) navigator.vibrate(200);
      
      const fecha = new Date();
      const fechaFormateada = fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const horaFormateada = fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      
      setStatus('success');
      setMessage(`¡Bienvenido!\n${data.message || ""}\n${fechaFormateada} - ${horaFormateada}`);
      actualizarConteo(); 
    } catch (error: any) {
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      setStatus('error');
      setMessage(error || "Error al validar");
    } finally {
      setLoading(false);
      
      // Reactivar el escáner después de mostrar el mensaje
      setTimeout(() => {
        setStatus('idle');
        setMessage("");
        
        // Reanudar el escáner
        if (html5QrCodeRef.current) {
          try {
            const estado = html5QrCodeRef.current.getState();
            console.log("Estado del escáner:", estado); // Debug
            
            // Estado 3 = PAUSED, podemos resumir
            if (estado === 3) {
              html5QrCodeRef.current.resume();
              console.log("Escáner reanudado");
            } else {
              console.log("Estado inesperado:", estado);
            }
          } catch (e) {
            console.error("Error al reanudar escáner:", e);
          }
        }
      }, 3500); 
    }
  };

  return (
    <ThemeProvider theme={staffTheme}>
      <CssBaseline />
      
      {!isAuthenticated ? (
        <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)', px: 2 }}>
          <Container maxWidth="xs">
            <Paper elevation={24} sx={{ p: 5, textAlign: 'center', background: 'linear-gradient(145deg, #1a1a1a 0%, #0f0f0f 100%)', border: '2px solid', borderColor: 'primary.main', borderRadius: 1 }}>
              <Stack spacing={3.5} alignItems="center">
                <Avatar sx={{ bgcolor: 'primary.main', width: 72, height: 72, borderRadius: 1 }}><LockOutlinedIcon fontSize="large" /></Avatar>
                <Typography variant="h4" fontWeight="900" color="primary.main">STAFF LOGIN</Typography>
                <TextField
                  fullWidth
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  slotProps={{ htmlInput: { inputMode: 'numeric', style: { textAlign: 'center', fontSize: '2.2rem', letterSpacing: '1rem', fontWeight: '700' } } }}
                />
                <Button fullWidth variant="contained" size="large" onClick={handleLogin} sx={{ height: 60, fontWeight: '900' }}>DESBLOQUEAR</Button>
              </Stack>
            </Paper>
          </Container>
        </Box>
      ) : (
        <Box sx={{ minHeight: '100vh', bgcolor: '#000', py: 4 }}>
          <Container maxWidth="sm">
            <Stack spacing={3} alignItems="center">
              <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ color: '#90caf9' }}>SCANNER</Typography>
                <Chip icon={<PeopleIcon />} label={`INGRESOS: ${totalIngresos}`} color="primary" variant="outlined" />
              </Box>

              <Box sx={{ position: 'relative', width: '90%', maxWidth: '350px' }}>
                <Paper sx={{ 
                  overflow: 'hidden', 
                  borderRadius: '40px', 
                  border: '4px solid',
                  borderColor: status === 'success' ? 'success.main' : status === 'error' ? 'error.main' : '#333',
                  bgcolor: '#000',
                  '& #reader video': { objectFit: 'cover !important' }
                }}>
                  <div id="reader" style={{ width: '100%' }}></div>
                </Paper>

                <Fade in={status !== 'idle'}>
                  <Box sx={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    bgcolor: status === 'success' ? 'rgba(46, 125, 50, 0.95)' : 'rgba(211, 47, 47, 0.95)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '40px', zIndex: 10, textAlign: 'center', p: 3, color: 'white'
                  }}>
                    <Typography variant="h1" fontWeight="900">{status === 'success' ? '✓' : '✕'}</Typography>
                    <Typography variant="h4" fontWeight="bold">{status === 'success' ? 'PASA' : 'NO PASA'}</Typography>
                    <Typography variant="h6" sx={{ mt: 1, whiteSpace: 'pre-line' }}>{message}</Typography>
                  </Box>
                </Fade>
              </Box>

              {loading && <CircularProgress color="primary" />}
              <Button onClick={actualizarConteo} variant="text" sx={{ color: '#444' }}>Sincronizar Datos</Button>
            </Stack>
          </Container>
        </Box>
      )}
    </ThemeProvider>
  );
};