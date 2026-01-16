import { FileText, ArrowLeft, Download } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { promises as fs } from 'fs'
import path from 'path'

export const metadata = {
  title: "Esquema de Pruebas - TransiLoja",
  description: "Matriz completa de pruebas del proyecto TransiLoja",
}

async function getTestData() {
  const filePath = path.join(process.cwd(), 'public', 'anexos', 'Esquema-Pruebas.csv')
  const fileContents = await fs.readFile(filePath, 'utf8')

  const lines = fileContents.split('\n').filter(line => line.trim())
  const headers = lines[0].split(',')
  const rows = lines.slice(1).map(line => {
    // Simple CSV parsing (assumes no commas in values)
    const values = line.split(',')
    return headers.reduce((obj, header, index) => {
      obj[header.trim()] = values[index]?.trim() || ''
      return obj
    }, {} as Record<string, string>)
  })

  return { headers: headers.map(h => h.trim()), rows }
}

export default async function EsquemaPruebasPage() {
  const data = await getTestData()

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 opacity-75 blur-sm"></div>
                <div className="relative bg-white rounded-full p-2 shadow-lg">
                  <FileText className="h-6 w-6 text-indigo-500" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold">Esquema de Pruebas</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Matriz de Pruebas TransiLoja - {data.rows.length} pruebas registradas
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <a href="/anexos/Esquema-Pruebas.csv" download="Esquema-Pruebas-TransiLoja.csv">
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Descargar CSV
                </Button>
              </a>
              <Link href="/anexos">
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver a Anexos
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-950 dark:to-purple-950">
                <tr>
                  {data.headers.map((header, index) => (
                    <th
                      key={index}
                      className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 border-b-2 border-indigo-200 dark:border-indigo-700"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className="hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    {data.headers.map((header, colIndex) => (
                      <td
                        key={colIndex}
                        className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700"
                      >
                        {row[header]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total de Pruebas</div>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{data.rows.length}</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Pruebas Web</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {data.rows.filter(r => r.ID?.startsWith('WEB-')).length}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Pruebas Móvil</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {data.rows.filter(r => r.ID?.startsWith('MOB-')).length}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Plataformas</div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">2</div>
          </div>
        </div>
      </main>
    </div>
  )
}
