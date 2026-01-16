import type { Parada, Ruta, Bus, SegmentoViaje, RutaOptima } from './types';
import { googleMapsService } from './googleMaps';

interface EstadoRAPTOR {
  parada_id: string;
  tiempo_llegada: number;
  ruta_tomada?: string;
  parada_anterior?: string;
  numero_transferencias: number;
  estado_previo?: EstadoRAPTOR;  // Referencia al estado previo para reconstruir la ruta
}

interface GrafoTransporte {
  paradas: Map<string, any>;
  rutas: Map<string, any>;
  buses: Map<string, any>;
  paradasPorRuta: Map<string, string[]>;
  rutasPorParada: Map<string, string[]>;
}

class RAPTORAlgorithm {
  private grafo: GrafoTransporte;
  private velocidadCaminata = 1.4; // m/s (5 km/h)
  private tiempoEsperaPromedio = 300; // 5 minutos en segundos
  private maxTransferencias = 3;
  private maxDistanciaCaminata = 800; // metros - reducido para priorizar transporte público
  private maxDistanciaCaminataInicioFin = 400; // metros - máximo para caminar al inicio/fin

  constructor(paradas: any[], rutas: any[], buses: any[]) {
    this.grafo = this.construirGrafo(paradas, rutas, buses);
  }

  private construirGrafo(paradas: any[], rutas: any[], buses: any[]): GrafoTransporte {
    const paradasMap = new Map<string, any>();
    const rutasMap = new Map<string, any>();
    const busesMap = new Map<string, any>();
    const paradasPorRuta = new Map<string, string[]>();
    const rutasPorParada = new Map<string, string[]>();

    // Construyendo grafo RAPTOR

    // Construir mapas básicos
    paradas.forEach(parada => {
      const id = parada.id_parada || parada.id;
      paradasMap.set(id, parada);
    });

    rutas.forEach(ruta => {
      const id = ruta.id_ruta || ruta.id;
      rutasMap.set(id, ruta);
    });

    buses.forEach(bus => {
      const id = bus.id || bus.id_bus;
      busesMap.set(id, bus);
    });

    // Construir índices de relaciones
    rutas.forEach(ruta => {
      const rutaId = ruta.id_ruta || ruta.id;
      const stopIds = ruta.stopIds || ruta.paradas || [];

      // Procesar paradas de la ruta

      if (stopIds.length > 0) {
        paradasPorRuta.set(rutaId, stopIds);

        stopIds.forEach((paradaId: string) => {
          if (!rutasPorParada.has(paradaId)) {
            rutasPorParada.set(paradaId, []);
          }
          rutasPorParada.get(paradaId)!.push(rutaId);
        });
      }
    });

    // Grafo construido

    return {
      paradas: paradasMap,
      rutas: rutasMap,
      buses: busesMap,
      paradasPorRuta,
      rutasPorParada,
    };
  }

