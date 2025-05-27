let equipos = []
let historialEnfrentamientos = new Set()
let contadorRotaciones = 0
let rotacionesCompletas = []
let matrizEnfrentamientos = {}
let torneoActivo = false
let fechaInicioTorneo = null

// Claves para localStorage
const STORAGE_KEY = 'torneoVoleibolPro'
const BACKUP_KEY = 'torneoVoleibolBackup'

// Cargar torneo al inicio
window.addEventListener('load', function () {
   verificarTorneoGuardado()
   actualizarEstadoTorneo()
})

// Guardar automáticamente antes de cerrar
window.addEventListener('beforeunload', function (e) {
   if (torneoActivo) {
      guardarDatos()
   }
})

// Funciones de persistencia mejoradas
function guardarDatos() {
   try {
      const datosParaGuardar = {
         equipos: equipos,
         historialEnfrentamientos: Array.from(historialEnfrentamientos),
         contadorRotaciones: contadorRotaciones,
         rotacionesCompletas: rotacionesCompletas,
         matrizEnfrentamientos: matrizEnfrentamientos,
         torneoActivo: torneoActivo,
         fechaInicioTorneo: fechaInicioTorneo,
         timestamp: new Date().toISOString(),
         version: '2.0'
      }

      // Guardar en localStorage y crear backup
      localStorage.setItem(STORAGE_KEY, JSON.stringify(datosParaGuardar))
      localStorage.setItem(BACKUP_KEY, JSON.stringify(datosParaGuardar))

      return true
   } catch (e) {
      console.error('Error al guardar:', e)
      return false
   }
}

function obtenerDatosGuardados() {
   try {
      // Intentar cargar datos principales
      let datos = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')

      // Si no hay datos principales, intentar backup
      if (!datos) {
         datos = JSON.parse(localStorage.getItem(BACKUP_KEY) || 'null')
      }

      return datos
   } catch (e) {
      console.error('Error al obtener datos:', e)
      return null
   }
}

function cargarDatos(datos) {
   equipos = datos.equipos || []
   historialEnfrentamientos = new Set(datos.historialEnfrentamientos || [])
   contadorRotaciones = datos.contadorRotaciones || 0
   rotacionesCompletas = datos.rotacionesCompletas || []
   matrizEnfrentamientos = datos.matrizEnfrentamientos || {}
   torneoActivo = datos.torneoActivo || false
   fechaInicioTorneo = datos.fechaInicioTorneo ? new Date(datos.fechaInicioTorneo) : null
}

function verificarTorneoGuardado() {
   const datosGuardados = obtenerDatosGuardados()
   if (datosGuardados && datosGuardados.torneoActivo) {
      const mensaje = document.getElementById('mensajes')
      mostrarMensajeInfo('📁 Hay un torneo guardado disponible. Usa "Recuperar Torneo" para continuarlo.', 'blue')
   }
}

function actualizarEstadoTorneo() {
   const estadoDiv = document.getElementById('estadoTorneo')
   const tiempoDiv = document.getElementById('tiempoTorneo')

   if (torneoActivo && fechaInicioTorneo) {
      estadoDiv.classList.remove('hidden')
      const fechaFormateada = fechaInicioTorneo.toLocaleString('es-ES', {
         day: '2-digit',
         month: '2-digit',
         year: 'numeric',
         hour: '2-digit',
         minute: '2-digit'
      })
      tiempoDiv.textContent = `Iniciado: ${fechaFormateada}`
   } else {
      estadoDiv.classList.add('hidden')
   }
}

// Funciones de mensajes mejoradas
function mostrarMensajeInfo(texto, tipo = 'green') {
   const mensaje = document.getElementById('mensajes')
   const colores = {
      green: 'bg-green-100 text-green-800 border-green-200',
      red: 'bg-red-100 text-red-800 border-red-200',
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200'
   }

   mensaje.className = `text-center text-sm mt-3 p-3 rounded-lg border ${colores[tipo]} transition-all duration-300`
   mensaje.innerHTML = `<span class="font-medium">${texto}</span>`

   // Auto-ocultar después de 5 segundos
   setTimeout(() => {
      mensaje.className = 'text-center text-sm mt-3 p-3 rounded-lg transition-all duration-300'
      mensaje.innerHTML = ''
   }, 5000)
}

