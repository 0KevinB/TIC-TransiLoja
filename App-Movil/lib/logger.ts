/**
 * Utilidad de logging optimizada para desarrollo y producción
 * En producción, solo se loguean errores y warnings críticos
 * En desarrollo, se loguea todo con formato mejorado
 */

const IS_DEV = __DEV__;
const IS_PRODUCTION = !IS_DEV;

// Niveles de log
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

// Configuración de qué niveles se muestran en producción
const PRODUCTION_LOG_LEVELS = new Set([LogLevel.WARN, LogLevel.ERROR]);

class Logger {
  /**
   * Log de depuración (solo en desarrollo)
   */
  debug(message: string, ...args: any[]) {
    if (IS_DEV) {
      console.log(`🐛 [DEBUG] ${message}`, ...args);
    }
  }

  /**
   * Log informativo (solo en desarrollo)
   */
  info(message: string, ...args: any[]) {
    if (IS_DEV) {
      console.log(`ℹ️ [INFO] ${message}`, ...args);
    }
  }

  /**
   * Log de advertencia (desarrollo y producción)
   */
  warn(message: string, ...args: any[]) {
    if (IS_DEV || PRODUCTION_LOG_LEVELS.has(LogLevel.WARN)) {
      console.warn(`⚠️ [WARN] ${message}`, ...args);
    }
  }

  /**
   * Log de error (siempre)
   */
  error(message: string, error?: any, ...args: any[]) {
    console.error(`❌ [ERROR] ${message}`, error, ...args);
  }

  /**
   * Log de éxito (solo en desarrollo)
   */
  success(message: string, ...args: any[]) {
    if (IS_DEV) {
      console.log(`✅ [SUCCESS] ${message}`, ...args);
    }
  }

  /**
   * Log de inicio de proceso (solo en desarrollo)
   */
  start(message: string, ...args: any[]) {
    if (IS_DEV) {
      console.log(`🚀 [START] ${message}`, ...args);
    }
  }

  /**
   * Log de finalización de proceso (solo en desarrollo)
   */
  end(message: string, ...args: any[]) {
    if (IS_DEV) {
      console.log(`🏁 [END] ${message}`, ...args);
    }
  }

  /**
   * Log con grupo colapsable (solo en desarrollo)
   */
  group(title: string, callback: () => void) {
    if (IS_DEV) {
      console.group(`📦 ${title}`);
      callback();
      console.groupEnd();
    }
  }

  /**
   * Medir tiempo de ejecución (solo en desarrollo)
   */
  time(label: string) {
    if (IS_DEV) {
      console.time(`⏱️ ${label}`);
    }
  }

  timeEnd(label: string) {
    if (IS_DEV) {
      console.timeEnd(`⏱️ ${label}`);
    }
  }

  /**
   * Log tabla (solo en desarrollo)
   */
  table(data: any) {
    if (IS_DEV && console.table) {
      console.table(data);
    }
  }
}

// Exportar instancia singleton
export const logger = new Logger();

// Exportar métodos como funciones standalone para compatibilidad
export const debug = logger.debug.bind(logger);
export const info = logger.info.bind(logger);
export const warn = logger.warn.bind(logger);
export const error = logger.error.bind(logger);
export const success = logger.success.bind(logger);
