# KrakenROV

# Plan de configuracion y estructura del proyecto EcoHarmony_Park_G11_2025

Este plan describe la configuración y estructura del repositorio que se utilizará para el desarrollo en el tiempo con respecto al proyecto EcoHarmony_Park_G11_2025. El objetivo es establecer una organización clara de los archivos que se van a utilizar, así como un criterio de línea base que permita mantener un registro ordenado de las versiones a lo largo del curso.

**Criterio de Línea Base:**
Se creará una primera línea base una vez que se hayan cargado todos los archivos correspondientes al primer trabajo práctico (TP) evaluable en el repositorio. Las siguientes líneas base se generarán luego de la entrega de cada TP evaluable relacionados al proyecto.

---

## **Estructura del repositorio**
EcoHarmony_Park_G11_2025
- 📂 **Documentacion/**
  - 📂 **Casos de prueba/**
  - 📂 **Minutas/**
  - 📂 **Requerimientos/**
  - 📂 **User Stories/**
  - 📂 **Bibliografia/**
- 📂 **Plan de configuracion/**
  - 📂 **Dependencias/**
  - 📂 **Estructura/**
  - 📂 **Herramientas de desarrollo/**
  - 📂 **Reglas de nombrado/**
- 📂 **Base de Datos/**
- 📂 **Desarrollo/**
  - 📂 **Recursos visuales/**
      - 📂 **Tipografias/**
      - 📂 **Colores/**
      - 📂 **Iconografia/**
  - 📂 **Frontend/**
  - 📂 **Backend/**
- 📂 **Equipo/**
- 📂 **Planificacion de tareas/**



**Listado de Ítems de Configuración**

| Nombre Ítem de configuración  | Regla de Nombrado                      | Ubicación Física                                            |
|-------------------------------|----------------------------------------|-------------------------------------------------------------|
| Estructura                    | `Estructura_Proyecto.pdf`              | EcoHarmony_Park_G11_2025/Plan_de_configuracion/Estructura              |
| Reglas de nombrado            | `Reglas_Nombrado.pdf`                  | EcoHarmony_Park_G11_2025/Plan_de_configuracion/Reglas_de_nombrado              |
| Herramientas de desarrollo    | `<<Nombre_Herramienta>>_HD.pdf`        | EcoHarmony_Park_G11_2025/Plan_de_configuracion/Herramientas_de_desarrollo              |
| Dependencias                  | `<<Nro>>_<<Nombre_Depend>>.pdf`        | EcoHarmony_Park_G11_2025/Plan_de_configuracion/Dependencias              |
| User Stories                  | `US_<<Nro>>_<<Nombre>>.pdf`            | EcoHarmony_Park_G11_2025/Documentacion/User_Stories                      |
| Casos de prueba               | `CP_<<Nro>>_<<Nombre>>.pdf`            | EcoHarmony_Park_G11_2025/Documentacion/Casos_de_prueba                      |
| Minutas                       | `Minuta_<<Fecha>>_<<Nombre>>.pdf`      | EcoHarmony_Park_G11_2025/Documentacion/Minutas                      |
| Requerimientos                | `<<Nombre>>_<<Versión>>.pdf`           | EcoHarmony_Park_G11_2025/Documentacion/Requerimientos                      |
| Bibliografia                  | `<<Título>>_<<Autor>>.pdf`             | EcoHarmony_Park_G11_2025/Documentacion/Bibliografia                      |
| Readme                        | `README.md`                            | EcoHarmony_Park_G11_2025                                    |
| Base de Datos                 | `BD_<<Versión>>.sql`                   | EcoHarmony_Park_G11_2025/Base_de_datos                                    |
| Tipografías                   | `Tipografía_<<Nombre_RV>>.<<ext>>`     | EcoHarmony_Park_G11_2025/Desarrollo/Recursos_visuales/Tipografias    |
| Colores                       | `Colores_<<Nombre_RV>>.<<ext>>`        | EcoHarmony_Park_G11_2025/Desarrollo/Recursos_visuales/Colores             |
| Iconografía                   | `Iconografía_<<Nombre_RV>>.<<ext>>`    | EcoHarmony_Park_G11_2025/Desarrollo/Recursos_visuales/Iconografia              |
| Frontend                      | `Frontend_<<Tipo>>.<<ext>>`            | EcoHarmony_Park_G11_2025/Desarrollo/Frontend                         |
| Backend                       | `Backend_<<Tipo>>.<<ext>>`             | EcoHarmony_Park_G11_2025/Desarrollo/Backend                         |
| Equipo                        | `Equipo_<<Miembro>>.pdf`               | EcoHarmony_Park_G11_2025/Equipo                                    |
| Planificación de tareas       | `Planificación_<<Periodo>>.xlsx`       | EcoHarmony_Park_G11_2025/Planificacion_de_tareas                                    |

**Regla de nombrado**

| Sigla        | Significado |
|--------------|-------------|
| `<<Autor>>`    | Nombre del autor del libro o material utilizado en la bibliografía. Se utilizará “CamelCase” para el nombre. (Ej: RogerPressman) |
| `<<Fecha>>`   | Fecha de ocurrencia del evento. Con el formato 'dd-mm-aaaa' d:Día, m:Mes, a:Año |
| `ICS`         | Nombre de la materia Ingeniería y Calidad de Software |
| `<<Tema>>`    | Nombre del tema al cual corresponde el ejercicio o el material bibliografico |
| `<<Título>>`   | Nombre del libro o material bibliográfico. Se utilizará el formato “CamelCase” |
| `<<ext>>`      | Extensión del archivo (Ej: pdf, docx) |
| `<<Miembro>>`  | Nombre del miembro que conforma el equipo en formato CamelCase (Ej: JuanPerez) |
| `<<Nombre_Herramienta>>` | Nombre de la herramienta que se va a utilizar para el desarrollo. Se utilizará el formato “CamelCase” |
| `<<Nombre_Depend>>` | Nombre de la dependencia que se implementa para el desarrollo. Se utilizará el formato “CamelCase” |
| `<<Nombre_RV>>` | Nombre del recurso visual a utilizar. Se utilizará el formato “CamelCase” (Ej: ComicSans, Rojo) |
| `<<Nombre>>`   | Nombre del item de configuración en la documentación. Se utilizará el formato “CamelCase” |
| `<<Nro>>` | Valor numerico entero de dos digitos (Ej: 01) |
| `<<Versión>>` | Numero de versionado del item de configuración |
| `<<Periodo>>` | Periodo de vigencia para la planificación. Se reconocerán los periodos con fecha de inicio y fecha fin, con el formato 'dd-mm-aaaa_dd-mm-aaaa' d:Día, m:Mes, a:Año|
| `<<Tipo>>` | Nombre del componente desarrollado (Ej: Pantalla principal, Menu, Entidades) |