// Modal de confirmación
function mostrarModal(mensaje, callback) {
   return new Promise(resolve => {
      const modal = document.getElementById('modalConfirmacion')
      const mensajeModal = document.getElementById('mensajeModal')
      const btnConfirmar = document.getElementById('btnConfirmar')
      const btnCancelar = document.getElementById('btnCancelar')

      mensajeModal.textContent = mensaje
      modal.classList.remove('hidden')
      modal.classList.add('flex')

      function cerrarModal(resultado) {
         modal.classList.add('hidden')
         modal.classList.remove('flex')
         resolve(resultado)
      }

      btnConfirmar.onclick = () => cerrarModal(true)
      btnCancelar.onclick = () => cerrarModal(false)
      modal.onclick = e => {
         if (e.target === modal) cerrarModal(false)
      }
   })
}

// Función principal para iniciar torneo con validaciones
async function iniciarTorneo() {
   // Validar si ya hay un torneo activo
   if (torneoActivo) {
      const continuar = await mostrarModal(
         'Ya hay un torneo activo. ¿Deseas crear un nuevo torneo? Esto eliminará el progreso actual.'
      )
      if (!continuar) return

      // Reiniciar todo si el usuario confirma
      await reiniciarTodo()
   }

   // Procesar equipos
   if (!procesarEquipos()) return

   // Inicializar torneo
   inicializarTorneo()
   mostrarMensajeInfo('🚀 ¡Torneo iniciado exitosamente!')
}

function procesarEquipos() {
   const textoDetallado = document.getElementById('inputDetallado').value.trim()

   if (!textoDetallado) {
      mostrarMensajeInfo('❌ Por favor, ingresa los equipos con sus jugadores', 'red')
      return false
   }

   equipos = []
   const bloques = textoDetallado.split('\n\n').filter(bloque => bloque.trim())

   for (let bloque of bloques) {
      const lineas = bloque.split('\n').filter(linea => linea.trim())
      if (lineas.length >= 5) {
         const nombreEquipo = lineas[0].trim() // Ahora conserva "Equipo X" completo
         const jugadores = lineas.slice(1, 5)
         equipos.push({
            nombre: nombreEquipo,
            jugadores: jugadores.map(j => j.trim())
         })
      }
   }

   if (equipos.length !== 9) {
      mostrarMensajeInfo(
         `❌ Necesitas exactamente 9 equipos (con 4 jugadores cada uno). Tienes ${equipos.length}`,
         'red'
      )
      return false
   }

   return true
}

function inicializarTorneo() {
   historialEnfrentamientos = new Set()
   contadorRotaciones = 1
   rotacionesCompletas = []
   torneoActivo = true
   fechaInicioTorneo = new Date()

   // Mezclar equipos
   equipos.sort(() => Math.random() - 0.5)

   // Inicializar matriz
   matrizEnfrentamientos = {}
   equipos.forEach(equipo1 => {
      matrizEnfrentamientos[equipo1.nombre] = {}
      equipos.forEach(equipo2 => {
         if (equipo1.nombre !== equipo2.nombre) {
            matrizEnfrentamientos[equipo1.nombre][equipo2.nombre] = 0
         }
      })
   })

   // Registrar enfrentamientos iniciales
   registrarEnfrentamientos(equipos)
   rotacionesCompletas.push([...equipos])

   // Mostrar interfaz
   mostrarInterfazTorneo()
   actualizarVistas()
   actualizarEstadoTorneo()

   // Guardar automáticamente
   guardarDatos()
}

function mostrarInterfazTorneo() {
   document.getElementById('btnRotar').classList.remove('hidden')
   document.getElementById('btnGuardar').classList.remove('hidden')
   document.getElementById('estadisticas').classList.remove('hidden')
   document.getElementById('matrizContainer').classList.remove('hidden')

   // Cambiar texto del botón iniciar
   const btnIniciar = document.getElementById('btnIniciar')
   btnIniciar.innerHTML = `
                <span class="flex items-center justify-center gap-2">
                    ⚠️ <span>Reiniciar Torneo</span>
                </span>
            `
   btnIniciar.className =
      'flex-1 button-danger px-6 py-4 rounded-lg text-lg font-semibold shadow-lg transition-all duration-300'
}

