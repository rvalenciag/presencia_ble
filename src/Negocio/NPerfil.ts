// Tema: perfil del usuario (espejo de la tabla perfil).
// CU01: Configurar Perfil Inicial — implementación real.
// Guarda el perfil en la base y, si el rol es ESTUDIANTE, también lo registra
// en la tabla estudiante. Observa el Bluetooth en vivo.
// ADR-014: las vistas toman sus tipos desde Negocio (nunca desde Datos).

import { useEffect, useState } from 'react';
import { DPerfil } from '@/Datos/DPerfil';
import { DEstudiante } from '@/Datos/DEstudiante';
import { DDispositivo } from '@/Datos/DDispositivo';
import { escucharEstadoBluetooth, obtenerEstadoBluetooth } from '@/Negocio/Servicio/BluetoothServicio';

// Tipos que las vistas del CU01 importan desde Negocio (versión publicada de Datos)
export type { DPerfil, Rol } from '@/Datos/DPerfil';

// Lo que devuelve el hook usePerfil
export interface RespuestaUsePerfil {
    perfil: DPerfil | null;
    uuidDispositivo: string;
    bluetoothEncendido: boolean | null;
    guardarPerfil: (perfil: DPerfil) => void;
}

export function usePerfil(): RespuestaUsePerfil {
    // El perfil ya guardado en la base (null si es la primera vez)
    const [perfil, setPerfil] = useState<DPerfil | null>(() => DPerfil.obtenerPerfil());
    // El uuid del teléfono (nace la primera vez que se consulta)
    const uuidDispositivo = new DDispositivo().uuid;
    // El Bluetooth: null mientras no se sabe, true/false después
    const [bluetoothEncendido, setBluetoothEncendido] = useState<boolean | null>(null);

    // Escucha cambios del adaptador Bluetooth en vivo; antes pide permisos
    // (Android 12+ muestra el diálogo aquí) y fija el estado inicial real
    useEffect(() => {
        obtenerEstadoBluetooth().then(setBluetoothEncendido);
        const dejarDeEscuchar = escucharEstadoBluetooth(setBluetoothEncendido);
        return dejarDeEscuchar;
    }, []);

    // Guarda el perfil en la base; si es estudiante, también lo registra como alumno
    const guardarPerfil = (perfilAGuardar: DPerfil) => {
        DPerfil.guardarPerfil(perfilAGuardar);
        if (perfilAGuardar.rol === 'ESTUDIANTE') {
            DEstudiante.registrarEstudianteSiNoExiste({
                registro: perfilAGuardar.registro,
                nombre: perfilAGuardar.nombre,
                apellidoPaterno: perfilAGuardar.apellidoPaterno ?? '',
                apellidoMaterno: perfilAGuardar.apellidoMaterno,
                carrera: perfilAGuardar.carrera,
                plan: null,
                telefono: null,
                correo: null,
            });
        }
        setPerfil(perfilAGuardar);
    };

    return { perfil, uuidDispositivo, bluetoothEncendido, guardarPerfil };
}
