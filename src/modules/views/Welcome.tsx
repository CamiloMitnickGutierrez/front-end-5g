import { useState, useEffect } from "react";
import { AppBar, Box, Toolbar, Button } from "@mui/material";
import img1 from "../../assets/img/1.jpeg";
import img2 from "../../assets/img/2.jpeg";
import img3 from "../../assets/img/3.jpeg";
import { hero } from "../../assets/styles/animations";
import { useNavigate } from "react-router";


export const Welcome = () => {
  const [index, setIndex] = useState(0);
  const imagenes = [img1, img2, img3];
  const navigate = useNavigate(); // Descomenta si usas navegación interna

  useEffect(() => {
    const intervalo = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % imagenes.length);
    }, 4000);
    return () => clearInterval(intervalo);
  }, [imagenes.length]);

  return (
    <Box sx={{ backgroundColor: 'black', height: '100vh', width: '100vw', overflow: 'hidden', position: 'relative' }}>
      
      {/* Navbar con botón de registro */}
      <AppBar position="fixed" sx={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', boxShadow: 'none', zIndex: 10 }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
      

          <Button 
            variant="contained" 
            color="primary"
            // onClick={() => navigate('/registro')} // Ejemplo con router
            sx={{ 
              borderRadius: '20px',
              fontWeight: 'bold',
              textTransform: 'none',
              px: 3,
              backgroundColor: '#fff', // Blanco para que resalte
              color: '#000',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.8)',
              }
            
            }}

            onClick={()=>navigate('/register')}
          >
            REGISTRARME
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            // onClick={() => navigate('/registro')} // Ejemplo con router
            sx={{ 
              borderRadius: '20px',
              fontWeight: 'bold',
              textTransform: 'none',
              px: 3,
              backgroundColor: 'hsla(220, 3%, 62%, 0.75)', // Blanco para que resalte
              color: '#000',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.8)',
              }
            
            }}

            onClick={()=>navigate('/staff')}
          >
            STAFF
          </Button>
        </Toolbar>
      </AppBar>

      {/* CONTENEDOR PRINCIPAL (Mismo que antes) */}
      <Box key={index} sx={{ height: '100vh', width: '100vw', position: 'relative', animation: `${hero} 3s ease-out forwards` }}>
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${imagenes[index]})`,
            backgroundSize: 'cover',
            filter: 'blur(40px) brightness(0.4)',
            transform: 'scale(1.1)',
          }}
        />
        <Box
          sx={{
            position: 'relative',
            height: '100%',
            width: '100%',
            backgroundImage: `url(${imagenes[index]})`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
      </Box>

      {/* PUNTITOS INDICADORES */}
      <Box sx={{ position: 'absolute', bottom: 30, width: '100%', display: 'flex', justifyContent: 'center', gap: 1.5, zIndex: 5 }}>
        {imagenes.map((_, i) => (
          <Box
            key={i}
            sx={{
              width: index === i ? 30 : 10,
              height: 6,
              borderRadius: '3px',
              backgroundColor: index === i ? 'white' : 'rgba(255,255,255,0.4)',
              transition: 'all 0.5s ease',
            }}
          />
        ))}
      </Box>
    </Box>
  );
};