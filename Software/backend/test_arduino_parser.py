#!/usr/bin/env python3
"""
Script de prueba para verificar que el parser del Arduino funciona correctamente
"""

import re

def test_parser():
    # Datos de ejemplo del Arduino
    test_data = """Nivel de sonido: 66
Temperatura (BMP180): 26.00 *C
Altitud: 408.04 metros
Aceleracion X:  9.99 m/s^2
Aceleracion Y:  -0.03 m/s^2
Aceleracion Z: 0.12 m/s^2
Rotacion X:  -0.03 rad/s
Rotacion Y:  -0.00 rad/s
Rotacion Z: -0.0 rad/s
No hay obstaculos
Presion: 96527 Pa"""

    print("Datos de prueba del Arduino:")
    print(test_data)
    print("\n" + "="*50 + "\n")

    # Parsear los datos
    data = {}
    
    # Nivel de sonido
    sound_match = re.search(r'Nivel de sonido:\s*(-?[\d.]+)', test_data)
    if sound_match:
        data["sound_level"] = float(sound_match.group(1))
        print(f"✓ Nivel de sonido: {data['sound_level']} dB")
    
    # Temperatura (BMP180)
    temp_match = re.search(r'Temperatura \(BMP180\):\s*(-?[\d.]+)\s*\*C', test_data)
    if temp_match:
        data["temperature"] = float(temp_match.group(1))
        print(f"✓ Temperatura: {data['temperature']}°C")
    
    # Altitud
    altitude_match = re.search(r'Altitud:\s*(-?[\d.]+)\s*metros', test_data)
    if altitude_match:
        data["altitude"] = float(altitude_match.group(1))
        print(f"✓ Altitud: {data['altitude']} metros")
    
    # Aceleración X, Y, Z
    accel_x_match = re.search(r'Aceleracion X:\s*(-?[\d.]+)\s*m/s\^2', test_data)
    if accel_x_match:
        data["acceleration_x"] = float(accel_x_match.group(1))
        print(f"✓ Aceleración X: {data['acceleration_x']} m/s²")
    
    accel_y_match = re.search(r'Aceleracion Y:\s*(-?[\d.]+)\s*m/s\^2', test_data)
    if accel_y_match:
        data["acceleration_y"] = float(accel_y_match.group(1))
        print(f"✓ Aceleración Y: {data['acceleration_y']} m/s²")
    
    accel_z_match = re.search(r'Aceleracion Z:\s*(-?[\d.]+)\s*m/s\^2', test_data)
    if accel_z_match:
        data["acceleration_z"] = float(accel_z_match.group(1))
        print(f"✓ Aceleración Z: {data['acceleration_z']} m/s²")
    
    # Rotación X, Y, Z
    rot_x_match = re.search(r'Rotacion X:\s*(-?[\d.]+)\s*rad/s', test_data)
    if rot_x_match:
        data["rotation_x"] = float(rot_x_match.group(1))
        print(f"✓ Rotación X: {data['rotation_x']} rad/s")
    
    rot_y_match = re.search(r'Rotacion Y:\s*(-?[\d.]+)\s*rad/s', test_data)
    if rot_y_match:
        data["rotation_y"] = float(rot_y_match.group(1))
        print(f"✓ Rotación Y: {data['rotation_y']} rad/s")
    
    rot_z_match = re.search(r'Rotacion Z:\s*(-?[\d.]+)\s*rad/s', test_data)
    if rot_z_match:
        data["rotation_z"] = float(rot_z_match.group(1))
        print(f"✓ Rotación Z: {data['rotation_z']} rad/s")
    
    # Obstáculos
    obstacle_match = re.search(r'No hay obstaculos', test_data)
    if obstacle_match:
        data["obstacles"] = False
        print("✓ Obstáculos: No")
    else:
        obstacle_detected = re.search(r'Obstaculo detectado', test_data)
        if obstacle_detected:
            data["obstacles"] = True
            print("✓ Obstáculos: Sí")
    
    # Presión
    pressure_match = re.search(r'Presion:\s*(-?[\d.]+)\s*Pa', test_data)
    if pressure_match:
        data["pressure"] = float(pressure_match.group(1))
        print(f"✓ Presión: {data['pressure']} Pa")
    
    print("\n" + "="*50)
    print("Datos parseados:")
    print(data)
    
    return data

if __name__ == "__main__":
    test_parser()