function actualizarVistas() {
   mostrarContador()
   mostrarCanchas(equipos)
   actualizarEstadisticas()
   mostrarMatriz()
}

function mostrarContador() {
   const contador = document.getElementById('contador')
   const maxRotaciones = calcularRotacionesOptimas()
   contador.innerHTML = `
                <div class="flex items-center justify-center gap-2">
                    <div class="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                    <span>🎯 Rotación ${contadorRotaciones} de ${maxRotaciones} rotaciones óptimas</span>
                </div>
            `
}

function calcularRotacionesOptimas() {
   return 4
}

function mostrarCanchas(listaEquipos) {
   const div = document.getElementById('canchas')
   div.innerHTML = ''

   for (let i = 0; i < 3; i++) {
      let canchaHTML = `
                    <div class='glass-effect rounded-xl shadow-lg border border-white/20 overflow-hidden animate-slide-up' style='animation-delay: ${
                       i * 0.1
                    }s'>
                        <div class='court-gradient p-4'>
                            <h2 class='text-xl font-bold text-center text-white flex items-center justify-center gap-2'>
                                🏐 <span>Cancha ${i + 1}</span>
                            </h2>
                        </div>
                        <div class='p-4'>
                            <div class='grid grid-cols-1 sm:grid-cols-3 gap-4'>
                `

      for (let j = 0; j < 3; j++) {
         const equipo = listaEquipos[i * 3 + j]
         canchaHTML += `
                        <div class='team-card rounded-lg p-4 card-hover shadow-md'>
                            <h3 class='font-bold text-center mb-3 text-lg'>${equipo.nombre}</h3>
                            <ul class='space-y-2'>
                                ${equipo.jugadores
                                   .map(
                                      j => `
                                        <li class='flex items-center text-sm'>
                                            <div class='w-2 h-2 bg-white rounded-full mr-2 opacity-80'></div>
                                            <span>${j}</span>
                                        </li>
                                    `
                                   )
                                   .join('')}
                            </ul>
                        </div>`
      }
      canchaHTML += `
                            </div>
                        </div>
                    </div>`
      div.innerHTML += canchaHTML
   }
}

function registrarEnfrentamientos(configuracion) {
   for (let i = 0; i < 3; i++) {
      const cancha = configuracion.slice(i * 3, i * 3 + 3)
      for (let j = 0; j < 3; j++) {
         for (let k = j + 1; k < 3; k++) {
            const equipo1 = cancha[j].nombre
            const equipo2 = cancha[k].nombre
            const enfrentamiento = [equipo1, equipo2].sort().join('|')
            historialEnfrentamientos.add(enfrentamiento)

            // Actualizar matriz
            matrizEnfrentamientos[equipo1][equipo2]++
            matrizEnfrentamientos[equipo2][equipo1]++
         }
      }
   }
}

function evaluarConfiguracion(configuracion) {
   let puntaje = 0
   let enfrentamientosNuevos = 0

   for (let i = 0; i < 3; i++) {
      const cancha = configuracion.slice(i * 3, i * 3 + 3)
      for (let j = 0; j < 3; j++) {
         for (let k = j + 1; k < 3; k++) {
            const equipo1 = cancha[j].nombre
            const equipo2 = cancha[k].nombre
            const enfrentamiento = [equipo1, equipo2].sort().join('|')

            if (!historialEnfrentamientos.has(enfrentamiento)) {
               enfrentamientosNuevos++
               puntaje += 10
            } else {
               puntaje -= 5
            }

            const vecesEnfrentados = matrizEnfrentamientos[equipo1][equipo2] || 0
            if (vecesEnfrentados === 0) {
               puntaje += 5
            } else if (vecesEnfrentados === 1) {
               puntaje += 2
            }
         }
      }
   }

   return { puntaje, enfrentamientosNuevos }
}

