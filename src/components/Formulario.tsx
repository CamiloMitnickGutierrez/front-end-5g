import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
    Box, TextField, Button, Typography, Container, Paper,
    AppBar, Toolbar, IconButton, CircularProgress,
    FormControl, FormLabel, RadioGroup, FormControlLabel, Radio
} from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { registrarAsistente } from "../api/registro.service";
import { ModalExito } from "./Modal";

const validationSchema = Yup.object().shape({
    nombre: Yup.string().required("El Nombre es obligatorio"),
    primerApellido: Yup.string().required("El Primer apellido es obligatorio"),
    telefono: Yup.string().required("El Teléfono es obligatorio"),
    ciudad: Yup.string().required("La Ciudad es obligatoria"),
    barrio: Yup.string().required("El Barrio es obligatorio"),
    email: Yup.string().email("Email inválido").required("El email es obligatorio"),
    confirmarEmail: Yup.string()
        .oneOf([Yup.ref('email')], 'Los Emails deben coincidir')
        .required('Confirma tu email'),
    primeraVez: Yup.string().oneOf(['si', 'no']).required()
});

export const Formulario: React.FC = () => {
    const navigate = useNavigate();
    const [cargando, setCargando] = useState(false);
    
    // ESTADOS PARA EL MODAL
    const [openModal, setOpenModal] = useState(false);
    // Ahora guardamos el email también para el proceso posterior
    const [datosRespuesta, setDatosRespuesta] = useState<{ nombre: string; email: string; qrUrl: string } | null>(null);

    const formik = useFormik({
        initialValues: {
            nombre: "", primerApellido: "", segundoApellido: "",
            telefono: "", ciudad: "", barrio: "",
            invitadoPor: "", primeraVez: "si", email: "", confirmarEmail: ""
        },
        validationSchema,
        onSubmit: async (values) => {
            setCargando(true);
            try {
                const { confirmarEmail, ...datosFinales } = values;
                
                // 1. Petición al Backend (Solo registra y genera QR)
                const respuesta = await registrarAsistente(datosFinales);
                
                if (respuesta.success) {
                    setDatosRespuesta({
                        nombre: values.nombre,
                        email: values.email, // <--- Guardamos el email para el modal
                        qrUrl: respuesta.qrUrl // <--- El QR que viene de tu DB
                    });
                    setOpenModal(true);
                    formik.resetForm();
                }
            } catch (error: any) {
                alert("Error: " + error.message);
            } finally {
                setCargando(false);
            }
        },
    });

    const renderTextField = (name: string, label: string, xs = 12) => (
        <Box sx={{ width: xs === 12 ? '100%' : { xs: '100%', sm: `${(xs / 12) * 100}%` }, px: 1, mb: 2 }}>
            <TextField
                fullWidth size="small" name={name} label={label} variant="outlined" disabled={cargando}
                value={(formik.values as any)[name]} onChange={formik.handleChange} onBlur={formik.handleBlur}
                error={(formik.touched as any)[name] && Boolean((formik.errors as any)[name])}
                helperText={(formik.touched as any)[name] && (formik.errors as any)[name]}
                InputLabelProps={{ shrink: true, sx: { color: '#aaa' } }}
                sx={{
                    "& .MuiOutlinedInput-root": {
                        color: "white", backgroundColor: "#1e1e1e",
                        "& fieldset": { borderColor: "#444" },
                        "&.Mui-focused fieldset": { borderColor: "white" },
                    }
                }}
            />
        </Box>
    );

    return (
        <Box sx={{ backgroundColor: '#000', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
            <AppBar position="fixed" sx={{ backgroundColor: '#000', borderBottom: '1px solid #333' }}>
                <Toolbar variant="dense">
                    <IconButton onClick={() => navigate('/')} sx={{ color: 'white', mr: 2 }}><ArrowBackIcon /></IconButton>
                    <Typography variant="subtitle1" color="white">Regresar</Typography>
                </Toolbar>
            </AppBar>

            {cargando ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <CircularProgress size={60} sx={{ color: 'white' }} />
                    <Typography variant="h6" sx={{ color: 'white' }}>Procesando registro...</Typography>
                </Box>
            ) : (
                <Container sx={{ maxWidth: '650px !important', mt: 8 }}> 
                    <Paper sx={{ p: 4, backgroundColor: '#121212', borderRadius: 4, border: '1px solid #333' }}>
                        <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', textAlign: 'center', color: 'white' }}>
                            REGISTRO DE ASISTENCIA A 5G
                        </Typography>

                        <form onSubmit={formik.handleSubmit} autoComplete="off">
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', mx: -1 }}>
                                {renderTextField("nombre", "Nombre", 6)}
                                {renderTextField("primerApellido", "Primer Apellido", 6)}
                                {renderTextField("segundoApellido", "Segundo Apellido (opcional)", 6)}
                                {renderTextField("telefono", "Teléfono", 6)}
                                {renderTextField("ciudad", "Ciudad", 6)}
                                {renderTextField("barrio", "Barrio", 6)}
                                {renderTextField("invitadoPor", "Invitado Por (opcional)", 6)}
                                {renderTextField("email", "Email", 6)}
                                {renderTextField("confirmarEmail", "Confirmar Email", 6)}

                                <Box sx={{ width: '100%', px: 1, mb: 2 }}>
                                    <FormControl component="fieldset">
                                        <FormLabel component="legend" sx={{ color: '#aaa', mb: 1 }}>
                                            ¿Es tu primera vez En La Iglesia?
                                        </FormLabel>
                                        <RadioGroup
                                            row
                                            name="primeraVez"
                                            value={formik.values.primeraVez}
                                            onChange={formik.handleChange}
                                        >
                                            <FormControlLabel 
                                                value="si" 
                                                control={<Radio sx={{ color: '#aaa', '&.Mui-checked': { color: 'white' } }} />} 
                                                label="Sí" 
                                                sx={{ color: 'white' }}
                                            />
                                            <FormControlLabel 
                                                value="no" 
                                                control={<Radio sx={{ color: '#aaa', '&.Mui-checked': { color: 'white' } }} />} 
                                                label="No" 
                                                sx={{ color: 'white' }}
                                            />
                                        </RadioGroup>
                                    </FormControl>
                                </Box>

                                <Box sx={{ width: '100%', px: 1, mt: 1 }}>
                                    <Button
                                        fullWidth type="submit" variant="contained" disabled={cargando}
                                        sx={{ py: 1.5,   backgroundColor:'#19428a', color: '#000', fontWeight: 'bold' }}
                                    >
                                        {cargando ? <CircularProgress size={24} sx={{ color: 'black'}} /> : "FINALIZAR REGISTRO y Guarda El  Codigo QR (Que te sale a continuacion)"}
                                    </Button>
                                </Box>
                            </Box>
                        </form>
                    </Paper>
                </Container>
            )}

            {/* Invocamos el Modal y le pasamos el objeto con el email incluido */}
            <ModalExito 
                open={openModal} 
                onClose={() => setOpenModal(false)} 
                datos={datosRespuesta}
                onSalir={() => navigate('/')} 
            />
        </Box>
    );
};