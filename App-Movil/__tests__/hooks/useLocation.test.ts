import { renderHook, waitFor } from '@testing-library/react-native'
import { useLocation } from '@/hooks/useLocation'
import * as Location from 'expo-location'

jest.mock('expo-location')

describe('useLocation Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should request location permissions on mount', async () => {
    const { result } = renderHook(() => useLocation())

    await waitFor(() => {
      expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalled()
    })
  })

  it('should get current location when permission granted', async () => {
    ;(Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    })

    const { result } = renderHook(() => useLocation())

    await waitFor(() => {
      expect(result.current.location).toBeDefined()
      expect(result.current.location?.coords.latitude).toBe(-3.99313)
      expect(result.current.location?.coords.longitude).toBe(-79.20422)
    })
  })

  it('should handle permission denied', async () => {
    ;(Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'denied',
    })

    const { result } = renderHook(() => useLocation())

    await waitFor(() => {
      expect(result.current.location).toBeNull()
      expect(result.current.error).toBe('Location permission denied')
    })
  })

  it('should handle location errors', async () => {
    ;(Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    })
    ;(Location.getCurrentPositionAsync as jest.Mock).mockRejectedValue(
      new Error('Location unavailable')
    )

    const { result } = renderHook(() => useLocation())

    await waitFor(() => {
      expect(result.current.error).toBe('Location unavailable')
    })
  })

  it('should update loading state correctly', async () => {
    const { result } = renderHook(() => useLocation())

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
  })
})
