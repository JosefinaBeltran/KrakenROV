# backend.py

from flask import Flask, jsonify
from flask_cors import CORS
import serial
import re
import time

# Configuración serial
SerialPort = "COM3"
baudRate = 9600

try:
    serialConnection = serial.Serial(SerialPort, baudRate, timeout=1)
    print(f"Conectado a {SerialPort} a {baudRate} baudios.")
    time.sleep(2)  # Espera para estabilizar conexión
except Exception as e:
    print(f"No se logró la conexión con el puerto: {e}")
    exit(1)

# Configuración Flask
app = Flask(__name__)
CORS(app)  # Permitir acceso desde cualquier origen

def leer_datos():
    raw_line = serialConnection.readline().decode('utf-8').strip()
    print(raw_line)
    dist_match = re.search(r'Dist:\s*(-?[\d.]+)', raw_line)
    temp_match = re.search(r'Temp:\s*(-?[\d.]+)', raw_line)
    hum_match = re.search(r'Hum:\s*(-?[\d.]+)', raw_line)
    motor_match = re.search(r'Motor:\s*(\w+)', raw_line)

    if dist_match and temp_match and hum_match and motor_match:
        return {
            "temperature": float(temp_match.group(1)),
            "humidity": float(hum_match.group(1)),
            "distance": float(dist_match.group(1)),
            "motor": motor_match.group(1)
        }
    else:
        return None

@app.route("/data")
def get_data():
    for _ in range(5):  # Intenta hasta 5 líneas por si alguna falla
        data = leer_datos()
        if data:
            return jsonify(data)
    return jsonify({"error": "No se pudo leer datos válidos"}), 500

@app.route("/")
def home():
    return "API para datos del Arduino"

if __name__ == "__main__":
    app.run(port=5000)
