import { render, screen } from '@testing-library/react'
import { Label } from '@/components/ui/label'

describe('Label Component', () => {
  it('should render label with text', () => {
    render(<Label>Test Label</Label>)
    expect(screen.getByText('Test Label')).toBeInTheDocument()
  })

  it('should associate with input via htmlFor', () => {
    render(
      <>
        <Label htmlFor="test-input">Email</Label>
        <input id="test-input" />
      </>
    )

    const label = screen.getByText('Email')
    expect(label).toHaveAttribute('for', 'test-input')
  })

  it('should apply custom className', () => {
    render(<Label className="custom-label">Label</Label>)
    const label = screen.getByText('Label')
    expect(label).toHaveClass('custom-label')
  })
})
