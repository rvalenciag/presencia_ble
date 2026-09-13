// CU01: Configurar Perfil Inicial (pantalla de bienvenida).
// Orquestador: guarda el estado del asistente y decide qué Vista mostrar.
// Las 3 vistas viven en ./ConfiguracionPerfil/ (VistaSeleccionRol, VistaFormulario, VistaConfirmacion).

import { useEffect, useRef, useState } from 'react';
import { BackHandler } from 'react-native';
import { router } from 'expo-router';

import { ModalConfirmacion } from '@/Presentacion/componentes/ModalConfirmacion';
import { VistaFormulario } from './VistaFormulario';
import { VistaConfirmacion } from './VistaConfirmacion';
import { VistaSeleccionRol } from './VistaSeleccionRol';
import { datosIniciales } from './tipos';
import { usePerfil } from '@/Negocio/NPerfil';

import type { DatosFormulario, ErroresFormulario } from './tipos';
import type { Rol } from '@/Negocio/NPerfil';

type Paso = 'ROLE_SELECTION' | 'PROFILE_FORM' | 'DASHBOARD_PREVIEW';

// Valida el formulario según el rol elegido; devuelve los errores por campo (vacío = todo bien)
function validarFormulario(formData: DatosFormulario, rol: Rol): ErroresFormulario {
    const errores: ErroresFormulario = {};
    const camposObligatorios: (keyof DatosFormulario)[] =
        rol === 'ESTUDIANTE'
            ? ['registro', 'nombre', 'apellidoPaterno', 'apellidoMaterno', 'correo', 'carrera']
            : ['registro', 'nombre', 'apellidoPaterno', 'apellidoMaterno', 'correo'];

    for (const campo of camposObligatorios) {
        if (formData[campo].trim() === '') {
            errores[campo] = 'Campo obligatorio';
        }
    }
    if (!errores.registro && !/^\d+$/.test(formData.registro)) {
        errores.registro = 'Ingresa únicamente números válidos';
    }
    // El protocolo BLE de CU05/CU06 codifica el registro en dos palabras de 16
    // bits y admite registros numéricos de una a nueve cifras. Sin esta regla el perfil se guardaba, pero
    // el docente descartaba su identidad antes de llegar a la nómina.
    if (!errores.registro && rol === 'ESTUDIANTE' && !/^[1-9]\d{0,8}$/.test(formData.registro)) {
        errores.registro = 'El registro para vinculación BLE debe tener entre 1 y 9 dígitos';
    }
    return errores;
}

export function PConfiguracionPerfil() {
    const { perfil, uuidDispositivo, bluetoothEncendido, guardarPerfil } = usePerfil();

    const [paso, setPaso] = useState<Paso>('ROLE_SELECTION');
    const [rol, setRol] = useState<Rol | null>(null);
    const [formData, setFormData] = useState<DatosFormulario>(datosIniciales);
    const [errors, setErrors] = useState<ErroresFormulario>({});
    const [alertaBluetoothVisible, setAlertaBluetoothVisible] = useState(false);

    const uuid = uuidDispositivo ?? '—';

    // Si ya hay perfil guardado, entra directo a su panel
    const perfilInicial = useRef(perfil);
    useEffect(() => {
        if (perfilInicial.current) {
            router.replace(perfilInicial.current.rol === 'DOCENTE' ? '/gestionar-grupos' : '/mis-grupos');
        }
    }, []);

    // Con el gesto o botón atrás del sistema, el formulario vuelve a la elección de rol en vez de salir de la app
    useEffect(() => {
        const suscripcion = BackHandler.addEventListener('hardwareBackPress', () => {
            if (paso === 'PROFILE_FORM') {
                setPaso('ROLE_SELECTION');
                return true; // se consume: no se sale de la app
            }
            return false; // comportamiento normal
        });
        return () => suscripcion.remove();
    }, [paso]);

    const actualizarCampo = (campo: keyof DatosFormulario, valor: string) => {
        setFormData((previo) => ({ ...previo, [campo]: valor }));
        setErrors((previo) => ({ ...previo, [campo]: undefined }));
    };

    const seleccionarRol = (nuevoRol: Rol) => {
        setRol(nuevoRol);
        setPaso('PROFILE_FORM');
    };

    const guardar = () => {
        if (!rol) return;

        const nuevosErrores = validarFormulario(formData, rol);
        if (Object.keys(nuevosErrores).length > 0) {
            setErrors(nuevosErrores);
            return;
        }

        // Se exige Bluetooth encendido para continuar
        if (bluetoothEncendido === false) {
            setAlertaBluetoothVisible(true);
            return;
        }

        guardarPerfil?.({
            registro: formData.registro.trim(),
            rol,
            nombre: formData.nombre.trim(),
            apellidoPaterno: formData.apellidoPaterno.trim(),
            apellidoMaterno: formData.apellidoMaterno.trim() || null,
            correo: formData.correo.trim(),
            carrera: rol === 'ESTUDIANTE' ? formData.carrera.trim() : null,
            uuid,
        });

        setPaso('DASHBOARD_PREVIEW');
    };

    const irAMisGrupos = () => {
        if (!rol) {
            return;
        }
        if (rol === 'DOCENTE') {
            router.push('/gestionar-grupos');
            return;
        }
        router.push({
            pathname: '/mis-grupos',
            params: {
                nombre: formData.nombre.trim(),
                apellido: formData.apellidoPaterno.trim(),
                registro: formData.registro.trim(),
            },
        });
    };

    // La alerta de Bluetooth: se muestra en las 3 vistas. (Si viviera solo en una,
    // el bloqueo de "Guardar Perfil" con el BT apagado no mostraría nada.)
    const cerrarAlertaBluetooth = () => setAlertaBluetoothVisible(false);

    const alertaBluetooth = (
        <ModalConfirmacion
            visible={alertaBluetoothVisible}
            icono="📴"
            tonoIcono="error"
            titulo="Bluetooth Apagado"
            mensaje="Activa el Bluetooth para poder continuar"
            textoConfirmar="Entendido"
            tonoConfirmar="primario"
            textoCancelar={null}
            onConfirmar={cerrarAlertaBluetooth}
            onCancelar={cerrarAlertaBluetooth}
        />
    );

    // Vista 1: selección de rol
    if (paso === 'ROLE_SELECTION') {
        return (
            <>
                <VistaSeleccionRol onSeleccionarRol={seleccionarRol} />
                {alertaBluetooth}
            </>
        );
    }

    // Vista 2: formulario del perfil
    if (paso === 'PROFILE_FORM') {
        return (
            <>
                <VistaFormulario
                    rol={rol}
                    formData={formData}
                    errors={errors}
                    uuid={uuid}
                    onActualizarCampo={actualizarCampo}
                    onRegresar={() => setPaso('ROLE_SELECTION')}
                    onGuardar={guardar}
                />
                {alertaBluetooth}
            </>
        );
    }

    // Vista 3: confirmación con el resumen del perfil guardado
    return (
        <>
            <VistaConfirmacion
                rol={rol}
                formData={formData}
                uuid={uuid}
                onIrAMisGrupos={irAMisGrupos}
            />
            {alertaBluetooth}
        </>
    );
}