function generarMejorConfiguracion() {
   let mejorConfiguracion = null
   let mejorPuntaje = -Infinity
   let mejoresEnfrentamientos = 0

   for (let intento = 0; intento < 5000; intento++) {
      const configuracion = [...equipos]

      if (intento < 1000) {
         configuracion.sort(() => Math.random() - 0.5)
      } else if (intento < 3000) {
         const rotacion = intento % equipos.length
         for (let i = 0; i < rotacion; i++) {
            configuracion.push(configuracion.shift())
         }
         configuracion.sort(() => Math.random() - 0.5)
      } else {
         optimizarConfiguracionLocal(configuracion)
      }

      const evaluacion = evaluarConfiguracion(configuracion)

      if (
         evaluacion.puntaje > mejorPuntaje ||
         (evaluacion.puntaje === mejorPuntaje && evaluacion.enfrentamientosNuevos > mejoresEnfrentamientos)
      ) {
         mejorPuntaje = evaluacion.puntaje
         mejoresEnfrentamientos = evaluacion.enfrentamientosNuevos
         mejorConfiguracion = [...configuracion]
      }
   }

   return mejorConfiguracion
}

function optimizarConfiguracionLocal(configuracion) {
   for (let i = 0; i < configuracion.length; i++) {
      for (let j = i + 1; j < configuracion.length; j++) {
         ;[configuracion[i], configuracion[j]] = [configuracion[j], configuracion[i]]

         if (Math.random() > 0.3) {
            ;[configuracion[i], configuracion[j]] = [configuracion[j], configuracion[i]]
         }
      }
   }
}

async function rotarEquipos() {
   // Mostrar loading
   const btnRotar = document.getElementById('btnRotar')
   const textoOriginal = btnRotar.innerHTML
   btnRotar.innerHTML = `
                <span class="flex items-center justify-center gap-2">
                    <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Generando...</span>
                </span>
            `
   btnRotar.disabled = true

   // Simular un pequeño delay para mostrar el loading
   await new Promise(resolve => setTimeout(resolve, 500))

   const mejorConfiguracion = generarMejorConfiguracion()

   if (mejorConfiguracion) {
      const evaluacion = evaluarConfiguracion(mejorConfiguracion)

      if (evaluacion.enfrentamientosNuevos > 0) {
         registrarEnfrentamientos(mejorConfiguracion)
         equipos = mejorConfiguracion
         contadorRotaciones++
         rotacionesCompletas.push([...mejorConfiguracion])

         actualizarVistas()
         guardarDatos()
         mostrarMensajeInfo('✅ Rotación completada y guardada automáticamente')

         // Restaurar botón
         btnRotar.innerHTML = textoOriginal
         btnRotar.disabled = false
         return
      }
   }

   // Torneo completado
   mostrarMensajeInfo('🏁 Torneo completado. No se pueden generar más rotaciones óptimas.', 'blue')
   btnRotar.innerHTML = `
                <span class="flex items-center justify-center gap-2">
                    🏁 <span>Torneo Completado</span>
                </span>
            `
   btnRotar.disabled = true
   btnRotar.classList.add('opacity-50')
}

function guardarTorneo() {
   if (!torneoActivo) {
      mostrarMensajeInfo('❌ No hay torneo activo para guardar', 'red')
      return
   }

   if (guardarDatos()) {
      mostrarMensajeInfo('💾 Torneo guardado exitosamente')
   } else {
      mostrarMensajeInfo('❌ Error al guardar el torneo', 'red')
   }
}

async function cargarTorneo() {
   const datosGuardados = obtenerDatosGuardados()

   if (!datosGuardados) {
      mostrarMensajeInfo('❌ No hay torneo guardado', 'red')
      return
   }

   const fechaGuardado = new Date(datosGuardados.timestamp).toLocaleString('es-ES')
   const continuar = await mostrarModal(`¿Recuperar torneo guardado el ${fechaGuardado}?`)

   if (!continuar) return

   cargarDatos(datosGuardados)

   if (equipos.length > 0) {
      // Actualizar textarea
      const textoEquipos = equipos.map(equipo => `${equipo.nombre}: ${equipo.jugadores.join(', ')}`).join('\n')
      document.getElementById('inputDetallado').value = textoEquipos

      // Mostrar interfaz
      if (torneoActivo) {
         mostrarInterfazTorneo()
      }

      actualizarVistas()
      actualizarEstadoTorneo()
      mostrarMensajeInfo('📂 Torneo recuperado exitosamente')
   }
}

async function confirmarReinicio() {
   const continuar = await mostrarModal(
      '⚠️ ¿Estás seguro de que quieres eliminar el torneo actual y empezar uno nuevo? Esta acción no se puede deshacer.'
   )

   if (continuar) {
      await reiniciarTodo()
   }
}

