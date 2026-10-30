'use client'

export default function ProductionPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Produção</h1>
        <p className="text-gray-600">Gerencie a produção diária</p>
      </div>

      <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-200">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🍱</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Em Desenvolvimento</h3>
          <p className="text-gray-600">
            O módulo de produção está sendo desenvolvido e estará disponível em breve.
          </p>
        </div>
      </div>
    </div>
  )
}
