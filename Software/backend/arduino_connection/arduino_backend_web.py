# backend_optimizado.py

from flask import Flask, jsonify
from flask_cors import CORS
import serial
import json # Usamos la librería json
import time

# --- Configuración serial (igual que antes) ---
SerialPort = "COM4"
baudRate = 115200
try:
    serialConnection = serial.Serial(SerialPort, baudRate, timeout=1)
    print(f"Conectado a {SerialPort} a {baudRate} baudios.")
    time.sleep(2)
except Exception as e:
    print(f"No se logró la conexión con el puerto: {e}")
    exit(1)

# --- Configuración Flask (igual que antes) ---
app = Flask(__name__)
CORS(app)

@app.route("/data")
def get_data():
    try:
        # 1. Lee la línea única de JSON
        json_line = serialConnection.readline().decode('utf-8').strip()
        
        # 2. Si la línea no está vacía, la convierte de texto a diccionario
        if json_line:
            data = json.loads(json_line)
            return jsonify(data)
        else:
            return jsonify({"error": "No se recibieron datos"}), 500
            
    except (json.JSONDecodeError, UnicodeDecodeError):
        # Captura errores si el JSON está mal formado o hay ruido en la línea
        return jsonify({"error": "Error al decodificar los datos del serial"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/")
def home():
    return "API para datos del Arduino"

if __name__ == "__main__":
    app.run(port=5000)