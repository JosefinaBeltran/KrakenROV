import cv2
import numpy as np
from scipy.spatial import distance

class MeasurementSystem:
    def __init__(self, camera_matrix=None, dist_coeffs=None):
        """
        Inicializa el sistema de medición.
        
        Args:
            camera_matrix: Matriz de calibración de la cámara
            dist_coeffs: Coeficientes de distorsión de la cámara
        """
        self.camera_matrix = camera_matrix
        self.dist_coeffs = dist_coeffs
        self.pixels_per_meter = None  # Factor de conversión píxeles a metros
        self.reference_points = []
        self.calibration_mode = False
        self.capture_mode = False
        self.captured_image = None
        
    def mouse_callback(self, event, x, y, flags, param):
        if event == cv2.EVENT_LBUTTONDOWN and self.calibration_mode:
            self.reference_points.append((x, y))
            print(f"Punto seleccionado: ({x}, {y})")
            if len(self.reference_points) == 2:
                print("Por favor ingresa la longitud real del objeto en centímetros:")
                length_cm = float(input())
                self.calibrate_with_reference(None, length_cm/100, self.reference_points)
                self.calibration_mode = False
                self.reference_points = []
                print("Calibración completada!")
        
    def calibrate_with_reference(self, image, reference_length_meters, reference_points):
        """
        Calibra el sistema usando un objeto de referencia de longitud conocida.
        
        Args:
            image: Imagen con el objeto de referencia
            reference_length_meters: Longitud real del objeto en metros
            reference_points: Puntos (x,y) del objeto de referencia
        """
        # Calcular distancia en píxeles
        pixel_distance = distance.euclidean(reference_points[0], reference_points[1])
        self.pixels_per_meter = pixel_distance / reference_length_meters
        print(f"Factor de conversión: {self.pixels_per_meter:.2f} píxeles por metro")
        
    def measure_object(self, image, reference_length=None):
        """
        Mide un objeto en la imagen.
        
        Args:
            image: Imagen de entrada
            reference_length: Longitud de referencia en metros (opcional)
            
        Returns:
            measurements: Diccionario con las mediciones realizadas
        """
        # Convertir a escala de grises
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Aplicar umbral adaptativo
        thresh = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                     cv2.THRESH_BINARY_INV, 11, 2)
        
        # Encontrar contornos
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        measurements = {}
        
        for i, contour in enumerate(contours):
            # Filtrar contornos pequeños
            if cv2.contourArea(contour) < 1000:
                continue
                
            # Calcular el rectángulo delimitador
            rect = cv2.minAreaRect(contour)
            box = cv2.boxPoints(rect)
            box = np.int32(box)
            
            # Calcular dimensiones
            width = rect[1][0]
            height = rect[1][1]
            
            # Convertir a metros si está calibrado
            if self.pixels_per_meter is not None:
                width_m = width / self.pixels_per_meter
                height_m = height / self.pixels_per_meter
            else:
                width_m = None
                height_m = None
            
            measurements[f'object_{i}'] = {
                'width_pixels': width,
                'height_pixels': height,
                'width_meters': width_m,
                'height_meters': height_m,
                'center': rect[0],
                'angle': rect[2]
            }
            
            # Dibujar el rectángulo y las mediciones
            cv2.drawContours(image, [box], 0, (0, 255, 0), 2)
            
            # Mostrar mediciones en la imagen
            text = f"W: {width:.1f}px"
            if width_m is not None:
                text += f" ({width_m*100:.1f}cm)"
            cv2.putText(image, text, 
                       (int(rect[0][0]), int(rect[0][1])),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
            
        return image, measurements

    def process_video_stream(self, video_source=0):
        """
        Procesa el stream de video en tiempo real.
        
        Args:
            video_source: Fuente de video (0 para cámara web)
        """
        cap = cv2.VideoCapture(video_source)
        
        # Verificar si la cámara se abrió correctamente
        if not cap.isOpened():
            print("Error: No se pudo abrir la cámara")
            return
            
        # Crear ventana y configurar callback del mouse
        cv2.namedWindow('Measurement System')
        cv2.setMouseCallback('Measurement System', self.mouse_callback)
            
        print("Presiona 'c' para calibrar con un objeto de referencia")
        print("Presiona 's' para capturar y analizar la imagen actual")
        print("Presiona 'q' para salir")
        
        while True:
            if self.captured_image is None:
                ret, frame = cap.read()
                if not ret:
                    break
            else:
                frame = self.captured_image.copy()
                
            # Procesar frame
            processed_frame, measurements = self.measure_object(frame)
            
            # Mostrar instrucciones y puntos de referencia
            if self.calibration_mode:
                cv2.putText(processed_frame, "Selecciona dos puntos del objeto de referencia",
                          (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
                for point in self.reference_points:
                    cv2.circle(processed_frame, point, 5, (0, 0, 255), -1)
            
            # Mostrar resultados
            cv2.imshow('Measurement System', processed_frame)
            
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
            elif key == ord('c'):
                self.calibration_mode = True
                self.reference_points = []
                print("Modo calibración activado. Selecciona dos puntos del objeto de referencia.")
            elif key == ord('s'):
                self.captured_image = frame.copy()
                print("\n=== Mediciones de la imagen capturada ===")
                for obj_id, measures in measurements.items():
                    print(f"\nObjeto {obj_id}:")
                    print(f"Ancho: {measures['width_pixels']:.1f} píxeles", end="")
                    if measures['width_meters'] is not None:
                        print(f" ({measures['width_meters']*100:.1f} cm)")
                    else:
                        print()
                    print(f"Alto: {measures['height_pixels']:.1f} píxeles", end="")
                    if measures['height_meters'] is not None:
                        print(f" ({measures['height_meters']*100:.1f} cm)")
                    else:
                        print()
                print("\nPresiona 'r' para volver al modo video en vivo")
            elif key == ord('r') and self.captured_image is not None:
                self.captured_image = None
                
        cap.release()
        cv2.destroyAllWindows()

if __name__ == "__main__":
    # Ejemplo de uso
    measurement_system = MeasurementSystem()
    measurement_system.process_video_stream() 