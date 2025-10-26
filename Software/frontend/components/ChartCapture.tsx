'use client'

import React, { useRef, useEffect, useState } from 'react'

interface ChartCaptureProps {
  temperatureData: number[]
  altitudeData: number[]
  inspectionStartTime: number
  onChartCaptured: (chartImages: { temperature: string, depth: string }) => void
}

export const ChartCapture = React.forwardRef<{ captureCharts: () => void }, ChartCaptureProps>(({
  temperatureData,
  altitudeData,
  inspectionStartTime,
  onChartCaptured
}, ref) => {
  const tempCanvasRef = useRef<HTMLCanvasElement>(null)
  const depthCanvasRef = useRef<HTMLCanvasElement>(null)
  const [isCaptured, setIsCaptured] = useState(false)

  // Función para generar el gráfico de temperatura
  const generateTemperatureChart = (canvas: HTMLCanvasElement, data: number[]) => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const padding = 40

    // Limpiar canvas
    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)

    if (data.length === 0) {
      console.log('No hay datos de temperatura para generar gráfico')
      return
    }

    // Calcular escalas
    const maxTemp = Math.max(...data)
    const minTemp = Math.min(...data)
    const tempRange = maxTemp - minTemp || 1

    const chartWidth = width - 2 * padding
    const chartHeight = height - 2 * padding

    // Dibujar grid
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1
    for (let i = 0; i <= 10; i++) {
      const x = padding + (i / 10) * chartWidth
      const y = padding + (i / 10) * chartHeight
      
      // Líneas verticales
      ctx.beginPath()
      ctx.moveTo(x, padding)
      ctx.lineTo(x, height - padding)
      ctx.stroke()
      
      // Líneas horizontales
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(width - padding, y)
      ctx.stroke()
    }

    // Dibujar línea de temperatura
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 2
    ctx.beginPath()

    data.forEach((value, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth
      const y = height - padding - ((value - minTemp) / tempRange) * chartHeight
      
      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()

    // Dibujar puntos
    ctx.fillStyle = '#3b82f6'
    data.forEach((value, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth
      const y = height - padding - ((value - minTemp) / tempRange) * chartHeight
      
      ctx.beginPath()
      ctx.arc(x, y, 3, 0, 2 * Math.PI)
      ctx.fill()
    })

    // Etiquetas
    ctx.fillStyle = '#374151'
    ctx.font = '12px Arial'
    ctx.textAlign = 'center'
    
    // Título
    ctx.font = 'bold 16px Arial'
    ctx.fillText('Gráfico de Temperatura', width / 2, 20)
    
    // Eje Y
    ctx.font = '12px Arial'
    ctx.textAlign = 'right'
    ctx.fillText(`${maxTemp.toFixed(1)}°C`, padding - 10, padding + 5)
    ctx.fillText(`${minTemp.toFixed(1)}°C`, padding - 10, height - padding + 5)
    
    // Eje X
    ctx.textAlign = 'center'
    ctx.fillText('Tiempo (s)', width / 2, height - 5)
  }

  // Función para generar el gráfico de profundidad
  const generateDepthChart = (canvas: HTMLCanvasElement, data: number[]) => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const padding = 40

    // Limpiar canvas
    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)

    if (data.length === 0) {
      console.log('No hay datos de altitud para generar gráfico')
      return
    }

    // Convertir altitud a profundidad
    const depthData = data.map(altitude => altitude < 0 ? Math.abs(altitude) : 0)

    // Calcular escalas
    const maxDepth = Math.max(...depthData)
    const minDepth = Math.min(...depthData)
    const depthRange = maxDepth - minDepth || 1

    const chartWidth = width - 2 * padding
    const chartHeight = height - 2 * padding

    // Dibujar grid
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1
    for (let i = 0; i <= 10; i++) {
      const x = padding + (i / 10) * chartWidth
      const y = padding + (i / 10) * chartHeight
      
      // Líneas verticales
      ctx.beginPath()
      ctx.moveTo(x, padding)
      ctx.lineTo(x, height - padding)
      ctx.stroke()
      
      // Líneas horizontales
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(width - padding, y)
      ctx.stroke()
    }

    // Dibujar línea de profundidad
    ctx.strokeStyle = '#10b981'
    ctx.lineWidth = 2
    ctx.beginPath()

    depthData.forEach((value, index) => {
      const x = padding + (index / (depthData.length - 1)) * chartWidth
      const y = height - padding - ((value - minDepth) / depthRange) * chartHeight
      
      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()

    // Dibujar puntos
    ctx.fillStyle = '#10b981'
    depthData.forEach((value, index) => {
      const x = padding + (index / (depthData.length - 1)) * chartWidth
      const y = height - padding - ((value - minDepth) / depthRange) * chartHeight
      
      ctx.beginPath()
      ctx.arc(x, y, 3, 0, 2 * Math.PI)
      ctx.fill()
    })

    // Etiquetas
    ctx.fillStyle = '#374151'
    ctx.font = '12px Arial'
    ctx.textAlign = 'center'
    
    // Título
    ctx.font = 'bold 16px Arial'
    ctx.fillText('Perfil de Inmersión (Profundidad)', width / 2, 20)
    
    // Eje Y
    ctx.font = '12px Arial'
    ctx.textAlign = 'right'
    ctx.fillText(`${maxDepth.toFixed(1)}m`, padding - 10, padding + 5)
    ctx.fillText(`${minDepth.toFixed(1)}m`, padding - 10, height - padding + 5)
    
    // Eje X
    ctx.textAlign = 'center'
    ctx.fillText('Tiempo (s)', width / 2, height - 5)
  }

  // Generar gráficos cuando cambien los datos
  useEffect(() => {
    if (tempCanvasRef.current && temperatureData.length > 0) {
      generateTemperatureChart(tempCanvasRef.current, temperatureData)
    }
  }, [temperatureData])

  useEffect(() => {
    if (depthCanvasRef.current && altitudeData.length > 0) {
      generateDepthChart(depthCanvasRef.current, altitudeData)
    }
  }, [altitudeData])

  // Función para capturar los gráficos
  const captureCharts = () => {
    console.log('captureCharts llamada')
    console.log('tempCanvasRef.current:', tempCanvasRef.current)
    console.log('depthCanvasRef.current:', depthCanvasRef.current)
    console.log('temperatureData length:', temperatureData.length)
    console.log('altitudeData length:', altitudeData.length)
    
    if (!tempCanvasRef.current || !depthCanvasRef.current) {
      console.log('Canvas no encontrado, no se pueden capturar los gráficos')
      return
    }

    // Generar gráficos antes de capturar
    if (temperatureData.length > 0) {
      generateTemperatureChart(tempCanvasRef.current, temperatureData)
    } else {
      generateEmptyChart(tempCanvasRef.current, 'Sin datos de temperatura')
    }

    if (altitudeData.length > 0) {
      generateDepthChart(depthCanvasRef.current, altitudeData)
    } else {
      generateEmptyChart(depthCanvasRef.current, 'Sin datos de altitud')
    }

    const temperatureImage = tempCanvasRef.current.toDataURL('image/png')
    const depthImage = depthCanvasRef.current.toDataURL('image/png')

    console.log('Gráficos capturados:', {
      temperatureLength: temperatureImage.length,
      depthLength: depthImage.length
    })

    onChartCaptured({
      temperature: temperatureImage,
      depth: depthImage
    })

    setIsCaptured(true)
  }

  // Función para generar gráfico vacío
  const generateEmptyChart = (canvas: HTMLCanvasElement, message: string) => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    // Limpiar canvas
    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)

    // Dibujar mensaje
    ctx.fillStyle = '#666666'
    ctx.font = 'bold 16px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(message, width / 2, height / 2)
  }

  // Exponer la función captureCharts a través del ref
  React.useImperativeHandle(ref, () => ({
    captureCharts: async () => {
      return new Promise<{temperature: string, depth: string}>((resolve) => {
        console.log('captureCharts llamada desde ref')
        console.log('tempCanvasRef.current:', tempCanvasRef.current)
        console.log('depthCanvasRef.current:', depthCanvasRef.current)
        console.log('temperatureData length:', temperatureData.length)
        console.log('altitudeData length:', altitudeData.length)
        
        if (!tempCanvasRef.current || !depthCanvasRef.current) {
          console.log('Canvas no encontrado, no se pueden capturar los gráficos')
          resolve({
            temperature: '',
            depth: ''
          })
          return
        }

        // Generar gráficos antes de capturar
        if (temperatureData.length > 0) {
          generateTemperatureChart(tempCanvasRef.current, temperatureData)
        } else {
          generateEmptyChart(tempCanvasRef.current, 'Sin datos de temperatura')
        }

        if (altitudeData.length > 0) {
          generateDepthChart(depthCanvasRef.current, altitudeData)
        } else {
          generateEmptyChart(depthCanvasRef.current, 'Sin datos de altitud')
        }

        const temperatureImage = tempCanvasRef.current.toDataURL('image/png')
        const depthImage = depthCanvasRef.current.toDataURL('image/png')

        console.log('Gráficos capturados:', {
          temperatureLength: temperatureImage.length,
          depthLength: depthImage.length
        })

        onChartCaptured({
          temperature: temperatureImage,
          depth: depthImage
        })

        resolve({
          temperature: temperatureImage,
          depth: depthImage
        })

        setIsCaptured(true)
      })
    }
  }))

  return (
    <div className="hidden">
      <canvas
        ref={tempCanvasRef}
        width={400}
        height={300}
      />
      <canvas
        ref={depthCanvasRef}
        width={400}
        height={300}
      />
    </div>
  )
})

ChartCapture.displayName = 'ChartCapture'

export default ChartCapture