  private calcularDistancia(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  private obtenerParadasCercanas(lat: number, lng: number): string[] {
    const paradasCercanas: { id: string; distancia: number; numRutas: number }[] = [];

    this.grafo.paradas.forEach((parada, id) => {
      const paradaLat = parada.coordenadas?.lat || parada.ubicacion?.latitud || parada.lat || 0;
      const paradaLng = parada.coordenadas?.lng || parada.ubicacion?.longitud || parada.lng || 0;

      if (!paradaLat || !paradaLng) return;

      const distancia = this.calcularDistancia(
        lat, lng,
        paradaLat,
        paradaLng
      );

      if (distancia <= this.maxDistanciaCaminata) {
        const rutas = this.grafo.rutasPorParada.get(id) || [];
        paradasCercanas.push({ id, distancia, numRutas: rutas.length });
      }
    });

    // Filtrar solo paradas que tienen rutas asignadas
    const paradasConRutas = paradasCercanas.filter(p => p.numRutas > 0);

    // PRIORIZAR PARADAS CERCANAS - ordenar estrictamente por distancia
    // Pero asegurar diversidad de rutas
    const rutasYaIncluidas = new Set<string>();
    const resultado: string[] = [];

    // Ordenar por distancia
    const paradasOrdenadas = paradasConRutas.sort((a, b) => a.distancia - b.distancia);

    // Primera pasada: agregar las 3 paradas MÁS CERCANAS sin importar rutas
    for (let i = 0; i < Math.min(3, paradasOrdenadas.length); i++) {
      const parada = paradasOrdenadas[i];
      resultado.push(parada.id);
      const rutasDeParada = this.grafo.rutasPorParada.get(parada.id) || [];
      rutasDeParada.forEach(r => rutasYaIncluidas.add(r));
    }

    // Segunda pasada: agregar paradas con rutas diferentes
    for (const parada of paradasOrdenadas) {
      if (resultado.includes(parada.id)) continue; // Ya está incluida

      const rutasDeParada = this.grafo.rutasPorParada.get(parada.id) || [];
      const tieneRutaNueva = rutasDeParada.some(rutaId => !rutasYaIncluidas.has(rutaId));

      // Agregar si tiene ruta nueva Y está dentro del rango razonable
      if (tieneRutaNueva && parada.distancia <= this.maxDistanciaCaminataInicioFin * 1.5) {
        resultado.push(parada.id);
        rutasDeParada.forEach(r => rutasYaIncluidas.add(r));
      }

      if (resultado.length >= 10) break; // Límite reducido para enfocarse en las más cercanas
    }

    return resultado;
  }

  private calcularTiempoCaminata(distancia: number): number {
    return Math.round(distancia / this.velocidadCaminata);
  }

  private obtenerTiempoViaje(rutaId: string, paradaOrigen: string, paradaDestino: string): number {
    // Calcular el tiempo siguiendo el recorrido real de la ruta
    const ruta = this.grafo.rutas.get(rutaId);
    if (!ruta) return Infinity;

    const paradas = ruta.stopIds || ruta.paradas || [];
    const indiceOrigen = paradas.indexOf(paradaOrigen);
    const indiceDestino = paradas.indexOf(paradaDestino);

    if (indiceOrigen === -1 || indiceDestino === -1 || indiceDestino <= indiceOrigen) {
      return Infinity;
    }

    // Velocidad promedio del bus en ciudad: 25 km/h = 6.94 m/s
    const velocidadBus = 6.94; // m/s
    let distanciaTotal = 0;

    // Calcular la distancia REAL siguiendo el recorrido de la ruta
    // Sumando las distancias entre paradas consecutivas
    for (let i = indiceOrigen; i < indiceDestino; i++) {
      const paradaActualId = paradas[i];
      const paradaSiguienteId = paradas[i + 1];

      const paradaActual = this.grafo.paradas.get(paradaActualId);
      const paradaSiguiente = this.grafo.paradas.get(paradaSiguienteId);

      if (!paradaActual || !paradaSiguiente) {
        // Si falta alguna parada, usar fallback de 2 minutos por segmento
        distanciaTotal += velocidadBus * 120; // distancia equivalente a 2 minutos
        continue;
      }

      const lat1 = paradaActual.coordenadas?.lat || paradaActual.ubicacion?.latitud || paradaActual.lat || 0;
      const lng1 = paradaActual.coordenadas?.lng || paradaActual.ubicacion?.longitud || paradaActual.lng || 0;
      const lat2 = paradaSiguiente.coordenadas?.lat || paradaSiguiente.ubicacion?.latitud || paradaSiguiente.lat || 0;
      const lng2 = paradaSiguiente.coordenadas?.lng || paradaSiguiente.ubicacion?.longitud || paradaSiguiente.lng || 0;

      if (!lat1 || !lng1 || !lat2 || !lng2) {
        // Si faltan coordenadas, usar fallback
        distanciaTotal += velocidadBus * 120;
        continue;
      }

      // Calcular distancia entre paradas consecutivas
      const distanciaSegmento = this.calcularDistancia(lat1, lng1, lat2, lng2);
      distanciaTotal += distanciaSegmento;
    }

    // Calcular tiempo de viaje basado en la distancia total del recorrido
    const tiempoViaje = Math.round(distanciaTotal / velocidadBus);

    // Agregar tiempo de paradas intermedias (30 segundos por parada)
    const numeroParadas = indiceDestino - indiceOrigen;
    const tiempoParadas = Math.max(0, numeroParadas - 1) * 30;

    return tiempoViaje + tiempoParadas + this.tiempoEsperaPromedio;
  }

  public encontrarRutaOptima(
    origenLat: number,
    origenLng: number,
    destinoLat: number,
    destinoLng: number,
    horaInicio: Date = new Date()
  ): RutaOptima[] {
    // Búsqueda de ruta óptima

    const tiempoInicio = Math.floor(horaInicio.getTime() / 1000);

    // Obtener paradas cercanas al origen y destino
    const paradasOrigen = this.obtenerParadasCercanas(origenLat, origenLng);
    const paradasDestino = this.obtenerParadasCercanas(destinoLat, destinoLng);

    if (paradasOrigen.length === 0) {
      return [];
    }

    if (paradasDestino.length === 0) {
      return [];
    }

    // 🔍 DIAGNÓSTICO: Analizar paradas y rutas disponibles
    console.log(`\n🔍 DIAGNÓSTICO DE CONEXIONES:`);
    console.log(`   Paradas origen: ${paradasOrigen.length}`);
    console.log(`   Paradas destino: ${paradasDestino.length}`);

    const rutasEnOrigen = new Set<string>();
    paradasOrigen.forEach(paradaId => {
      const rutas = this.grafo.rutasPorParada.get(paradaId) || [];
      const parada = this.grafo.paradas.get(paradaId);
      const paradaLat = parada?.coordenadas?.lat || parada?.ubicacion?.latitud || parada?.lat || 0;
      const paradaLng = parada?.coordenadas?.lng || parada?.ubicacion?.longitud || parada?.lng || 0;
      const distancia = this.calcularDistancia(origenLat, origenLng, paradaLat, paradaLng);

      console.log(`   Origen: ${paradaId} - ${Math.round(distancia)}m - ${rutas.length} rutas`);
      rutas.forEach(rutaId => {
        const ruta = this.grafo.rutas.get(rutaId);
        console.log(`      → ${ruta?.nombre || ruta?.numero || rutaId}`);
        rutasEnOrigen.add(rutaId);
      });
    });

    const rutasEnDestino = new Set<string>();
    paradasDestino.forEach(paradaId => {
      const rutas = this.grafo.rutasPorParada.get(paradaId) || [];
      const parada = this.grafo.paradas.get(paradaId);
      const paradaLat = parada?.coordenadas?.lat || parada?.ubicacion?.latitud || parada?.lat || 0;
      const paradaLng = parada?.coordenadas?.lng || parada?.ubicacion?.longitud || parada?.lng || 0;
      const distancia = this.calcularDistancia(destinoLat, destinoLng, paradaLat, paradaLng);

      console.log(`   Destino: ${paradaId} - ${Math.round(distancia)}m - ${rutas.length} rutas`);
      rutas.forEach(rutaId => {
        const ruta = this.grafo.rutas.get(rutaId);
        console.log(`      → ${ruta?.nombre || ruta?.numero || rutaId}`);
        rutasEnDestino.add(rutaId);
      });
    });

    const rutasCompartidas = Array.from(rutasEnOrigen).filter(rutaId => rutasEnDestino.has(rutaId));

    if (rutasCompartidas.length > 0) {
      console.log(`\n✅ RUTAS DIRECTAS DISPONIBLES: ${rutasCompartidas.length}`);
      rutasCompartidas.forEach(rutaId => {
        const ruta = this.grafo.rutas.get(rutaId);
        console.log(`   - ${ruta?.nombre || ruta?.numero || rutaId}`);
      });
    } else {
      console.log(`\n⚠️ NO HAY RUTAS DIRECTAS - Se requiere transbordo`);
      console.log(`   Rutas en origen: ${Array.from(rutasEnOrigen).map(id => {
        const r = this.grafo.rutas.get(id);
        return r?.nombre || r?.numero || id;
      }).join(', ')}`);
      console.log(`   Rutas en destino: ${Array.from(rutasEnDestino).map(id => {
        const r = this.grafo.rutas.get(id);
        return r?.nombre || r?.numero || id;
      }).join(', ')}`);
    }

    const mejoresRutas: RutaOptima[] = [];

    // Aplicar RAPTOR para cada combinación de paradas origen-destino
    paradasOrigen.forEach((paradaOrigenId) => {
      paradasDestino.forEach((paradaDestinoId) => {
        const ruta = this.ejecutarRAPTOR(
          origenLat, origenLng, paradaOrigenId,
          destinoLat, destinoLng, paradaDestinoId,
          tiempoInicio
        );
        if (ruta) {
          mejoresRutas.push(ruta);
        }
      });
    });

    // 🔍 DIAGNÓSTICO: Mostrar rutas encontradas
    console.log(`\n📊 RUTAS ENCONTRADAS: ${mejoresRutas.length}`);
    mejoresRutas.forEach((ruta, index) => {
      console.log(`   ${index + 1}. ${ruta.numero_transbordos} transbordos, ${Math.round(ruta.tiempo_total_seg / 60)} min`);
    });

    // FILTRAR rutas que no tienen sentido (demasiada caminata, poco transporte)
    const rutasValidas = mejoresRutas.filter(ruta => {
      // Calcular distancia total de caminata y distancia en bus
      let distanciaCaminata = 0;
      let distanciaBus = 0;
      let tiempoBus = 0;

      ruta.segmentos.forEach(segmento => {
        if (segmento.tipo === 'caminar' && segmento.distancia_metros) {
          distanciaCaminata += segmento.distancia_metros;
        } else if (segmento.tipo === 'autobus' && segmento.duracion_seg) {
          tiempoBus += segmento.duracion_seg;
          // Estimar distancia en bus basado en tiempo (velocidad promedio 25 km/h = 6.94 m/s)
          distanciaBus += segmento.duracion_seg * 6.94;
        }
      });

      // Criterios de validación:
      // 1. Debe haber al menos un segmento de bus
      const tieneSegmentoBus = ruta.segmentos.some(s => s.tipo === 'autobus');
      if (!tieneSegmentoBus) return false;

      // 2. El tiempo en bus debe ser significativo (al menos 5 minutos)
      // Recordar: 3 minutos de parada a parada
      const TIEMPO_BUS_MINIMO = 300; // 5 minutos en segundos (al menos 2 paradas)
      if (tiempoBus < TIEMPO_BUS_MINIMO) return false;

      // 3. La distancia en bus debe ser SIGNIFICATIVAMENTE mayor que la distancia caminando
      // Ratio mínimo: el bus debe recorrer al menos 2x la distancia de caminata
      const RATIO_MINIMO_BUS_CAMINATA = 2.0;
      if (distanciaBus < distanciaCaminata * RATIO_MINIMO_BUS_CAMINATA) return false;

      // 4. Limitar la caminata total a un máximo razonable
      const MAX_CAMINATA_TOTAL = 600; // 600 metros máximo de caminata total
      if (distanciaCaminata > MAX_CAMINATA_TOTAL) return false;

      return true;
    });

    console.log(`\n🚫 RUTAS FILTRADAS: ${mejoresRutas.length - rutasValidas.length} rutas descartadas por uso insuficiente de transporte`);

    // Ordenar priorizando TIEMPO TOTAL y USO DE TRANSPORTE PÚBLICO
    const PENALIZACION_TRANSBORDO = 4 * 60; // 4 minutos en segundos (reducido porque preferimos transbordos a caminar)
    const PENALIZACION_CAMINATA_BASE = 3; // Factor multiplicador para toda caminata
    const PENALIZACION_CAMINATA_EXCESIVA = 5; // Factor multiplicador para caminata excesiva

    const rutasOrdenadas = rutasValidas.sort((a, b) => {
      // Calcular métricas de uso de transporte
      const calcularMetricas = (ruta: RutaOptima) => {
        let distanciaCaminata = 0;
        let tiempoBus = 0;
        let numeroParadasBus = 0;

        ruta.segmentos.forEach(segmento => {
          if (segmento.tipo === 'caminar' && segmento.distancia_metros) {
            distanciaCaminata += segmento.distancia_metros;
          } else if (segmento.tipo === 'autobus' && segmento.duracion_seg) {
            tiempoBus += segmento.duracion_seg;
            numeroParadasBus++;
          }
        });

        return { distanciaCaminata, tiempoBus, numeroParadasBus };
      };

      const metricasA = calcularMetricas(a);
      const metricasB = calcularMetricas(b);

      // Penalización base por TODA la caminata (favorece usar más transporte)
      const tiempoCaminataA = metricasA.distanciaCaminata / this.velocidadCaminata;
      const tiempoCaminataB = metricasB.distanciaCaminata / this.velocidadCaminata;
      const penalizacionCaminataBaseA = tiempoCaminataA * PENALIZACION_CAMINATA_BASE;
      const penalizacionCaminataBaseB = tiempoCaminataB * PENALIZACION_CAMINATA_BASE;

      // Penalización adicional por caminata excesiva (más de 400m)
      const UMBRAL_CAMINATA_EXCESIVA = 400;
      const penalizacionCaminataExcesivaA = metricasA.distanciaCaminata > UMBRAL_CAMINATA_EXCESIVA
        ? (metricasA.distanciaCaminata - UMBRAL_CAMINATA_EXCESIVA) / this.velocidadCaminata * PENALIZACION_CAMINATA_EXCESIVA
        : 0;
      const penalizacionCaminataExcesivaB = metricasB.distanciaCaminata > UMBRAL_CAMINATA_EXCESIVA
        ? (metricasB.distanciaCaminata - UMBRAL_CAMINATA_EXCESIVA) / this.velocidadCaminata * PENALIZACION_CAMINATA_EXCESIVA
        : 0;

      // Bonus por usar más el transporte público (más paradas = mejor)
      const bonusTransporteA = metricasA.numeroParadasBus * 60; // 1 minuto de bonus por cada segmento de bus
      const bonusTransporteB = metricasB.numeroParadasBus * 60;

      // Calcular tiempo efectivo
      const tiempoEfectivoA = a.tiempo_total_seg
        + (a.numero_transbordos * PENALIZACION_TRANSBORDO)
        + penalizacionCaminataBaseA
        + penalizacionCaminataExcesivaA
        - bonusTransporteA;

      const tiempoEfectivoB = b.tiempo_total_seg
        + (b.numero_transbordos * PENALIZACION_TRANSBORDO)
        + penalizacionCaminataBaseB
        + penalizacionCaminataExcesivaB
        - bonusTransporteB;

      return tiempoEfectivoA - tiempoEfectivoB;
    });

    if (rutasOrdenadas.length > 0) {
      const mejorRuta = rutasOrdenadas[0];
      const tiempoEfectivo = mejorRuta.tiempo_total_seg + (mejorRuta.numero_transbordos * PENALIZACION_TRANSBORDO);
      console.log(`\n✅ MEJOR RUTA: ${mejorRuta.numero_transbordos} transbordos, ${Math.round(mejorRuta.tiempo_total_seg / 60)} min (efectivo: ${Math.round(tiempoEfectivo / 60)} min)\n`);
    }

    return rutasOrdenadas.slice(0, 3); // Retornar las 3 mejores opciones
  }

  private ejecutarRAPTOR(
    origenLat: number, origenLng: number, paradaOrigenId: string,
    destinoLat: number, destinoLng: number, paradaDestinoId: string,
    tiempoInicio: number
  ): RutaOptima | null {
    // Estados por ronda (transferencia)
    const estados: Map<string, EstadoRAPTOR>[] = [];

    // Inicialización
    estados[0] = new Map();

    // Caminata inicial al transporte público
    const paradaOrigen = this.grafo.paradas.get(paradaOrigenId);
    if (!paradaOrigen) {
      return null;
    }

    const paradaOrigenLat = paradaOrigen.coordenadas?.lat || paradaOrigen.ubicacion?.latitud || paradaOrigen.lat || 0;
    const paradaOrigenLng = paradaOrigen.coordenadas?.lng || paradaOrigen.ubicacion?.longitud || paradaOrigen.lng || 0;

    const distanciaCaminataInicial = this.calcularDistancia(
      origenLat, origenLng,
      paradaOrigenLat,
      paradaOrigenLng
    );

    const tiempoCaminataInicial = this.calcularTiempoCaminata(distanciaCaminataInicial);

    estados[0].set(paradaOrigenId, {
      parada_id: paradaOrigenId,
      tiempo_llegada: tiempoInicio + tiempoCaminataInicial,
      numero_transferencias: 0,
    });

    // Ejecutar rondas RAPTOR
    for (let ronda = 0; ronda <= this.maxTransferencias; ronda++) {
      if (!estados[ronda]) break;

      estados[ronda + 1] = new Map(estados[ronda]);

      // Marcar rutas para escanear
      const rutasParaEscanear = new Set<string>();
      estados[ronda].forEach((estado) => {
        const rutasParada = this.grafo.rutasPorParada.get(estado.parada_id) || [];
        rutasParada.forEach(rutaId => rutasParaEscanear.add(rutaId));
      });

      // Escanear cada ruta marcada
      rutasParaEscanear.forEach(rutaId => {
        this.escanearRuta(rutaId, estados[ronda], estados[ronda + 1], ronda);
      });

      // 🚶 Después de escanear rutas, considerar TRANSBORDOS A PIE
      // Solo aplicar transferencias a pie si ya tomamos al menos un bus (ronda > 0)
      if (ronda > 0) {
        this.aplicarTransferenciasPie(estados[ronda + 1], ronda);
      }

      // Si no hay mejoras, terminar
      if (estados[ronda + 1].size === estados[ronda].size) {
        break;
      }
    }

    // Encontrar la mejor ruta al destino
    let mejorEstado: EstadoRAPTOR | null = null;

    estados.forEach((estadosRonda) => {
      const estadoDestino = estadosRonda.get(paradaDestinoId);
      if (estadoDestino) {
        if (!mejorEstado || estadoDestino.tiempo_llegada < mejorEstado.tiempo_llegada) {
          mejorEstado = estadoDestino;
        }
      }
    });

    if (!mejorEstado) {
      return null;
    }

    // Reconstruir la ruta
    return this.reconstruirRuta(
      origenLat, origenLng, destinoLat, destinoLng,
      paradaOrigenId, paradaDestinoId,
      mejorEstado, tiempoInicio
    );
  }

  private escanearRuta(
    rutaId: string,
    estadosEntrada: Map<string, EstadoRAPTOR>,
    estadosSalida: Map<string, EstadoRAPTOR>,
    ronda: number
  ): void {
    const paradas = this.grafo.paradasPorRuta.get(rutaId);
    if (!paradas) return;

    const ruta = this.grafo.rutas.get(rutaId);
    const nombreRuta = ruta?.nombre || ruta?.numero || rutaId;

    let mejorTiempoSubida = Infinity;
    let indiceSubida = -1;
    let paradasAgregadas = 0;

    // Escanear paradas en orden - UN SOLO PASS por la ruta
    for (let i = 0; i < paradas.length; i++) {
      const paradaId = paradas[i];

      // Verificar si podemos subir aquí (mejorar el tiempo de subida)
      const estadoParada = estadosEntrada.get(paradaId);
      if (estadoParada && estadoParada.tiempo_llegada < mejorTiempoSubida) {
        mejorTiempoSubida = estadoParada.tiempo_llegada;
        indiceSubida = i;
      }

      // Si ya tenemos una parada de subida válida, verificar si podemos bajar aquí
      // IMPORTANTE: Solo considerar paradas DESPUÉS de la parada de subida
      if (indiceSubida >= 0 && i > indiceSubida) {
        const paradaSubida = paradas[indiceSubida];
        const tiempoViaje = this.obtenerTiempoViaje(rutaId, paradaSubida, paradaId);
        const tiempoLlegada = mejorTiempoSubida + tiempoViaje;

        const estadoActual = estadosSalida.get(paradaId);
        if (!estadoActual || tiempoLlegada < estadoActual.tiempo_llegada) {
          const estadoSubida = estadosEntrada.get(paradaSubida);
          if (estadoSubida) {
            estadosSalida.set(paradaId, {
              parada_id: paradaId,
              tiempo_llegada: tiempoLlegada,
              ruta_tomada: rutaId,
              parada_anterior: paradaSubida,
              numero_transferencias: ronda,
              estado_previo: estadoSubida,
            });
          }
          paradasAgregadas++;
        }
      }
    }

    // Escaneo completado
  }

  /**
   * Aplicar transferencias a pie: permitir caminar entre paradas cercanas
   * Esto permite transbordos donde bajas de una ruta y caminas a otra parada
   */
  private aplicarTransferenciasPie(
    estados: Map<string, EstadoRAPTOR>,
    ronda: number
  ): void {
    const MAX_DISTANCIA_TRANSBORDO = 500; // 500 metros máximo para transbordo a pie
    const nuevosEstados: Array<{ paradaId: string; estado: EstadoRAPTOR }> = [];

    // Para cada parada alcanzada en esta ronda
    estados.forEach((estadoActual, paradaActualId) => {
      // IMPORTANTE: Solo aplicar transferencias si llegamos en bus (tiene ruta_tomada)
      // Esto evita caminar desde la parada inicial de origen
      if (!estadoActual.ruta_tomada) return;

      const paradaActual = this.grafo.paradas.get(paradaActualId);
      if (!paradaActual) return;

      const latActual = paradaActual.coordenadas?.lat || paradaActual.ubicacion?.latitud || paradaActual.lat || 0;
      const lngActual = paradaActual.coordenadas?.lng || paradaActual.ubicacion?.longitud || paradaActual.lng || 0;

      // Buscar paradas cercanas a las que podemos caminar
      this.grafo.paradas.forEach((paradaCercana, paradaCercanaId) => {
        // No caminar a la misma parada
        if (paradaCercanaId === paradaActualId) return;

        // Verificar que la parada cercana tenga rutas diferentes
        const rutasCercanas = this.grafo.rutasPorParada.get(paradaCercanaId) || [];
        if (rutasCercanas.length === 0) return;

        // No caminar a paradas de la misma ruta que acabamos de tomar
        if (estadoActual.ruta_tomada && rutasCercanas.includes(estadoActual.ruta_tomada)) return;

        const latCercana = paradaCercana.coordenadas?.lat || paradaCercana.ubicacion?.latitud || paradaCercana.lat || 0;
        const lngCercana = paradaCercana.coordenadas?.lng || paradaCercana.ubicacion?.longitud || paradaCercana.lng || 0;

        const distancia = this.calcularDistancia(latActual, lngActual, latCercana, lngCercana);

        // Si está dentro del rango de caminata para transbordo
        if (distancia <= MAX_DISTANCIA_TRANSBORDO) {
          const tiempoCaminata = this.calcularTiempoCaminata(distancia);
          const nuevoTiempo = estadoActual.tiempo_llegada + tiempoCaminata;

          // Si mejora el tiempo de llegada a esta parada
          const estadoExistente = estados.get(paradaCercanaId);
          if (!estadoExistente || nuevoTiempo < estadoExistente.tiempo_llegada) {
            nuevosEstados.push({
              paradaId: paradaCercanaId,
              estado: {
                parada_id: paradaCercanaId,
                tiempo_llegada: nuevoTiempo,
                numero_transferencias: estadoActual.numero_transferencias,
                parada_anterior: paradaActualId,
                estado_previo: estadoActual,
              }
            });
          }
        }
      });
    });

    // Aplicar los nuevos estados
    nuevosEstados.forEach(({ paradaId, estado }) => {
      estados.set(paradaId, estado);
    });
  }

  private reconstruirRuta(
    origenLat: number, origenLng: number,
    destinoLat: number, destinoLng: number,
    paradaOrigenId: string, paradaDestinoId: string,
    estadoFinal: EstadoRAPTOR,
    tiempoInicio: number
  ): RutaOptima {
    const segmentos: SegmentoViaje[] = [];
    let distanciaTotal = 0;

    // Reconstruir la cadena de estados desde el final hasta el inicio
    const cadenaEstados: EstadoRAPTOR[] = [];
    let estadoActual: EstadoRAPTOR | undefined = estadoFinal;

    while (estadoActual) {
      cadenaEstados.unshift(estadoActual);
      estadoActual = estadoActual.estado_previo;
    }

    // DEBUG: Mostrar cadena de estados
    console.log('\n🔗 CADENA DE ESTADOS:');
    cadenaEstados.forEach((estado, index) => {
      console.log(`  ${index}. Parada: ${estado.parada_id}, Ruta: ${estado.ruta_tomada || 'CAMINATA'}, Desde: ${estado.parada_anterior || 'N/A'}`);
    });

    // Segmento inicial: caminata al transporte público
    const paradaOrigen = this.grafo.paradas.get(paradaOrigenId)!;
    const paradaOrigenLat = paradaOrigen.coordenadas?.lat || paradaOrigen.ubicacion?.latitud || paradaOrigen.lat || 0;
    const paradaOrigenLng = paradaOrigen.coordenadas?.lng || paradaOrigen.ubicacion?.longitud || paradaOrigen.lng || 0;

    const distanciaCaminataInicial = this.calcularDistancia(
      origenLat, origenLng,
      paradaOrigenLat,
      paradaOrigenLng
    );

    const tiempoFinCaminataInicial = tiempoInicio + this.calcularTiempoCaminata(distanciaCaminataInicial);

    segmentos.push({
      tipo: 'caminar',
      desde: 'origen',
      hasta: paradaOrigenId,
      tiempo_inicio: tiempoInicio,
      tiempo_fin: tiempoFinCaminataInicial,
      duracion_seg: this.calcularTiempoCaminata(distanciaCaminataInicial),
      distancia_metros: distanciaCaminataInicial,
      instrucciones: `Caminar ${Math.round(distanciaCaminataInicial)}m hasta ${paradaOrigen.nombre || paradaOrigen.name}`,
    });

    distanciaTotal += distanciaCaminataInicial;

    // Reconstruir cada segmento de transporte en la cadena
    let rutaAnterior: string | undefined = undefined;

    for (let i = 1; i < cadenaEstados.length; i++) {
      const estadoPrevio = cadenaEstados[i - 1];
      const estadoSiguiente = cadenaEstados[i];

      // Caso 1: Hay un viaje en bus (tiene ruta_tomada)
      if (estadoSiguiente.ruta_tomada && estadoSiguiente.parada_anterior) {
        const ruta = this.grafo.rutas.get(estadoSiguiente.ruta_tomada);
        const paradaSubida = this.grafo.paradas.get(estadoSiguiente.parada_anterior);
        const paradaBajada = this.grafo.paradas.get(estadoSiguiente.parada_id);

        if (ruta && paradaSubida && paradaBajada) {
          // Calcular tiempos
          let tiempoInicioBus = estadoPrevio.tiempo_llegada;

          // Si es el primer segmento de bus, agregar tiempo de espera
          if (!rutaAnterior) {
            tiempoInicioBus += this.tiempoEsperaPromedio;
          }

          segmentos.push({
            tipo: 'autobus',
            desde: estadoSiguiente.parada_anterior,
            hasta: estadoSiguiente.parada_id,
            id_ruta: estadoSiguiente.ruta_tomada,
            tiempo_inicio: tiempoInicioBus,
            tiempo_fin: estadoSiguiente.tiempo_llegada,
            duracion_seg: estadoSiguiente.tiempo_llegada - tiempoInicioBus,
            instrucciones: `Tomar ${ruta.nombre || ruta.name || ruta.numero || 'Bus'} desde ${paradaSubida.nombre || paradaSubida.name} hasta ${paradaBajada.nombre || paradaBajada.name}`,
          });

          rutaAnterior = estadoSiguiente.ruta_tomada;
        }
      }
      // Caso 2: Hay caminata entre paradas (transferencia a pie)
      else if (!estadoSiguiente.ruta_tomada && estadoSiguiente.parada_anterior) {
        const paradaOrigen = this.grafo.paradas.get(estadoSiguiente.parada_anterior);
        const paradaDestino = this.grafo.paradas.get(estadoSiguiente.parada_id);

        if (paradaOrigen && paradaDestino) {
          const latOrigen = paradaOrigen.coordenadas?.lat || paradaOrigen.ubicacion?.latitud || paradaOrigen.lat || 0;
          const lngOrigen = paradaOrigen.coordenadas?.lng || paradaOrigen.ubicacion?.longitud || paradaOrigen.lng || 0;
          const latDestino = paradaDestino.coordenadas?.lat || paradaDestino.ubicacion?.latitud || paradaDestino.lat || 0;
          const lngDestino = paradaDestino.coordenadas?.lng || paradaDestino.ubicacion?.longitud || paradaDestino.lng || 0;

          const distanciaCaminata = this.calcularDistancia(latOrigen, lngOrigen, latDestino, lngDestino);

          segmentos.push({
            tipo: 'caminar',
            desde: estadoSiguiente.parada_anterior,
            hasta: estadoSiguiente.parada_id,
            tiempo_inicio: estadoPrevio.tiempo_llegada,
            tiempo_fin: estadoSiguiente.tiempo_llegada,
            duracion_seg: estadoSiguiente.tiempo_llegada - estadoPrevio.tiempo_llegada,
            distancia_metros: distanciaCaminata,
            instrucciones: `Caminar ${Math.round(distanciaCaminata)}m desde ${paradaOrigen.nombre || paradaOrigen.name} hasta ${paradaDestino.nombre || paradaDestino.name}`,
          });
        }
      }
    }

    // Segmento final: caminata desde el transporte público
    const paradaFinal = this.grafo.paradas.get(paradaDestinoId)!;
    const paradaFinalLat = paradaFinal.coordenadas?.lat || paradaFinal.ubicacion?.latitud || paradaFinal.lat || 0;
    const paradaFinalLng = paradaFinal.coordenadas?.lng || paradaFinal.ubicacion?.longitud || paradaFinal.lng || 0;

    const distanciaCaminataFinal = this.calcularDistancia(
      paradaFinalLat,
      paradaFinalLng,
      destinoLat, destinoLng
    );

    const tiempoFinCaminataFinal = estadoFinal.tiempo_llegada + this.calcularTiempoCaminata(distanciaCaminataFinal);

    segmentos.push({
      tipo: 'caminar',
      desde: paradaDestinoId,
      hasta: 'destino',
      tiempo_inicio: estadoFinal.tiempo_llegada,
      tiempo_fin: tiempoFinCaminataFinal,
      duracion_seg: this.calcularTiempoCaminata(distanciaCaminataFinal),
      distancia_metros: distanciaCaminataFinal,
      instrucciones: `Caminar ${Math.round(distanciaCaminataFinal)}m hasta el destino`,
    });

    distanciaTotal += distanciaCaminataFinal;

    const tiempoFinal = estadoFinal.tiempo_llegada + this.calcularTiempoCaminata(distanciaCaminataFinal);

    // Calcular el número REAL de transbordos (cambios de bus)
    // Un transbordo = cambio de una ruta a otra
    let numeroTransbordos = 0;
    let rutaActual: string | undefined = undefined;

    segmentos.forEach(segmento => {
      if (segmento.tipo === 'autobus' && segmento.id_ruta) {
        if (rutaActual && rutaActual !== segmento.id_ruta) {
          // Cambio de ruta = transbordo
          numeroTransbordos++;
        }
        rutaActual = segmento.id_ruta;
      }
    });

    return {
      origen: paradaOrigenId,
      destino: paradaDestinoId,
      tiempo_total_seg: tiempoFinal - tiempoInicio,
      numero_transbordos: numeroTransbordos,
      segmentos,
      distancia_caminata: distanciaTotal,
    };
  }
}

export { RAPTORAlgorithm };
export default RAPTORAlgorithm;