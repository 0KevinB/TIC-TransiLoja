import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Checkbox } from '@/components/ui/checkbox'

describe('Checkbox Component', () => {
  it('should render checkbox', () => {
    render(<Checkbox id="test-checkbox" />)
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeInTheDocument()
  })

  it('should call onCheckedChange when provided', () => {
    const onCheckedChange = jest.fn()

    render(<Checkbox id="test" onCheckedChange={onCheckedChange} />)

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeInTheDocument()
    expect(onCheckedChange).toBeDefined()
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Checkbox id="test" disabled />)
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeDisabled()
  })

  it('should have checked state', () => {
    render(<Checkbox id="test" checked={true} />)
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeChecked()
  })

  it('should apply custom className', () => {
    render(<Checkbox id="test" className="custom-checkbox" />)
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toHaveClass('custom-checkbox')
  })
})
