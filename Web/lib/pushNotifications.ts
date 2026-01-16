import { collection, getDocs, query, where, addDoc } from "firebase/firestore"
import { db } from "./firebase"
import type { NotificacionPush } from "./types"

// Usar nuestra propia API Route para evitar problemas de CORS
const EXPO_PUSH_URL = "/api/notifications/send"

interface ExpoPushMessage {
  to: string | string[]
  title: string
  body: string
  data?: Record<string, any>
  sound?: "default" | null
  badge?: number
  channelId?: string
  priority?: "default" | "normal" | "high"
  ttl?: number
}

interface ExpoPushResponse {
  data: {
    status: "ok" | "error"
    id?: string
    message?: string
    details?: any
  }[]
}

/**
 * Envía notificaciones push a través de Expo Push Notification API
 */
export async function sendExpoPushNotifications(
  messages: ExpoPushMessage[]
): Promise<ExpoPushResponse> {
  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error enviando notificaciones push:", error)
    throw error
  }
}

/**
 * Obtiene todos los tokens de notificación de usuarios activos y dispositivos anónimos
 */
export async function getAllUserTokens(): Promise<string[]> {
  try {
    const tokens: string[] = []

    // Obtener tokens de usuarios autenticados
    const usersRef = collection(db, "users")
    const usersSnapshot = await getDocs(usersRef)
    usersSnapshot.forEach((doc) => {
      const data = doc.data()
      if (data.notification_tokens && Array.isArray(data.notification_tokens)) {
        tokens.push(...data.notification_tokens)
      }
    })

    // Obtener tokens de dispositivos anónimos
    const deviceTokensRef = collection(db, "device_tokens")
    const deviceTokensSnapshot = await getDocs(deviceTokensRef)
    deviceTokensSnapshot.forEach((doc) => {
      const data = doc.data()
      if (data.token) {
        tokens.push(data.token)
      }
    })

    // Remover duplicados
    return [...new Set(tokens)]
  } catch (error) {
    console.error("Error obteniendo tokens de usuarios:", error)
    return []
  }
}

/**
 * Obtiene tokens de usuarios que siguen rutas específicas
 */
export async function getTokensByRoutes(routeIds: string[]): Promise<string[]> {
  try {
    const usersRef = collection(db, "users")
    const usersSnapshot = await getDocs(usersRef)

    const tokens: string[] = []
    usersSnapshot.forEach((doc) => {
      const data = doc.data()

      // Verificar si el usuario sigue alguna de las rutas afectadas
      const userFavoriteRoutes = data.favoritos?.rutas || []
      const hasMatchingRoute = routeIds.some((routeId) =>
        userFavoriteRoutes.includes(routeId)
      )

      if (hasMatchingRoute && data.notification_tokens) {
        tokens.push(...data.notification_tokens)
      }
    })

    return [...new Set(tokens)]
  } catch (error) {
    console.error("Error obteniendo tokens por rutas:", error)
    return []
  }
}

/**
 * Obtiene tokens de usuarios que siguen paradas específicas
 */
export async function getTokensByStops(stopIds: string[]): Promise<string[]> {
  try {
    const usersRef = collection(db, "users")
    const usersSnapshot = await getDocs(usersRef)

    const tokens: string[] = []
    usersSnapshot.forEach((doc) => {
      const data = doc.data()

      // Verificar si el usuario sigue alguna de las paradas afectadas
      const userFavoriteStops = data.favoritos?.paradas || []
      const hasMatchingStop = stopIds.some((stopId) =>
        userFavoriteStops.includes(stopId)
      )

      if (hasMatchingStop && data.notification_tokens) {
        tokens.push(...data.notification_tokens)
      }
    })

    return [...new Set(tokens)]
  } catch (error) {
    console.error("Error obteniendo tokens por paradas:", error)
    return []
  }
}

/**
 * Obtiene tokens de dispositivos anónimos
 */
export async function getAnonymousDeviceTokens(): Promise<string[]> {
  try {
    const deviceTokensRef = collection(db, "device_tokens")
    const deviceTokensSnapshot = await getDocs(deviceTokensRef)

    const tokens: string[] = []
    deviceTokensSnapshot.forEach((doc) => {
      const data = doc.data()
      if (data.token) {
        tokens.push(data.token)
      }
    })

    return [...new Set(tokens)]
  } catch (error) {
    console.error("Error obteniendo tokens de dispositivos anónimos:", error)
    return []
  }
}

