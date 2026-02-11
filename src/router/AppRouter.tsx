
import { Navigate, Route, Routes } from 'react-router'
import { Welcome } from '../modules/views/Welcome'
import { Formulario } from '../components/Formulario'
import { Scanner } from '../components/Scanner'


export const AppRouter = () => {
    return (
        <Routes>

            <Route path='/' element={<Welcome/>} />
            <Route path='/register' element={<Formulario/>} />
            <Route path='/staff' element={<Scanner/>} />
            <Route path='*' element={<Navigate to="/" replace />} />


        </Routes>
    )
}
