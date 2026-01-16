import { render, screen } from '@testing-library/react'
import { Textarea } from '@/components/ui/textarea'

describe('Textarea Component', () => {
  it('should render textarea element', () => {
    render(<Textarea placeholder="Enter your message" />)
    expect(screen.getByPlaceholderText('Enter your message')).toBeInTheDocument()
  })

  it('should handle user input', () => {
    render(<Textarea placeholder="Type here" />)
    const textarea = screen.getByPlaceholderText('Type here') as HTMLTextAreaElement

    textarea.value = 'Hello World\nMultiline text'
    expect(textarea.value).toBe('Hello World\nMultiline text')
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Textarea disabled placeholder="Disabled textarea" />)
    const textarea = screen.getByPlaceholderText('Disabled textarea')
    expect(textarea).toBeDisabled()
  })

  it('should apply custom className', () => {
    render(<Textarea className="custom-textarea" placeholder="Custom" />)
    const textarea = screen.getByPlaceholderText('Custom')
    expect(textarea).toHaveClass('custom-textarea')
  })

  it('should support rows prop', () => {
    render(<Textarea rows={5} placeholder="Five rows" />)
    const textarea = screen.getByPlaceholderText('Five rows')
    expect(textarea).toHaveAttribute('rows', '5')
  })

  it('should support maxLength prop', () => {
    render(<Textarea maxLength={100} placeholder="Max 100 chars" />)
    const textarea = screen.getByPlaceholderText('Max 100 chars')
    expect(textarea).toHaveAttribute('maxLength', '100')
  })

  it('should render with default value', () => {
    render(<Textarea defaultValue="Initial text" placeholder="Placeholder" />)
    const textarea = screen.getByDisplayValue('Initial text') as HTMLTextAreaElement
    expect(textarea.value).toBe('Initial text')
  })

  it('should be read-only when readOnly prop is true', () => {
    render(<Textarea readOnly placeholder="Read only" />)
    const textarea = screen.getByPlaceholderText('Read only')
    expect(textarea).toHaveAttribute('readonly')
  })
})