/**
 * Envía una notificación push relacionada con una alerta
 */
export async function sendAlertNotification(
  alert: {
    id: string
    title: string
    description: string
    type: string
    affectedRoutes: string[]
    affectedStops?: string[]
  },
  createdBy: string
): Promise<{ success: boolean; count: number; errors: string[] }> {
  try {
    console.log("📢 Iniciando envío de notificación para alerta:", alert.id)
    console.log("📋 Título:", alert.title)
    console.log("🚏 Rutas afectadas:", alert.affectedRoutes.length)
    console.log("🚏 Paradas afectadas:", alert.affectedStops?.length || 0)

    // Obtener tokens de destinatarios
    let tokens: string[] = []

    if (alert.affectedRoutes.length > 0) {
      console.log("🔍 Buscando usuarios con rutas favoritas afectadas...")
      const routeTokens = await getTokensByRoutes(alert.affectedRoutes)
      console.log(`✅ Encontrados ${routeTokens.length} tokens por rutas`)
      tokens.push(...routeTokens)
    }

    if (alert.affectedStops && alert.affectedStops.length > 0) {
      console.log("🔍 Buscando usuarios con paradas favoritas afectadas...")
      const stopTokens = await getTokensByStops(alert.affectedStops)
      console.log(`✅ Encontrados ${stopTokens.length} tokens por paradas`)
      tokens.push(...stopTokens)
    }

    // Siempre incluir dispositivos anónimos en alertas (son públicas)
    console.log("🔍 Obteniendo tokens de dispositivos anónimos...")
    const anonymousTokens = await getAnonymousDeviceTokens()
    console.log(`✅ Encontrados ${anonymousTokens.length} tokens anónimos`)
    tokens.push(...anonymousTokens)

    // Si no hay tokens de usuarios específicos, enviar a todos los usuarios registrados
    if (tokens.length === anonymousTokens.length) {
      console.log("🔍 No hay usuarios específicos, obteniendo todos los tokens...")
      const allUserTokens = await getAllUserTokens()
      console.log(`✅ Encontrados ${allUserTokens.length} tokens de usuarios`)
      tokens.push(...allUserTokens)
    }

    // Remover duplicados
    const tokensBeforeDedupe = tokens.length
    tokens = [...new Set(tokens)]
    console.log(`🔄 Eliminados ${tokensBeforeDedupe - tokens.length} tokens duplicados`)
    console.log(`📊 Total de tokens únicos: ${tokens.length}`)

    if (tokens.length === 0) {
      console.warn("⚠️ No hay tokens de dispositivos para enviar notificaciones")
      return { success: true, count: 0, errors: [] }
    }

    // Preparar mensajes
    const messages: ExpoPushMessage[] = tokens.map((token) => ({
      to: token,
      title: alert.title,
      body: alert.description,
      data: {
        tipo: "alerta",
        alerta_id: alert.id,
        type: alert.type,
      },
      sound: "default",
      channelId: "alertas",
      priority: "high",
    }))

    // Enviar en lotes de 100 (límite de Expo)
    const batchSize = 100
    const batches: ExpoPushMessage[][] = []
    for (let i = 0; i < messages.length; i += batchSize) {
      batches.push(messages.slice(i, i + batchSize))
    }

    console.log(`📦 Dividido en ${batches.length} lote(s) de hasta ${batchSize} mensajes`)

    const errors: string[] = []
    let successCount = 0

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]
      console.log(`📤 Enviando lote ${i + 1}/${batches.length} (${batch.length} mensajes)...`)

      try {
        const response = await sendExpoPushNotifications(batch)

        response.data.forEach((result, index) => {
          if (result.status === "ok") {
            successCount++
          } else {
            const errorMsg = `Token ${batch[index].to.substring(0, 30)}...: ${result.message || "Error desconocido"}`
            errors.push(errorMsg)
            console.error("❌", errorMsg)
          }
        })

        console.log(`✅ Lote ${i + 1} procesado: ${batch.length} mensajes enviados`)
      } catch (error) {
        const errorMsg = `Error en lote ${i + 1}: ${error}`
        errors.push(errorMsg)
        console.error("❌", errorMsg)
      }
    }

    console.log(`\n📊 RESUMEN DE ENVÍO:`)
    console.log(`✅ Exitosos: ${successCount}`)
    console.log(`❌ Fallidos: ${errors.length}`)
    console.log(`📈 Tasa de éxito: ${((successCount / tokens.length) * 100).toFixed(2)}%`)

    // Guardar registro de notificación en Firestore
    await addDoc(collection(db, "notificaciones_push"), {
      id_notificacion: `notif_${Date.now()}`,
      titulo: alert.title,
      cuerpo: alert.description,
      tipo: "alerta",
      alerta_id: alert.id,
      enviar_a_todos: tokens.length === (await getAllUserTokens()).length,
      rutas_filtro: alert.affectedRoutes,
      paradas_filtro: alert.affectedStops || [],
      enviada: true,
      fecha_envio: new Date(),
      usuarios_alcanzados: successCount,
      createdAt: new Date(),
      createdBy,
    })

    return {
      success: errors.length === 0,
      count: successCount,
      errors,
    }
  } catch (error) {
    console.error("Error enviando notificación de alerta:", error)
    return {
      success: false,
      count: 0,
      errors: [String(error)],
    }
  }
}

