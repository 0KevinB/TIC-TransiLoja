import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { collection, query, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useTheme } from '@/context/ThemeContext';
import { useTransport } from '@/context/TransportContext';
import { useOfflineServices } from '@/hooks/useOfflineServices';
import { ThemedView } from '@/components/ui/ThemedView';
import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedTextInput } from '@/components/ui/ThemedTextInput';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Calendario, CalendarioCategoria } from '@/lib/types';

export default function HorariosScreen() {
  const { theme } = useTheme();
  const { rutas } = useTransport();
  const { calendarios: offlineCalendarios, isOffline } = useOfflineServices();
  const router = useRouter();

  const [calendarios, setCalendarios] = useState<Calendario[]>([]);
  const [calendariosFiltrados, setCalendariosFiltrados] = useState<Calendario[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtroActivo, setFiltroActivo] = useState<'todos' | CalendarioCategoria>('todos');
  const [rutaSeleccionada, setRutaSeleccionada] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    cargarCalendarios();
  }, [offlineCalendarios, isOffline]);

  useEffect(() => {
    aplicarFiltros();
  }, [calendarios, filtroActivo, rutaSeleccionada, busqueda]);

  const cargarCalendarios = async () => {
    try {
      setLoading(true);

      // Si hay datos offline, usarlos primero
      if (offlineCalendarios.length > 0) {
        const calsOffline = offlineCalendarios.map(cal => {
          const calendario = { ...cal };
          if (calendario.routeId) {
            const ruta = rutas.find((r) => r.id === calendario.routeId);
            if (ruta) {
              calendario.routeName = ruta.nombre;
            }
          }
          return calendario;
        });
        setCalendarios(calsOffline);
        console.log('📱 Usando calendarios desde caché offline');
      }

      // Intentar actualizar desde Firebase si hay conexión
      if (!isOffline) {
        const calendariosRef = collection(db(), 'calendars');
        const q = query(calendariosRef);
        const querySnapshot = await getDocs(q);

        const cals: Calendario[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const calendario: Calendario = {
            id: doc.id,
            name: data.name || '',
            routeId: data.routeId || null,
            operatingStartTime: data.operatingStartTime || null,
            operatingEndTime: data.operatingEndTime || null,
            monday: data.monday || false,
            tuesday: data.tuesday || false,
            wednesday: data.wednesday || false,
            thursday: data.thursday || false,
            friday: data.friday || false,
            saturday: data.saturday || false,
            sunday: data.sunday || false,
            startDate: data.startDate instanceof Timestamp
              ? data.startDate.toDate()
              : new Date(data.startDate?._seconds * 1000 || Date.now()),
            endDate: data.endDate instanceof Timestamp
              ? data.endDate.toDate()
              : new Date(data.endDate?._seconds * 1000 || Date.now()),
            holidays: data.holidays || [],
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          };

          // Agregar nombre de ruta si existe
          if (calendario.routeId) {
            const ruta = rutas.find((r) => r.id === calendario.routeId);
            if (ruta) {
              calendario.routeName = ruta.nombre;
            }
          }

          cals.push(calendario);
        });

        setCalendarios(cals);
        console.log('🌐 Calendarios actualizados desde Firebase');
      }
    } catch (error) {
      console.error('Error cargando calendarios:', error);
      // Si falla Firebase pero hay datos offline, mantenerlos
      if (offlineCalendarios.length > 0) {
        console.log('⚠️ Error en Firebase, usando datos offline');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await cargarCalendarios();
    setRefreshing(false);
  };

  const determinarCategoria = (calendario: Calendario): CalendarioCategoria => {
    // Si tiene ruta específica
    if (calendario.routeId) {
      return 'ruta_especifica';
    }

    // Si tiene feriados definidos
    if (calendario.holidays && calendario.holidays.length > 0) {
      return 'feriados';
    }

    // Días laborables (L-V)
    if (
      calendario.monday &&
      calendario.tuesday &&
      calendario.wednesday &&
      calendario.thursday &&
      calendario.friday &&
      !calendario.saturday &&
      !calendario.sunday
    ) {
      return 'laborables';
    }

    // Fines de semana
    if (
      calendario.saturday &&
      calendario.sunday &&
      !calendario.monday &&
      !calendario.tuesday &&
      !calendario.wednesday &&
      !calendario.thursday &&
      !calendario.friday
    ) {
      return 'fines_semana';
    }

    return 'general';
  };

  const aplicarFiltros = () => {
    let filtrados = [...calendarios];

    // Filtro por categoría
    if (filtroActivo !== 'todos') {
      filtrados = filtrados.filter((cal) => determinarCategoria(cal) === filtroActivo);
    }

    // Filtro por ruta
    if (rutaSeleccionada) {
      filtrados = filtrados.filter((cal) => cal.routeId === rutaSeleccionada);
    }

    // Filtro por búsqueda
    if (busqueda.trim()) {
      const busquedaLower = busqueda.toLowerCase();
      filtrados = filtrados.filter(
        (cal) =>
          cal.name.toLowerCase().includes(busquedaLower) ||
          cal.routeName?.toLowerCase().includes(busquedaLower)
      );
    }

    setCalendariosFiltrados(filtrados);
  };

  const getDiasActivosTexto = (calendario: Calendario): string => {
    const dias: string[] = [];
    if (calendario.monday) dias.push('L');
    if (calendario.tuesday) dias.push('M');
    if (calendario.wednesday) dias.push('X');
    if (calendario.thursday) dias.push('J');
    if (calendario.friday) dias.push('V');
    if (calendario.saturday) dias.push('S');
    if (calendario.sunday) dias.push('D');
    return dias.join(', ');
  };

  const getIconoCategoria = (categoria: CalendarioCategoria): string => {
    switch (categoria) {
      case 'laborables':
        return 'briefcase';
      case 'fines_semana':
        return 'sunny';
      case 'feriados':
        return 'gift';
      case 'ruta_especifica':
        return 'route';
      case 'especial':
        return 'star';
      default:
        return 'calendar';
    }
  };

  const getColorCategoria = (categoria: CalendarioCategoria): string => {
    switch (categoria) {
      case 'laborables':
        return '#3B82F6';
      case 'fines_semana':
        return '#F59E0B';
      case 'feriados':
        return '#EF4444';
      case 'ruta_especifica':
        return theme.colors.primary;
      case 'especial':
        return '#8B5CF6';
      default:
        return theme.colors.textSecondary;
    }
  };

  const getTextoCategoria = (categoria: CalendarioCategoria): string => {
    switch (categoria) {
      case 'laborables':
        return 'Días laborables';
      case 'fines_semana':
        return 'Fines de semana';
      case 'feriados':
        return 'Feriados';
      case 'ruta_especifica':
        return 'Ruta específica';
      case 'especial':
        return 'Especial';
      default:
        return 'General';
    }
  };

  const filtros: Array<{ id: 'todos' | CalendarioCategoria; label: string }> = [
    { id: 'todos', label: 'Todos' },
    { id: 'laborables', label: 'Laborables' },
    { id: 'fines_semana', label: 'Fines de semana' },
    { id: 'ruta_especifica', label: 'Por ruta' },
    { id: 'feriados', label: 'Feriados' },
  ];

  return (
    <ThemedView style={styles.container} backgroundColor="background">
      {/* Header con navegación */}
      <ThemedView style={styles.header}>
        <ThemedView style={styles.headerTop}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Icon name="arrow-back" library="ionicons" color="text" size="md" />
          </TouchableOpacity>

          <ThemedView style={styles.headerTitleContainer}>
            <ThemedText variant="subtitle" weight="bold">
              Horarios de Operación
            </ThemedText>
            <ThemedText variant="caption" color="textSecondary">
              Consulta los horarios del sistema
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>

      {/* Buscador */}
      <ThemedView style={styles.searchContainer}>
        <ThemedTextInput
          value={busqueda}
          onChangeText={setBusqueda}
          placeholder="Buscar horario o ruta..."
          style={styles.searchInput}
          leftIcon="search"
        />
      </ThemedView>

      {/* Filtros */}
      <ThemedView style={styles.filtrosWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtrosContainer}
        >
          {filtros.map((filtro) => (
            <TouchableOpacity
              key={filtro.id}
              style={[
                styles.filtroChip,
                {
                  backgroundColor:
                    filtroActivo === filtro.id ? theme.colors.primary : theme.colors.surface,
                  borderColor: filtroActivo === filtro.id ? theme.colors.primary : theme.colors.border,
                },
              ]}
              onPress={() => setFiltroActivo(filtro.id)}
            >
              <ThemedText
                variant="body"
                color={filtroActivo === filtro.id ? 'background' : 'text'}
                weight={filtroActivo === filtro.id ? 'semibold' : 'medium'}
              >
                {filtro.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ThemedView>

      {/* Lista de calendarios */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading && !refreshing ? (
          <ThemedView style={styles.emptyState}>
            <Icon name="time-outline" library="ionicons" color="textSecondary" size="xl2" />
            <ThemedText
              variant="subtitle"
              color="textSecondary"
              weight="bold"
              style={styles.emptyTitle}
            >
              Cargando horarios...
            </ThemedText>
            <ThemedText variant="body" color="textSecondary" style={styles.emptyText}>
              Estamos obteniendo la información de los horarios
            </ThemedText>
          </ThemedView>
        ) : calendariosFiltrados.length === 0 ? (
          <ThemedView style={styles.emptyState}>
            <Icon name="calendar-outline" library="ionicons" color="textSecondary" size="xl2" />
            <ThemedText
              variant="subtitle"
              color="textSecondary"
              weight="bold"
              style={styles.emptyTitle}
            >
              {busqueda ? 'Sin resultados' : 'No hay horarios'}
            </ThemedText>
            <ThemedText variant="body" color="textSecondary" style={styles.emptyText}>
              {busqueda
                ? `No encontramos horarios que coincidan con "${busqueda}"`
                : 'Intenta ajustar los filtros de búsqueda'}
            </ThemedText>
          </ThemedView>
        ) : (
          <ThemedView style={styles.calendariosLista}>
            <ThemedText variant="body" color="textSecondary" style={styles.resultsCount}>
              {calendariosFiltrados.length} horario{calendariosFiltrados.length !== 1 ? 's' : ''}{' '}
              encontrado{calendariosFiltrados.length !== 1 ? 's' : ''}
            </ThemedText>
            {
          calendariosFiltrados.map((calendario) => {
            const categoria = determinarCategoria(calendario);
            const colorCategoria = getColorCategoria(categoria);
            const iconoCategoria = getIconoCategoria(categoria);

            return (
              <Card
                key={calendario.id}
                variant="outlined"
                padding="md"
                style={styles.calendarioCard}
              >
                {/* Header del calendario */}
                <ThemedView style={styles.calendarioHeader}>
                  <ThemedView style={[styles.categoriaIcono, { backgroundColor: colorCategoria + '20' }]}>
                    <Icon name={iconoCategoria} library="ionicons" size={24} color={colorCategoria} />
                  </ThemedView>
                  <ThemedView style={styles.calendarioTitleContainer}>
                    <ThemedText variant="body" weight="semibold" style={styles.calendarioTitulo}>
                      {calendario.name}
                    </ThemedText>
                    <ThemedText variant="caption" style={[styles.calendarioCategoria, { color: colorCategoria }]}>
                      {getTextoCategoria(categoria)}
                    </ThemedText>
                  </ThemedView>
                </ThemedView>

                {/* Ruta específica si existe */}
                {calendario.routeName && (
                  <ThemedView style={[styles.rutaBadge, { backgroundColor: theme.colors.primary + '20' }]}>
                    <Icon name="route" library="ionicons" size={16} color={theme.colors.primary} />
                    <ThemedText variant="caption" weight="semibold" style={[styles.rutaTexto, { color: theme.colors.primary }]}>
                      {calendario.routeName}
                    </ThemedText>
                  </ThemedView>
                )}

                {/* Horario de operación */}
                {calendario.operatingStartTime && calendario.operatingEndTime && (
                  <ThemedView style={styles.horarioContainer}>
                    <Icon name="time-outline" library="ionicons" size={18} color={theme.colors.textSecondary} />
                    <ThemedText variant="body" style={styles.horarioTexto}>
                      {calendario.operatingStartTime} - {calendario.operatingEndTime}
                    </ThemedText>
                  </ThemedView>
                )}

                {/* Días activos */}
                <ThemedView style={styles.diasContainer}>
                  <Icon name="calendar-outline" library="ionicons" size={18} color={theme.colors.textSecondary} />
                  <ThemedText variant="body" style={styles.diasTexto}>
                    {getDiasActivosTexto(calendario)}
                  </ThemedText>
                </ThemedView>

                {/* Vigencia */}
                <ThemedView style={styles.vigenciaContainer}>
                  <Icon name="information-circle-outline" library="ionicons" size={18} color={theme.colors.textSecondary} />
                  <ThemedText variant="caption" color="textSecondary" style={styles.vigenciaTexto}>
                    Vigente desde{' '}
                    {new Date(calendario.startDate).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </ThemedText>
                </ThemedView>

                {/* Feriados si existen */}
                {calendario.holidays.length > 0 && (
                  <ThemedView style={[styles.feriadosBadge, { backgroundColor: '#FEE2E2' }]}>
                    <Icon name="gift-outline" library="ionicons" size={16} color="#EF4444" />
                    <ThemedText variant="caption" weight="semibold" style={[styles.feriadosTexto, { color: '#EF4444' }]}>
                      {calendario.holidays.length} {calendario.holidays.length === 1 ? 'feriado' : 'feriados'}
                    </ThemedText>
                  </ThemedView>
                )}
              </Card>
            );
          })}
          </ThemedView>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  headerTitleContainer: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchInput: {
    backgroundColor: '#F9FAFB',
  },
  filtrosWrapper: {
    paddingBottom: 12,
  },
  filtrosContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filtroChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  resultsCount: {
    marginBottom: 12,
    marginLeft: 4,
    fontSize: 14,
  },
  calendariosLista: {
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    lineHeight: 20,
  },
  calendarioCard: {
    borderRadius: 12,
  },
  calendarioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  categoriaIcono: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarioTitleContainer: {
    flex: 1,
  },
  calendarioTitulo: {
    fontSize: 15,
    marginBottom: 2,
  },
  calendarioCategoria: {
    fontSize: 13,
  },
  rutaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  rutaTexto: {
    fontSize: 13,
  },
  horarioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  horarioTexto: {
    fontSize: 14,
  },
  diasContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  diasTexto: {
    fontSize: 14,
  },
  vigenciaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vigenciaTexto: {
    fontSize: 13,
  },
  feriadosBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  feriadosTexto: {
    fontSize: 13,
  },
});
