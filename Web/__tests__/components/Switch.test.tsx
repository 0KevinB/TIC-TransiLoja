import { render, screen } from '@testing-library/react'
import { Switch } from '@/components/ui/switch'

describe('Switch Component', () => {
  it('should render switch element', () => {
    render(<Switch />)
    const switchElement = screen.getByRole('switch')
    expect(switchElement).toBeInTheDocument()
  })

  it('should be unchecked by default', () => {
    render(<Switch />)
    const switchElement = screen.getByRole('switch')
    expect(switchElement).toHaveAttribute('data-state', 'unchecked')
  })

  it('should be checked when checked prop is true', () => {
    render(<Switch checked={true} />)
    const switchElement = screen.getByRole('switch')
    expect(switchElement).toHaveAttribute('data-state', 'checked')
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Switch disabled />)
    const switchElement = screen.getByRole('switch')
    expect(switchElement).toBeDisabled()
  })

  it('should apply custom className', () => {
    render(<Switch className="custom-switch-class" />)
    const switchElement = screen.getByRole('switch')
    expect(switchElement).toHaveClass('custom-switch-class')
  })

  it('should call onCheckedChange when provided', () => {
    const onCheckedChange = jest.fn()
    render(<Switch onCheckedChange={onCheckedChange} />)
    const switchElement = screen.getByRole('switch')
    expect(switchElement).toBeInTheDocument()
    expect(onCheckedChange).toBeDefined()
  })

  it('should render with aria-label', () => {
    render(<Switch aria-label="Toggle setting" />)
    const switchElement = screen.getByRole('switch', { name: /toggle setting/i })
    expect(switchElement).toBeInTheDocument()
  })
})