/**
 * Envía una notificación personalizada
 */
export async function sendCustomNotification(
  notification: {
    title: string
    body: string
    type: "alerta" | "actualizacion" | "recordatorio" | "info"
    data?: Record<string, any>
    routeIds?: string[]
    stopIds?: string[]
    sendToAll?: boolean
  },
  createdBy: string
): Promise<{ success: boolean; count: number; errors: string[] }> {
  try {
    let tokens: string[] = []

    if (notification.sendToAll) {
      tokens = await getAllUserTokens()
    } else {
      if (notification.routeIds && notification.routeIds.length > 0) {
        const routeTokens = await getTokensByRoutes(notification.routeIds)
        tokens.push(...routeTokens)
      }

      if (notification.stopIds && notification.stopIds.length > 0) {
        const stopTokens = await getTokensByStops(notification.stopIds)
        tokens.push(...stopTokens)
      }
    }

    tokens = [...new Set(tokens)]

    if (tokens.length === 0) {
      return { success: true, count: 0, errors: [] }
    }

    // Determinar canal según tipo
    let channelId = "default"
    if (notification.type === "alerta") channelId = "alertas"
    else if (notification.type === "actualizacion") channelId = "actualizaciones"

    const messages: ExpoPushMessage[] = tokens.map((token) => ({
      to: token,
      title: notification.title,
      body: notification.body,
      data: {
        tipo: notification.type,
        ...notification.data,
      },
      sound: "default",
      channelId,
      priority: notification.type === "alerta" ? "high" : "default",
    }))

    // Enviar en lotes
    const batchSize = 100
    const errors: string[] = []
    let successCount = 0

    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize)
      try {
        const response = await sendExpoPushNotifications(batch)
        response.data.forEach((result) => {
          if (result.status === "ok") {
            successCount++
          } else {
            errors.push(result.message || "Error desconocido")
          }
        })
      } catch (error) {
        errors.push(`Error en lote: ${error}`)
      }
    }

    // Guardar registro
    await addDoc(collection(db, "notificaciones_push"), {
      titulo: notification.title,
      cuerpo: notification.body,
      tipo: notification.type,
      datos: notification.data,
      enviar_a_todos: notification.sendToAll || false,
      rutas_filtro: notification.routeIds || [],
      paradas_filtro: notification.stopIds || [],
      enviada: true,
      fecha_envio: new Date(),
      usuarios_alcanzados: successCount,
      createdAt: new Date(),
      createdBy,
    })

    return {
      success: errors.length === 0,
      count: successCount,
      errors,
    }
  } catch (error) {
    console.error("Error enviando notificación personalizada:", error)
    return {
      success: false,
      count: 0,
      errors: [String(error)],
    }
  }
}
