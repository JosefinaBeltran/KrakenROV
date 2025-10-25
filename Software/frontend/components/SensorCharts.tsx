'use client'

import React from 'react'

interface SensorDataPoint {
  timestamp: number
  value: number
}

interface SensorData {
  temperature: SensorDataPoint[]
  altitude: SensorDataPoint[]
  pressure?: SensorDataPoint[]
  humidity?: SensorDataPoint[]
  distance?: SensorDataPoint[]
}

interface SensorChartsProps {
  sensorData: SensorData
  inspectionStartTime: number
}

export const SensorCharts: React.FC<SensorChartsProps> = ({ sensorData, inspectionStartTime }) => {
  // Función para convertir timestamp a tiempo relativo en segundos
  const getRelativeTime = (timestamp: number) => {
    return Math.floor((timestamp - inspectionStartTime) / 1000)
  }

  // Función para generar datos del gráfico de temperatura
  const generateTemperatureChart = () => {
    if (sensorData.temperature.length === 0) return null

    const maxTime = Math.max(...sensorData.temperature.map(d => getRelativeTime(d.timestamp)))
    const minTime = Math.min(...sensorData.temperature.map(d => getRelativeTime(d.timestamp)))
    const timeRange = maxTime - minTime || 1

    const maxTemp = Math.max(...sensorData.temperature.map(d => d.value))
    const minTemp = Math.min(...sensorData.temperature.map(d => d.value))
    const tempRange = maxTemp - minTemp || 1

    const points = sensorData.temperature.map(d => {
      const x = ((getRelativeTime(d.timestamp) - minTime) / timeRange) * 100
      const y = 100 - (((d.value - minTemp) / tempRange) * 100)
      return `${x},${y}`
    }).join(' ')

    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Gráfico de Temperatura</h3>
        <div className="text-sm text-gray-600 mb-2">
          Rango: {minTemp.toFixed(1)}°C - {maxTemp.toFixed(1)}°C | 
          Tiempo: {minTime}s - {maxTime}s
        </div>
        <svg width="100%" height="200" className="border">
          <defs>
            <pattern id="tempGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" stroke="#e5e7eb" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#tempGrid)"/>
          <polyline
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            points={points}
          />
          {/* Eje Y - Temperatura */}
          <text x="5" y="15" fontSize="12" fill="#666">T°C</text>
          <text x="5" y="30" fontSize="10" fill="#666">{maxTemp.toFixed(1)}</text>
          <text x="5" y="190" fontSize="10" fill="#666">{minTemp.toFixed(1)}</text>
          {/* Eje X - Tiempo */}
          <text x="50%" y="195" fontSize="12" fill="#666" textAnchor="middle">Tiempo (s)</text>
        </svg>
      </div>
    )
  }

  // Función para generar datos del gráfico de altitud/profundidad
  const generateAltitudeChart = () => {
    if (sensorData.altitude.length === 0) return null

    const maxTime = Math.max(...sensorData.altitude.map(d => getRelativeTime(d.timestamp)))
    const minTime = Math.min(...sensorData.altitude.map(d => getRelativeTime(d.timestamp)))
    const timeRange = maxTime - minTime || 1

    // Convertir altitud a profundidad
    const depthData = sensorData.altitude.map(d => ({
      timestamp: d.timestamp,
      value: d.value < 0 ? Math.abs(d.value) : 0
    }))

    const maxDepth = Math.max(...depthData.map(d => d.value))
    const minDepth = Math.min(...depthData.map(d => d.value))
    const depthRange = maxDepth - minDepth || 1

    const points = depthData.map(d => {
      const x = ((getRelativeTime(d.timestamp) - minTime) / timeRange) * 100
      const y = 100 - (((d.value - minDepth) / depthRange) * 100)
      return `${x},${y}`
    }).join(' ')

    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Perfil de Inmersión (Profundidad)</h3>
        <div className="text-sm text-gray-600 mb-2">
          Profundidad máxima: {maxDepth.toFixed(1)}m | 
          Tiempo: {minTime}s - {maxTime}s
        </div>
        <svg width="100%" height="200" className="border">
          <defs>
            <pattern id="depthGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" stroke="#e5e7eb" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#depthGrid)"/>
          <polyline
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            points={points}
          />
          {/* Eje Y - Profundidad */}
          <text x="5" y="15" fontSize="12" fill="#666">Profundidad (m)</text>
          <text x="5" y="30" fontSize="10" fill="#666">{maxDepth.toFixed(1)}</text>
          <text x="5" y="190" fontSize="10" fill="#666">{minDepth.toFixed(1)}</text>
          {/* Eje X - Tiempo */}
          <text x="50%" y="195" fontSize="12" fill="#666" textAnchor="middle">Tiempo (s)</text>
        </svg>
      </div>
    )
  }

  // Función para generar datos del gráfico de presión (si está disponible)
  const generatePressureChart = () => {
    if (!sensorData.pressure || sensorData.pressure.length === 0) return null

    const maxTime = Math.max(...sensorData.pressure.map(d => getRelativeTime(d.timestamp)))
    const minTime = Math.min(...sensorData.pressure.map(d => getRelativeTime(d.timestamp)))
    const timeRange = maxTime - minTime || 1

    const maxPressure = Math.max(...sensorData.pressure.map(d => d.value))
    const minPressure = Math.min(...sensorData.pressure.map(d => d.value))
    const pressureRange = maxPressure - minPressure || 1

    const points = sensorData.pressure.map(d => {
      const x = ((getRelativeTime(d.timestamp) - minTime) / timeRange) * 100
      const y = 100 - (((d.value - minPressure) / pressureRange) * 100)
      return `${x},${y}`
    }).join(' ')

    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Gráfico de Presión</h3>
        <div className="text-sm text-gray-600 mb-2">
          Rango: {(minPressure/1000).toFixed(1)} - {(maxPressure/1000).toFixed(1)} kPa | 
          Tiempo: {minTime}s - {maxTime}s
        </div>
        <svg width="100%" height="200" className="border">
          <defs>
            <pattern id="pressureGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" stroke="#e5e7eb" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pressureGrid)"/>
          <polyline
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2"
            points={points}
          />
          {/* Eje Y - Presión */}
          <text x="5" y="15" fontSize="12" fill="#666">Presión (kPa)</text>
          <text x="5" y="30" fontSize="10" fill="#666">{(maxPressure/1000).toFixed(1)}</text>
          <text x="5" y="190" fontSize="10" fill="#666">{(minPressure/1000).toFixed(1)}</text>
          {/* Eje X - Tiempo */}
          <text x="50%" y="195" fontSize="12" fill="#666" textAnchor="middle">Tiempo (s)</text>
        </svg>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Datos de Sensores</h2>
      
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {generateTemperatureChart()}
        {generateAltitudeChart()}
        {generatePressureChart()}
      </div>
      
      {/* Resumen de datos */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Resumen de Datos</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium">Temperatura:</span>
            <div>{sensorData.temperature.length} puntos</div>
          </div>
          <div>
            <span className="font-medium">Altitud:</span>
            <div>{sensorData.altitude.length} puntos</div>
          </div>
          {sensorData.pressure && (
            <div>
              <span className="font-medium">Presión:</span>
              <div>{sensorData.pressure.length} puntos</div>
            </div>
          )}
          {sensorData.humidity && (
            <div>
              <span className="font-medium">Humedad:</span>
              <div>{sensorData.humidity.length} puntos</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SensorCharts
