import { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { 
  Box, Paper, TextField, Button, Typography, 
  Container, Stack, ThemeProvider, createTheme, 
  CssBaseline, Fade, CircularProgress, Avatar, Chip 
} from "@mui/material";
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import PeopleIcon from '@mui/icons-material/People'; // Icono para el contador
import { validarAccesoService, obtenerConteoService } from "../api/validate.service"; // Asumo que crearás este service

const staffTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#90caf9' },
    background: { default: '#0a0a0a', paper: '#1a1a1a' },
  },
  shape: { borderRadius: 16 }
});

export const Scanner = () => {
  const [pin, setPin] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'success' | 'error' | 'idle'>('idle');
  const [message, setMessage] = useState("");
  
  // --- Estado para el conteo ---
  const [totalIngresos, setTotalIngresos] = useState(0);
  
  // --- Sistema de cooldown con useRef para evitar escaneos duplicados ---
  const ultimoQrRef = useRef<{ id: string; timestamp: number } | null>(null);

  const PIN_CORRECTO = "2026";
  const COOLDOWN_MS = 3000; // 3 segundos de espera entre escaneos del mismo QR

  // Función para traer el conteo del servidor
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
      window.history.pushState(null, '', window.location.pathname);
      window.location.replace('/');
    };
    window.history.pushState(null, '', window.location.pathname);
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
    let scanner: Html5QrcodeScanner | null = null;

    if (isAuthenticated) {
      // Cargamos el conteo inicial al entrar
      actualizarConteo();

      // QR Box responsive según el ancho de pantalla
      const qrBoxSize = window.innerWidth < 400 ? 220 : window.innerWidth < 600 ? 250 : 280;

      scanner = new Html5QrcodeScanner(
        "reader", 
        { fps: 20, qrbox: { width: qrBoxSize, height: qrBoxSize }, aspectRatio: 1.0 }, 
        false
      );

      scanner.render(
        (text) => { if (!loading) validarAcceso(text); },
        (_error) => { }
      );
    }

    return () => {
      if (scanner) {
        scanner.clear().catch((e) => console.error("Error al limpiar scanner", e));
      }
    };
  }, [isAuthenticated]); // Eliminamos 'loading' para que el scanner permanezca activo

  const validarAcceso = async (id: string) => {
    // Verificar si es el mismo QR escaneado recientemente usando ref
    const ahora = Date.now();
    const ultimo = ultimoQrRef.current;
    
    if (ultimo && ultimo.id === id && (ahora - ultimo.timestamp) < COOLDOWN_MS) {
      return; // Ignorar escaneo duplicado
    }

    // Actualizar el último QR escaneado en la ref
    ultimoQrRef.current = { id, timestamp: ahora };
    
    setLoading(true);
    try {
      const data = await validarAccesoService(id);
      setStatus('success');
      setMessage(data.message || "Acceso Concedido");
      
      // Actualizamos el contador inmediatamente después de un éxito
      actualizarConteo(); 

    } catch (error: any) {
      setStatus('error');
      setMessage(error || "Error al validar");
    } finally {
      setLoading(false);
      setTimeout(() => {
        setStatus('idle');
        setMessage("");
      }, 4000);
    }
  };

  return (
    <ThemeProvider theme={staffTheme}>
      <CssBaseline />
      
      {!isAuthenticated ? (
        <Box sx={{ 
          height: '100vh', width: '100vw', display: 'flex', 
          alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default',
          position: 'fixed', top: 0, left: 0, zIndex: 9999,
          px: 2 // Padding horizontal para móviles
        }}>
          <Container maxWidth="xs">
            <Paper elevation={12} sx={{ p: { xs: 3, sm: 4 }, textAlign: 'center', border: '1px solid #333' }}>
              <Stack spacing={3} alignItems="center">
                <Avatar sx={{ bgcolor: 'primary.main', width: { xs: 48, sm: 56 }, height: { xs: 48, sm: 56 } }}>
                  <LockOutlinedIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>Acceso Para Staff</Typography>
                  <Typography variant="body2" color="text.secondary">Ingrese el PIN de seguridad</Typography>
                </Box>
                
                <TextField
                  fullWidth
                  type="password"
                  label="PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  slotProps={{
                    htmlInput: { 
                      inputMode: 'numeric', 
                      pattern: '[0-9]*',
                      style: { textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' }
                    }
                  }}
                />
                
                <Button 
                  fullWidth 
                  variant="contained" 
                  size="large" 
                  onClick={handleLogin}
                  sx={{ py: 1.5, fontWeight: 'bold' }}
                >
                  DESBLOQUEAR
                </Button>
              </Stack>
            </Paper>
          </Container>
        </Box>
      ) : (
        <Box sx={{ minHeight: '100vh', bgcolor: '#000', py: { xs: 2, sm: 3, md: 4 }, px: { xs: 2, sm: 0 } }}>
          <Container maxWidth="sm">
            <Stack spacing={{ xs: 2, sm: 3 }} alignItems="center">
              
              {/* --- HEADER CON CONTADOR --- */}
              <Box sx={{ 
                width: '100%', 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between', 
                alignItems: { xs: 'stretch', sm: 'center' },
                gap: { xs: 1.5, sm: 0 }
              }}>
                <Typography 
                  variant="h6" 
                  fontWeight="bold" 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    fontSize: { xs: '1.1rem', sm: '1.25rem' },
                    justifyContent: { xs: 'center', sm: 'flex-start' }
                  }}
                >
                  <QrCodeScannerIcon color="primary" /> SCANNER
                </Typography>
                
                <Chip 
                  icon={<PeopleIcon />} 
                  label={`INGRESOS: ${totalIngresos} / 500`} 
                  color="primary"
                  variant="outlined"
                  sx={{ 
                    fontWeight: 'bold', 
                    fontSize: { xs: '0.85rem', sm: '1rem' }, 
                    py: { xs: 1.5, sm: 2 },
                    width: { xs: '100%', sm: 'auto' }
                  }}
                />
              </Box>

              <Box sx={{ position: 'relative', width: '100%' }}>
                <Paper sx={{ 
                  overflow: 'hidden', 
                  borderRadius: { xs: 4, sm: 6 }, 
                  border: '4px solid',
                  borderColor: status === 'success' ? 'success.main' : status === 'error' ? 'error.main' : '#333',
                  transition: 'border-color 0.3s ease', 
                  bgcolor: '#111'
                }}>
                  <div id="reader" style={{ width: '100%' }}></div>
                </Paper>

                {status !== 'idle' && (
                  <Fade in={true}>
                    <Box sx={{
                      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                      bgcolor: status === 'success' ? 'rgba(46, 125, 50, 0.95)' : 'rgba(211, 47, 47, 0.95)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      borderRadius: { xs: 4, sm: 6 }, 
                      zIndex: 10, 
                      textAlign: 'center', 
                      p: { xs: 2, sm: 3 }, 
                      color: 'white'
                    }}>
                      <Typography 
                        variant="h2" 
                        fontWeight="900"
                        sx={{ fontSize: { xs: '3rem', sm: '3.75rem' } }}
                      >
                        {status === 'success' ? '✓' : '✕'}
                      </Typography>
                      <Typography 
                        variant="h4" 
                        fontWeight="bold"
                        sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}
                      >
                        {status === 'success' ? 'PASA' : 'NO PASA'}
                      </Typography>
                      <Typography 
                        variant="h6" 
                        sx={{ mt: 1, fontSize: { xs: '0.9rem', sm: '1.25rem' } }}
                      >
                        {message}
                      </Typography>
                    </Box>
                  </Fade>
                )}
              </Box>

              {loading && <CircularProgress color="primary" sx={{ width: { xs: 40, sm: 48 }, height: { xs: 40, sm: 48 } }} />}
              
              {!loading && status === 'idle' && (
                <Button 
                  onClick={actualizarConteo} 
                  variant="text" 
                  size="small" 
                  color="inherit" 
                  sx={{ opacity: 0.5, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                >
                  Actualizar conteo manualmente
                </Button>
              )}
            </Stack>
          </Container>
        </Box>
      )}
    </ThemeProvider>
  );
};