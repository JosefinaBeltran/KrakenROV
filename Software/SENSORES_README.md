# Sistema de Sensores KrakenROV

## Descripción
El sistema de sensores KrakenROV ahora puede detectar y mostrar una amplia gama de datos del Arduino, incluyendo datos ambientales, de movimiento y de detección de obstáculos.

## Datos Detectados

### Datos Básicos
- **Temperatura**: Temperatura del sensor BMP180 (°C)
- **Humedad**: Nivel de humedad relativa (%)
- **Distancia**: Distancia medida por el sensor ultrasónico (cm)
- **Motor**: Estado del motor (ON/OFF)

### Datos Ambientales
- **Nivel de Sonido**: Intensidad del sonido detectado (dB)
- **Altitud**: Altura sobre el nivel del mar (metros)
- **Presión**: Presión atmosférica (Pa)
- **Obstáculos**: Estado de detección de obstáculos (Sí/No)

### Datos de Movimiento
- **Aceleración X, Y, Z**: Aceleración en los tres ejes (m/s²)
- **Rotación X, Y, Z**: Velocidad angular en los tres ejes (rad/s)

## Formato de Datos del Arduino

El Arduino debe enviar los datos en el siguiente formato:

```
Nivel de sonido: 66
Temperatura (BMP180): 26.00 *C
Altitud: 408.04 metros
Aceleracion X:  9.99 m/s^2
Aceleracion Y:  -0.03 m/s^2
Aceleracion Z: 0.12 m/s^2
Rotacion X:  -0.03 rad/s
Rotacion Y:  -0.00 rad/s
Rotacion Z: -0.0 rad/s
No hay obstaculos
Presion: 96527 Pa
```

## Configuración

### Backend (Python)
1. Asegúrate de que el puerto serial esté configurado correctamente en `arduino_backend_web.py`
2. Ejecuta el backend: `python3 arduino_backend_web.py`
3. El backend estará disponible en `http://localhost:5000`

### Frontend (Next.js)
1. Los datos se actualizan automáticamente cada segundo
2. Puedes ver todos los datos en el dropdown "Sensores"
3. Los datos más importantes se muestran en el overlay del video

## Interfaz de Usuario

### Dropdown de Sensores
- **Datos Básicos**: Temperatura, humedad, distancia, motor
- **Ambientales**: Sonido, altitud, presión, obstáculos
- **Aceleración**: Valores X, Y, Z en m/s²
- **Rotación**: Valores X, Y, Z en rad/s

### Overlay del Video
- **Esquina superior derecha**: Datos básicos en tiempo real
- **Gráfico inferior derecho**: Temperatura en tiempo real
- **Indicadores**: Estado de grabación, mediciones, ángulo

## Pruebas

Para probar el parser de datos:
```bash
cd /home/martin/Kraken/KrakenROV/Software/backend
python3 test_arduino_parser.py
```

## Solución de Problemas

### El backend no detecta datos
1. Verifica que el Arduino esté conectado al puerto correcto
2. Asegúrate de que el formato de datos coincida exactamente
3. Revisa los logs del backend para ver los datos recibidos

### El frontend no muestra datos
1. Verifica que el backend esté ejecutándose en el puerto 5000
2. Revisa la consola del navegador para errores de conexión
3. Asegúrate de que CORS esté habilitado en el backend

### Datos faltantes
1. Algunos sensores pueden no estar disponibles
2. El sistema mantiene los valores anteriores si no hay datos nuevos
3. Los campos opcionales se muestran como 0 si no están disponibles

## Desarrollo

### Agregar nuevos sensores
1. Actualiza el parser en `arduino_backend_web.py`
2. Agrega el campo a la interfaz `SensorData` en el frontend
3. Actualiza la UI para mostrar el nuevo dato
4. Agrega pruebas en `test_arduino_parser.py`

### Modificar el formato de datos
1. Actualiza las expresiones regulares en el parser
2. Prueba con `test_arduino_parser.py`
3. Actualiza la documentación

## Notas Técnicas

- El sistema es tolerante a fallos: si un dato no está disponible, mantiene el valor anterior
- Los datos se actualizan cada segundo
- El sistema funciona tanto con datos reales del Arduino como con datos simulados
- La interfaz es responsive y funciona en pantalla completa
