/**
 * Calendar Service (GTFS)
 *
 * Servicio para gestión de calendarios de servicio.
 */

import { where } from "firebase/firestore"
import { BaseService } from "../base-service"
import { GTFSCalendar, GTFSCalendarSchema, gtfsDateToDate } from "@/lib/schemas/gtfs/calendar"

class CalendarService extends BaseService<GTFSCalendar> {
  constructor() {
    super("gtfs_calendar", GTFSCalendarSchema)
  }

  /**
   * Obtener calendario por service_id
   */
  async getByServiceId(serviceId: string): Promise<GTFSCalendar | null> {
    const calendars = await this.query(where("service_id", "==", serviceId))
    return calendars[0] || null
  }

  /**
   * Obtener calendarios activos en una fecha específica
   */
  async getActiveOn(date: Date): Promise<GTFSCalendar[]> {
    const allCalendars = await this.getAll()
    const dateStr = this.dateToGTFSDate(date)

    return allCalendars.filter((calendar) => {
      return calendar.start_date <= dateStr && calendar.end_date >= dateStr
    })
  }

  /**
   * Verificar si un servicio opera en un día de la semana
   */
  isActiveOnWeekday(
    calendar: GTFSCalendar,
    weekday: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday"
  ): boolean {
    return calendar[weekday] === "1"
  }

  /**
   * Verificar si un servicio opera en una fecha específica
   */
  isActiveOnDate(calendar: GTFSCalendar, date: Date): boolean {
    const dateStr = this.dateToGTFSDate(date)

    // Verificar rango de fechas
    if (dateStr < calendar.start_date || dateStr > calendar.end_date) {
      return false
    }

    // Verificar día de la semana
    const dayOfWeek = date.getDay()
    const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
    const weekday = weekdays[dayOfWeek] as keyof GTFSCalendar

    return calendar[weekday] === "1"
  }

  /**
   * Obtener calendarios que operan en lunes a viernes
   */
  async getWeekdayCalendars(): Promise<GTFSCalendar[]> {
    const allCalendars = await this.getAll()

    return allCalendars.filter(
      (calendar) =>
        calendar.monday === "1" &&
        calendar.tuesday === "1" &&
        calendar.wednesday === "1" &&
        calendar.thursday === "1" &&
        calendar.friday === "1" &&
        calendar.saturday === "0" &&
        calendar.sunday === "0"
    )
  }

  /**
   * Obtener calendarios que operan en fines de semana
   */
  async getWeekendCalendars(): Promise<GTFSCalendar[]> {
    const allCalendars = await this.getAll()

    return allCalendars.filter(
      (calendar) => calendar.saturday === "1" || calendar.sunday === "1"
    )
  }

  /**
   * Convertir Date a formato GTFS
   */
  private dateToGTFSDate(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}${month}${day}`
  }
}

// Exportar instancia singleton
export const calendarService = new CalendarService()
