import { useState, useEffect, useRef } from "react";
// Importamos la clase base para mayor control
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
    if (isAuthenticated) {
      actualizarConteo();

      // Inicializamos la instancia en el div "reader"
      const scanner = new Html5Qrcode("reader");
      html5QrCodeRef.current = scanner;

      const config = { 
        fps: 25, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      const startCamera = async () => {
        try {
          // Intentamos forzar cámara trasera directamente
          await scanner.start(
            { facingMode: "environment" },
            config,
            (text) => validarAcceso(text),
            () => {} // Ignorar errores de escaneo fallido (no lectura)
          );
        } catch (err) {
          console.error("Error iniciando cámara trasera:", err);
          // Fallback por si el dispositivo tiene nombres de cámara raros
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
          html5QrCodeRef.current.stop().then(() => {
            html5QrCodeRef.current = null;
          }).catch(e => console.error("Error al detener:", e));
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

    ultimoQrRef.current = { id, timestamp: ahora };
    setLoading(true);
    
    try {
      const data = await validarAccesoService(id);
      if (navigator.vibrate) navigator.vibrate(200);
      setStatus('success');
      setMessage(data.message || "Acceso Concedido");
      actualizarConteo(); 
    } catch (error: any) {
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      setStatus('error');
      setMessage(error || "Error al validar");
    } finally {
      setLoading(false);
      setTimeout(() => {
        setStatus('idle');
        setMessage("");
      }, 3500);
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
        <Box sx={{ minHeight: '100vh', bgcolor: '#000', py: 4 }}>
          <Container maxWidth="sm">
            <Stack spacing={3} alignItems="center">
              
              <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ color: '#90caf9' }}>SCANNER</Typography>
                <Chip icon={<PeopleIcon />} label={`INGRESOS: ${totalIngresos}`} color="primary" variant="outlined" />
              </Box>

              <Box sx={{ position: 'relative', width: '90%', maxWidth: '350px', lineHeight: 0 }}>
                <Paper sx={{ 
                  overflow: 'hidden', 
                  borderRadius: '40px', // Redondeado como en tu imagen
                  border: '4px solid',
                  borderColor: status === 'success' ? 'success.main' : status === 'error' ? 'error.main' : '#333',
                  bgcolor: '#000',
                  // Esto fuerza a que el video se vea bien dentro del contenedor
                  '& #reader video': { objectFit: 'cover !important' }
                }}>
                  <div id="reader" style={{ width: '100%' }}></div>
                </Paper>

                {/* OVERLAY DE ESTADO */}
                <Fade in={status !== 'idle'}>
                  <Box sx={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    bgcolor: status === 'success' ? 'rgba(46, 125, 50, 0.95)' : 'rgba(211, 47, 47, 0.95)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '40px', zIndex: 10, textAlign: 'center', p: 3, color: 'white'
                  }}>
                    <Typography variant="h1" fontWeight="900">{status === 'success' ? '✓' : '✕'}</Typography>
                    <Typography variant="h4" fontWeight="bold">{status === 'success' ? 'PASA' : 'NO PASA'}</Typography>
                    <Typography variant="h6" sx={{ mt: 1 }}>{message}</Typography>
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