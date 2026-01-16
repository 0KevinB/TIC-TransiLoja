import { render, screen } from '@testing-library/react'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'

describe('Table Component', () => {
  it('renders table with headers and data', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Código</TableHead>
            <TableHead>Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Parada Central</TableCell>
            <TableCell>PC001</TableCell>
            <TableCell>Activa</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Terminal</TableCell>
            <TableCell>TT001</TableCell>
            <TableCell>Activa</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )

    expect(screen.getByText('Nombre')).toBeInTheDocument()
    expect(screen.getByText('Código')).toBeInTheDocument()
    expect(screen.getByText('Estado')).toBeInTheDocument()
    expect(screen.getByText('Parada Central')).toBeInTheDocument()
    expect(screen.getByText('PC001')).toBeInTheDocument()
    expect(screen.getByText('Terminal')).toBeInTheDocument()
  })

  it('renders empty table', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Columna</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell colSpan={1}>No hay datos disponibles</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )

    expect(screen.getByText('Columna')).toBeInTheDocument()
    expect(screen.getByText('No hay datos disponibles')).toBeInTheDocument()
  })
})
