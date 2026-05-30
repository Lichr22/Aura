# Aura - Aplicación de Bienestar Femenino

Aura es una aplicación web enfocada en el bienestar, seguimiento y gestión del ciclo menstrual de la mujer. Proporciona herramientas para registrar síntomas diarios, estimar predicciones del ciclo, visualizar análisis históricos, y conversar con una inteligencia artificial especializada en salud femenina (Aurora).

## 🚀 Arquitectura y Tecnologías

El proyecto está construido utilizando **Vanilla JavaScript (ES6+), HTML5 y CSS3** sin frameworks front-end, priorizando la ligereza y el control absoluto del DOM.

La persistencia de datos se maneja completamente en el cliente utilizando **LocalStorage**.

### Principios de Diseño
Recientemente la arquitectura de la aplicación fue refactorizada para adherirse a los principios **SOLID**, específicamente el Principio de Responsabilidad Única (SRP), separando las reglas de negocio de la lógica de persistencia y la autenticación.

## 📂 Estructura de Directorios

La estructura principal del proyecto está dividida de la siguiente manera:

```text
Aura/
├── src/
│   ├── models/           # Entidades de dominio puro (sin lógica de persistencia)
│   │   ├── User.js       # Entidad principal de la usuaria
│   │   ├── Cycle.js      # Registro de ciclos menstruales
│   │   ├── FlowLog.js    # Registro de flujo 
│   │   ├── SymptomLog.js # Registro de síntomas y emociones
│   │   ├── SexualActivity.js 
│   │   ├── MenstrualProfile.js 
│   │   └── BaseRecord.js # Clase base para registros (Herencia/Polimorfismo)
│   ├── services/         # Servicios de infraestructura y autenticación
│   │   ├── AuthService.js         # Lógica de login, logout y sesión activa
│   │   └── LocalStorageService.js # Wrapper centralizado para interactuar con LocalStorage
│   ├── repositories/     # Repositorios de datos
│   │   └── UserRepository.js      # Persistencia y re-hidratación de objetos User
│   └── analysis/         # Clases analíticas basadas en Polimorfismo
│       ├── Analysis.js
│       ├── CycleAnalysis.js
│       └── HealthAnalysis.js
├── pages/                # Vistas de la aplicación (Módulos UI)
│   ├── index/            # Dashboard principal
│   ├── login/            # Inicio de sesión
│   ├── register/         # Creación de cuentas
│   ├── prediction/       # Predicción del próximo periodo y días fértiles
│   ├── summary/          # Resumen analítico y lista unificada de registros
│   ├── symptoms/         # Formulario de registro de síntomas y estados
│   ├── aIAssistant/      # Chatbot de Aurora
│   ├── sync/             # Invitación a usuarios anónimos (en progreso)
│   └── Team/             # Quiénes somos
├── scripts/              # Scripts globales de la aplicación
│   └── GlobalUI.js       # Verificación de sesión global, menú de perfil, y logout
└── assets/               # Recursos estáticos
    ├── img/              # Imágenes e íconos SVG/PNG
    └── fonts/            # Fuentes tipográficas (Cornella, Nunito)
```

## 🧠 Flujo de Trabajo y Patrones (Para IA y Desarrolladores)

Al implementar nuevas características o refactorizar código en este proyecto, por favor ten en cuenta las siguientes reglas establecidas:

1. **Persistencia Centralizada**: **Ninguna** clase del dominio (`src/models/`) ni vistas UI (`pages/`) debe interactuar directamente con `localStorage`. Toda persistencia se hace a través de los **Repositories** (`UserRepository`) que a su vez utilizan `LocalStorageService`.
2. **Re-hidratación de Clases**: Cuando se extraen datos de LocalStorage (que son objetos genéricos de JSON), `UserRepository` se encarga de re-instanciar los objetos complejos (`new User()`, `new Cycle()`, `new SymptomLog()`, etc.) para asegurar que los métodos de clase sigan funcionando a través del flujo de la aplicación.
3. **Autenticación**: El acceso al usuario actual en cualquier pantalla se debe hacer llamando a `AuthService.getCurrentUser()`. Nunca consultes la llave `currentUser` en `localStorage` directamente.
4. **Protección de Rutas**: El archivo `scripts/GlobalUI.js` se importa en todas las vistas protegidas para asegurar de que el usuario sea redirigido a `/pages/login/login.html` si no hay una sesión activa.
5. **Polimorfismo**: El historial unificado de la usuaria se construye agregando distintos tipos de registros (`Cycle`, `SymptomLog`, `FlowLog`, `SexualActivity`) en una misma lista. Estas clases heredan de `BaseRecord` e implementan el método `getSummary()` permitiendo a la UI mostrar la lista usando polimorfismo puro.
6. **Estilos y Assets**: Todos los archivos CSS deben llamar a las fuentes locales ubicadas en `assets/fonts/` usando rutas relativas correctas (usualmente `../../assets/fonts/...`). Las variables de color primarias están definidas en el `:root` de cada CSS principal (`--primary-color`, etc.).

## 🛠️ Cómo ejecutar el proyecto

Puesto que el proyecto está desarrollado en Vanilla JS sin un proceso de build (como Webpack o Vite), simplemente necesitas un servidor web estático local para ejecutarlo (debido al uso de ES6 Modules `type="module"`).

1. Clona el repositorio.
2. Utiliza una extensión como **Live Server** en VSCode, o ejecuta un servidor local usando Node.js (`npx serve .`) o Python (`python -m http.server 8000`).
3. Accede a `index.html` en la raíz del proyecto para iniciar la aplicación (te redirigirá a la pantalla de login).

## 🔒 Manejo de Errores y Seguridad Simulada
- El sistema cuenta con bloqueo de cuentas después de 3 intentos fallidos de inicio de sesión (`loginAttempts`).
- El modelo `User` registra de forma pasiva los intentos, pero es el `UserRepository` el que guarda la actualización del estado.
