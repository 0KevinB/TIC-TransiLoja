import { NextRequest, NextResponse } from "next/server"

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"

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

/**
 * API Route para enviar notificaciones push a través de Expo
 * Esta ruta actúa como proxy para evitar problemas de CORS
 */
export async function POST(request: NextRequest) {
  try {
    const messages: ExpoPushMessage[] = await request.json()

    // Validar que el payload sea un array de mensajes
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Se requiere un array de mensajes" },
        { status: 400 }
      )
    }

    // Validar que cada mensaje tenga los campos requeridos
    for (const message of messages) {
      if (!message.to || !message.title || !message.body) {
        return NextResponse.json(
          { error: "Cada mensaje debe tener 'to', 'title' y 'body'" },
          { status: 400 }
        )
      }
    }

    // Enviar a Expo Push Notification Service
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
      const errorText = await response.text()
      console.error("Error de Expo Push Service:", errorText)
      return NextResponse.json(
        { error: `Error del servicio de Expo: ${response.status}`, details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error en API de notificaciones:", error)
    return NextResponse.json(
      { error: "Error interno del servidor", details: String(error) },
      { status: 500 }
    )
  }
}
