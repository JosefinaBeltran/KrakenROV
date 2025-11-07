'use client'

import React from 'react'

interface SensorChartsProps {
  sensorCharts: {
    temperature: string
    depth: string
  }
}

export const SensorCharts: React.FC<SensorChartsProps> = ({ sensorCharts }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold mb-4">Gráficos de Sensores</h3>
      
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {/* Gráfico de Temperatura */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-base font-semibold mb-4" style={{ color: '#141B1F' }}>Gráfico de Temperatura</h3>
          <img 
            src={sensorCharts.temperature} 
            alt="Gráfico de Temperatura" 
            className="w-full h-auto border rounded"
          />
        </div>

        {/* Gráfico de Profundidad */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-base font-semibold mb-4" style={{ color: '#141B1F' }}>Perfil de Inmersión (Profundidad)</h3>
          <img 
            src={sensorCharts.depth} 
            alt="Perfil de Inmersión" 
            className="w-full h-auto border rounded"
          />
        </div>
      </div>
    </div>
  )
}

export default SensorCharts
