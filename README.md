# Tabla de Contenidos

- [Tecnologías Utilizadas](#tecnologías-utilizadas)
- [Requisitos Previos](#requisitos-previos)
- [Configuración del Entorno](#configuración-del-entorno)
- [Tipos de Pruebas](#tipos-de-pruebas)
- [Ejecución de Pruebas](#ejecución-de-pruebas)
- [Visualización en Grafana](#visualización-en-grafana)

---

# Sobre el Proyecto

Este proyecto utiliza [QuickPizza](https://github.com/grafana/quickpizza) de Grafana Labs como aplicación bajo prueba (AUT).

## Tecnologías Utilizadas

| Tecnología     | Versión  | Propósito                             |
| -------------- | -------- | ------------------------------------- |
| **k6**         | ≥ v1.0.0 | Herramienta de testing de performance |
| **Docker**     | Latest   | Containerización del ambiente         |
| **QuickPizza** | Latest   | Aplicación bajo prueba                |
| **Grafana**    | Latest   | Visualización de métricas (opcional)  |

---

## Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- [Docker Desktop](https://www.docker.com/products/docker-desktop) (para ambiente local)
- [k6](https://k6.io/docs/getting-started/installation/)

---

## Configuración del Entorno

### Ambiente Local con Docker

Esta opción te permite tener control total del ambiente y observar métricas detalladas.

#### Paso 1: Clonar el repositorio de QuickPizza

```bash
git clone https://github.com/grafana/quickpizza.git
cd quickpizza
```

#### Paso 2: Levantar el stack de observabilidad completo

```bash
docker compose -f compose.grafana-local-stack.monolithic.yaml up -d
```

Este comando levanta:

- **QuickPizza** en `http://localhost:3333`
- **Grafana** en `http://localhost:3000` (usuario: `admin` / password: `admin`)
- **Prometheus, Tempo, Loki, Pyroscope** (backend de observabilidad)

#### Detener el ambiente

```bash
docker compose -f compose.grafana-local-stack.monolithic.yaml down
```

---

## Tipos de Pruebas

### 1. **Smoke Test** (Prueba de Humo)

**Propósito:** Verificar que el sistema funciona bajo carga mínima.

- **Usuarios:** 1-5 usuarios virtuales
- **Duración:** 1-2 minutos
- **Objetivo:** Detectar errores básicos antes de ejecutar pruebas más costosas

### 2. **Load Test** (Prueba de Carga)

**Propósito:** Evaluar el comportamiento del sistema bajo carga esperada.

- **Usuarios:** Carga típica del sistema
- **Duración:** 5-15 minutos
- **Objetivo:** Validar tiempos de respuesta y throughput bajo condiciones normales

### 3. **Stress Test** (Prueba de Estrés)

**Propósito:** Encontrar los límites del sistema incrementando la carga progresivamente.

- **Usuarios:** Incremento gradual hasta que el sistema falle
- **Duración:** 10-30 minutos
- **Objetivo:** Identificar el punto de quiebre y comportamiento bajo presión extrema

### 4. **Spike Test** (Prueba de Picos)

**Propósito:** Evaluar cómo responde el sistema a aumentos súbitos de carga.

- **Usuarios:** Incremento abrupto de usuarios
- **Duración:** 5-10 minutos
- **Objetivo:** Validar la capacidad de auto-recuperación y elasticidad

### 5. **Soak Test** (Prueba de Resistencia)

**Propósito:** Detectar problemas de estabilidad a largo plazo (memory leaks, degradación).

- **Usuarios:** Carga moderada constante
- **Duración:** 1+ horas
- **Objetivo:** Identificar problemas que solo aparecen con el tiempo

---

## Ejecución de Pruebas

Todas las pruebas están configuradas para funcionar tanto en ambiente local como en el desplegado mediante la variable de entorno `BASE_URL`.

### Configuración de la URL Base

Los scripts utilizan la siguiente configuración:

```javascript
const BASE_URL = "http://localhost:3333";
```

### Ejecutar Pruebas en Ambiente Local

```bash
# Smoke Test
k6 run tests/smoke/smoke-test.js

# Load Test
k6 run tests/load/load-test.js

# Stress Test
k6 run tests/stress/stress-test.js

# Spike Test
k6 run tests/spike/spike-test.js

# Soak Test
k6 run tests/soak/soak-test.js
```

---

## Visualización en Grafana

Si estás usando el ambiente local con el stack completo:

1. Accede a Grafana: [http://localhost:3000](http://localhost:3000)
2. Usuario: `admin` / Password: `admin`
3. Navega a **Explore** o **Dashboards**
4. Visualiza métricas en tiempo real durante las pruebas

---

## Créditos

Este proyecto utiliza [QuickPizza](https://github.com/grafana/quickpizza) de **Grafana Labs**.

**Recursos Oficiales:**

- Repositorio: [https://github.com/grafana/quickpizza](https://github.com/grafana/quickpizza)
- Documentación de k6: [https://k6.io/docs/](https://k6.io/docs/)
- Grafana Labs: [https://grafana.com/](https://grafana.com/)

---