async function reiniciarTodo() {
   // Limpiar variables
   equipos = []
   historialEnfrentamientos = new Set()
   contadorRotaciones = 0
   rotacionesCompletas = []
   matrizEnfrentamientos = {}
   torneoActivo = false
   fechaInicioTorneo = null

   // Limpiar almacenamiento
   localStorage.removeItem(STORAGE_KEY)
   localStorage.removeItem(BACKUP_KEY)

   // Limpiar interfaz
   document.getElementById('inputDetallado').value = ''
   document.getElementById('canchas').innerHTML = ''
   document.getElementById('btnRotar').classList.add('hidden')
   document.getElementById('btnGuardar').classList.add('hidden')
   document.getElementById('estadisticas').classList.add('hidden')
   document.getElementById('matrizContainer').classList.add('hidden')
   document.getElementById('contador').innerHTML = ''

   // Restaurar botón iniciar
   const btnIniciar = document.getElementById('btnIniciar')
   btnIniciar.innerHTML = `
                <span class="flex items-center justify-center gap-2">
                    🚀 <span>Iniciar Torneo</span>
                </span>
            `
   btnIniciar.className =
      'flex-1 button-primary text-white px-6 py-4 rounded-lg text-lg font-semibold shadow-lg transition-all duration-300'

   actualizarEstadoTorneo()
   mostrarMensajeInfo('🗑️ Nuevo torneo iniciado. Todo limpio para empezar.', 'blue')
}

function actualizarEstadisticas() {
   const totalPosibles = (9 * 8) / 2 // 36 enfrentamientos únicos posibles
   const completados = historialEnfrentamientos.size
   const progreso = Math.round((completados / totalPosibles) * 100)

   document.getElementById('totalPosibles').textContent = totalPosibles
   document.getElementById('completados').textContent = completados
   document.getElementById('progreso').textContent = progreso
}

function mostrarMatriz() {
   const matriz = document.getElementById('matriz')
   let html = `
                <table class="text-xs border-collapse w-full bg-white rounded-lg overflow-hidden shadow-sm">
                    <tr class="bg-gray-50">
                        <th class="border border-gray-200 p-2 font-semibold text-gray-600">Equipos</th>
            `

   // Encabezados
   equipos.forEach((equipo, index) => {
      html += `<th class="border border-gray-200 p-2 font-semibold text-gray-600" title="${equipo.nombre}">${
         index + 1
      }</th>`
   })
   html += '</tr>'

   // Filas
   equipos.forEach((equipo1, index1) => {
      html += `<tr class="hover:bg-gray-50">
                    <th class="border border-gray-200 p-2 bg-gray-50 font-medium text-left" title="${equipo1.nombre}">
                        ${index1 + 1}. ${equipo1.nombre.substring(0, 8)}
                    </th>`

      equipos.forEach(equipo2 => {
         if (equipo1.nombre === equipo2.nombre) {
            html += '<td class="border border-gray-200 p-2 bg-gray-100 text-center text-gray-400">-</td>'
         } else {
            const enfrentamientos = matrizEnfrentamientos[equipo1.nombre][equipo2.nombre] || 0
            const colorClass =
               enfrentamientos === 0
                  ? 'bg-red-50 text-red-700'
                  : enfrentamientos === 1
                  ? 'bg-yellow-50 text-yellow-700'
                  : 'bg-green-50 text-green-700'
            html += `<td class="border border-gray-200 p-2 text-center font-medium ${colorClass}">${enfrentamientos}</td>`
         }
      })
      html += '</tr>'
   })
   html += '</table>'

   matriz.innerHTML = html
}

// Optimizaciones para móvil
document.addEventListener('DOMContentLoaded', function () {
   // Prevenir zoom en inputs en iOS
   document.addEventListener('touchstart', function () {}, true)

   // Mejorar scroll suave
   document.documentElement.style.scrollBehavior = 'smooth'

   // Optimizar textarea para móvil
   const textarea = document.getElementById('inputDetallado')
   textarea.addEventListener('focus', function () {
      setTimeout(() => {
         this.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 300)
   })
})

// Guardar automáticamente cada 30 segundos si hay torneo activo
setInterval(() => {
   if (torneoActivo) {
      guardarDatos()
   }
}, 30000)
