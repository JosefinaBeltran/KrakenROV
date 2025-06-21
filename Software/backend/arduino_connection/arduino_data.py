import serial # Permite realizar la comunicación serial
import time # Proporciona funciones relacionadas con el tiempo
import collections # Implementa tipos de datos de contendores especializados
import matplotlib.pyplot as plt # Permite realizar gráficos
import matplotlib.animation as animation # Permite animar las gráficas
from matplotlib.lines import Line2D
import numpy as np # Permite trabajar con vectores y matrices
import sys
import re
#---------------------------------------------

def getSerialData(self, Samples, numData, serialConnection, lines, dist_text, motor_text):
    # Lee una línea completa del puerto serial
    raw_line = serialConnection.readline().decode('utf-8').strip()
    
    # Ejemplo de raw_line: 'Dist: 50.12 cm | Temp: 23.50 C | Hum: 45.80 % | Motor: ON'
    try:
        # Usa expresiones regulares para encontrar cada valor de forma robusta
        dist_match = re.search(r'Dist:\s*(-?[\d.]+)', raw_line)
        temp_match = re.search(r'Temp:\s*(-?[\d.]+)', raw_line)
        hum_match = re.search(r'Hum:\s*(-?[\d.]+)', raw_line)
        motor_match = re.search(r'Motor:\s*(\w+)', raw_line)

        # Procesa la línea solo si todos los datos fueron encontrados
        if dist_match and temp_match and hum_match and motor_match:
            dist = float(dist_match.group(1))
            temp = float(temp_match.group(1))
            hum = float(hum_match.group(1))
            motor = motor_match.group(1)

            # Guarda los valores en las listas correspondientes para graficar
            data[0].append(temp)
            data[1].append(hum)
            data[2].append(dist)
            
            # Actualiza las líneas de la gráfica
            lines[0].set_data(range(Samples), data[0])
            lines[1].set_data(range(Samples), data[1])
            lines[2].set_data(range(Samples), data[2])
            
            # Actualiza los textos de distancia y motor
            dist_text.set_text(f'Distancia: {dist:.2f} cm')
            motor_text.set_text(f'Motor: {motor}')
        else:
            # Ignora la línea si está incompleta para evitar errores
            if raw_line: # No imprimir warnings por líneas vacías
                print(f"Línea incompleta, saltando: '{raw_line}'")

    except Exception as e:
        # Captura cualquier otro error inesperado durante el parseo
        print(f"Error procesando la línea: '{raw_line}' -> {e}")
        
SerialPort = "COM3" # Puerto serial de Arduino
baudRate = 9600 # Velocidad de baudios

# Inicializamos nuestro objeto Serial con los parámetros declarados
try:
    serialConnection = serial.Serial(SerialPort, baudRate, timeout=1)
    print(f"Conectado a {SerialPort} a {baudRate} baudios.")
    time.sleep(2) # Esperar a que Arduino se reinicie
except Exception as e:
    print(f"No se logró la conexión con el puerto: {e}")
    sys.exit(1) # Termina el script si no hay conexión
    
Samples = 200 # Número de muestras
sampleTime = 100 # Tiempo de muestreo
numData = 3 # Número de sensores a graficar (Temp, Hum, Dist)

# Límites de los ejes para nuestra gráfica
xmin = 0
xmax = Samples

ymin = [-10, 0, 0]       # Temp, Hum, Dist
ymax = [50, 100, 200]    # Temp, Hum, Dist (Ajusta el max de distancia si es necesario)
lines = []
data = []

for i in range(numData):
    # Lista donde almacenamos las lecturas de nuestro sensor
    data.append(collections.deque([0] * Samples, maxlen = Samples))
    # Empleamos líneas en 2D para la gráfica de datos
    lines.append(Line2D([], [], color="blue"))

# Creamos la figura y ajustamos el layout
fig = plt.figure(figsize=(10, 8))
fig.subplots_adjust(top=0.9, bottom=0.1, hspace=0.6)

# Agregar los textos para distancia y motor en la parte superior
dist_text = fig.text(0.15, 0.93, '', fontsize=12)
motor_text = fig.text(0.65, 0.93, '', fontsize=12)

# 1ra gráfica: Temperatura
ax1 = fig.add_subplot(3, 1, 1, xlim=(xmin, xmax), ylim=(ymin[0], ymax[0]))
ax1.title.set_text("Temperatura")
ax1.set_ylabel("Valor(C°)")
ax1.add_line(lines[0])

# 2da gráfica: Humedad
ax2 = fig.add_subplot(3, 1, 2, xlim=(xmin, xmax), ylim=(ymin[1], ymax[1]))
ax2.title.set_text("Humedad")
ax2.set_ylabel("Valor(%)")
ax2.add_line(lines[1])

# 3ra gráfica: Distancia
ax3 = fig.add_subplot(3, 1, 3, xlim=(xmin, xmax), ylim=(ymin[2], ymax[2]))
ax3.title.set_text("Distancia")
ax3.set_xlabel("Número de muestras")
ax3.set_ylabel("Valor(cm)")
ax3.add_line(lines[2])

# Animamos nuestra gráfica
anim = animation.FuncAnimation(fig, getSerialData, fargs=(Samples, numData, serialConnection, lines, dist_text, motor_text), interval=sampleTime, cache_frame_data=False)
plt.show() # Mostramos la gráfica

# Cerramos el puerto serial
print("Cerrando puerto serial.")
serialConnection.close()

          
