import { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
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
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const PIN_CORRECTO = "2026";
  const COOLDOWN_MS = 2500; // Reducido ligeramente para mayor agilidad en fila

  const actualizarConteo = async () => {
    try {
      const data = await obtenerConteoService();
      setTotalIngresos(data.total);
    } catch (error) {
      console.error("Error al obtener conteo:", error);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      window.location.href = '/';
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleLogin = () => {
    if (pin === PIN_CORRECTO) {
      setIsAuthenticated(true);
    } else {
      alert("PIN Incorrecto");
      setPin("");
    }
  };

  useEffect(() => {
    if (isAuthenticated && !scannerRef.current) {
      actualizarConteo();

      // Cálculo dinámico del cuadro de escaneo para dispositivos pequeños y grandes
      const qrBoxSize = (viewWidth: number) => {
        const size = viewWidth < 600 ? viewWidth * 0.7 : 300;
        return { width: size, height: size };
      };

      const config = { 
        fps: 25, // Más FPS para capturas más rápidas
        qrbox: qrBoxSize, 
        aspectRatio: 1.0,
        videoConstraints: {
          // CAMBIO CLAVE: "environment" sin "exact" para máxima compatibilidad
          facingMode: "environment",
          // Sugerimos resolución para evitar lag en dispositivos gama media
          width: { ideal: 640 },
          height: { ideal: 640 }
        },
        rememberLastUsedCamera: true,
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true // Ayuda en iPhones con cámaras múltiples
      };

      scannerRef.current = new Html5QrcodeScanner("reader", config, false);

      scannerRef.current.render(
        (text) => validarAcceso(text),
        () => { /* Lectura silenciosa */ }
      );
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().then(() => {
            scannerRef.current = null;
        }).catch(e => console.error("Cleanup error:", e));
      }
    };
  }, [isAuthenticated]);

  const validarAcceso = async (id: string) => {
    const ahora = Date.now();
    const ultimo = ultimoQrRef.current;
    
    if (loading || (ultimo && ultimo.id === id && (ahora - ultimo.timestamp) < COOLDOWN_MS)) {
      return;
    }

    ultimoQrRef.current = { id, timestamp: ahora };
    setLoading(true);
    
    try {
      const data = await validarAccesoService(id);
      
      // Feedback Táctil (Solo Android, iOS requiere interacción previa)
      if (navigator.vibrate) navigator.vibrate(150);
      
      setStatus('success');
      setMessage(data.message || "Acceso Concedido");
      actualizarConteo(); 
    } catch (error: any) {
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]); // Vibración de error
      setStatus('error');
      setMessage(error || "Error al validar");
    } finally {
      setLoading(false);
      setTimeout(() => {
        setStatus('idle');
        setMessage("");
      }, 3000);
    }
  };

  return (
    <ThemeProvider theme={staffTheme}>
      <CssBaseline />
      
      {!isAuthenticated ? (
        <Box sx={{ 
          height: '100vh', 
          width: '100vw', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)',
          position: 'fixed', 
          px: 2 
        }}>
          <Container maxWidth="xs">
            <Paper 
              elevation={24} 
              sx={{ 
                p: 5, 
                textAlign: 'center', 
                background: 'linear-gradient(145deg, #1a1a1a 0%, #0f0f0f 100%)',
                border: '2px solid',
                borderColor: 'primary.main',
                borderRadius: 1,
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(144, 202, 249, 0.2)',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'linear-gradient(90deg, transparent, #90caf9, transparent)',
                }
              }}
            >
              <Stack spacing={3.5} alignItems="center">
                <Box sx={{ position: 'relative' }}>
                  <Avatar sx={{ 
                    bgcolor: 'primary.main', 
                    width: 72, 
                    height: 72,
                    borderRadius: 1,
                    boxShadow: '0 4px 20px rgba(144, 202, 249, 0.4)'
                  }}>
                    <LockOutlinedIcon fontSize="large" />
                  </Avatar>
                </Box>
                
                <Box>
                  <Typography variant="h4" fontWeight="900" color="primary.main" sx={{ mb: 0.5 }}>
                    STAFF LOGIN
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ingresa tu PIN de acceso
                  </Typography>
                </Box>

                <TextField
                  fullWidth
                  type="password"
                  label="PIN DE SEGURIDAD"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  slotProps={{
                    htmlInput: { 
                      inputMode: 'numeric', 
                      style: { 
                        textAlign: 'center', 
                        fontSize: '2.2rem', 
                        letterSpacing: '1rem',
                        fontWeight: '700'
                      }
                    }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1,
                      bgcolor: 'rgba(144, 202, 249, 0.05)',
                      '& fieldset': {
                        borderColor: '#333',
                        borderWidth: 2,
                      },
                      '&:hover fieldset': {
                        borderColor: 'primary.main',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'primary.main',
                        borderWidth: 2,
                      },
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: '0.9rem',
                      fontWeight: '600',
                    }
                  }}
                />
                
                <Button 
                  fullWidth 
                  variant="contained" 
                  size="large" 
                  onClick={handleLogin} 
                  sx={{ 
                    height: 60, 
                    fontSize: '1.1rem',
                    fontWeight: '900',
                    borderRadius: 1,
                    background: 'linear-gradient(135deg, #90caf9 0%, #64b5f6 100%)',
                    boxShadow: '0 4px 15px rgba(144, 202, 249, 0.3)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(144, 202, 249, 0.4)',
                      background: 'linear-gradient(135deg, #64b5f6 0%, #42a5f5 100%)',
                    },
                    '&:active': {
                      transform: 'translateY(0px)',
                    }
                  }}
                >
                  DESBLOQUEAR
                </Button>
              </Stack>
            </Paper>
          </Container>
        </Box>
      ) : (
        <Box sx={{ minHeight: '100vh', bgcolor: '#000', py: { xs: 2, md: 4 } }}>
          <Container maxWidth="sm">
            <Stack spacing={3}>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1 }}>
                <Typography variant="h6" fontWeight="bold" color="primary">SCANNER</Typography>
                <Chip 
                  icon={<PeopleIcon />} 
                  label={`INGRESOS: ${totalIngresos}`} 
                  color="primary"
                  variant="filled"
                  sx={{ fontWeight: '900', fontSize: '1rem' }}
                />
              </Box>

              <Box sx={{ position: 'relative', width: '100%', overflow: 'hidden', borderRadius: 8 }}>
                <Paper sx={{ 
                  overflow: 'hidden', 
                  borderRadius: 8, 
                  border: '5px solid',
                  borderColor: status === 'success' ? 'success.main' : status === 'error' ? 'error.main' : '#222',
                  transition: 'all 0.2s ease-in-out',
                  bgcolor: '#000'
                }}>
                  <div id="reader" style={{ width: '100%' }}></div>
                </Paper>

                {/* OVERLAY UNIVERSAL */}
                <Fade in={status !== 'idle'}>
                  <Box sx={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    bgcolor: status === 'success' ? 'rgba(46, 125, 50, 0.96)' : 'rgba(211, 47, 47, 0.96)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    zIndex: 20, textAlign: 'center', p: 3, color: 'white'
                  }}>
                    <Typography variant="h1" sx={{ fontSize: '8rem', fontWeight: '900', lineHeight: 1 }}>
                      {status === 'success' ? '✓' : '✕'}
                    </Typography>
                    <Typography variant="h3" fontWeight="900" sx={{ mb: 1 }}>
                      {status === 'success' ? 'PASA' : 'NO PASA'}
                    </Typography>
                    <Typography variant="h6" sx={{ opacity: 0.9 }}>
                      {message}
                    </Typography>
                  </Box>
                </Fade>
              </Box>

              <Box sx={{ textAlign: 'center' }}>
                {loading ? <CircularProgress size={30} /> : (
                  <Button onClick={actualizarConteo} variant="text" sx={{ color: '#444' }}>
                    Sincronizar Datos
                  </Button>
                )}
              </Box>
            </Stack>
          </Container>
        </Box>
      )}
    </ThemeProvider>
  );
};