### Estándares de Arquitectura e Ingeniería de Software

Este documento define las reglas estrictas de desarrollo para el repositorio. Cualquier Pull Request o commit que infrinja estas directrices será rechazado automáticamente por los agentes de revisión (GGA). 

### 1. Arquitectura del Sistema y Principios de Diseño

* **Arquitectura Hexagonal / Clean Architecture:** El código debe separar estrictamente la lógica de negocio (dominio) de los frameworks, bases de datos e interfaces de usuario (infraestructura).
* **Inyección de Dependencias (DI):** Ninguna clase o servicio puede instanciar sus propias dependencias. Se debe utilizar inversión de control estricta.
* **Principios SOLID Fundamentales:** 

  * *Single Responsibility:* Cada componente, clase o función tiene un único motivo para cambiar.
  * *Interface Segregation:* No se exponen interfaces masivas; se fragmentan en contratos específicos y modulares.
* **Inmutabilidad por Defecto:** Está prohibido mutar variables directamente. Se deben utilizar estructuras de datos inmutables y funciones puras que retornen nuevas instancias.

### 2. Tipado Estricto y Buenas Prácticas (TypeScript)

* **Zero 'any':** Queda estrictamente prohibido el uso del tipo any. Todo tipo desconocido debe mapearse con unknown y validarse mediante type-guards (estrechamiento de tipos).
* **Tipado Nominal y Value Objects:** Los tipos primitivos (como strings para IDs o números para dinero) deben encapsularse en *Value Objects* con validación integrada en el constructor.
* **Manejo Exhaustivo de Errores:** Prohibido el uso de bloques try/catch vacíos o retornar simplemente null. Los errores de dominio deben tratarse como datos utilizando patrones tipo *Either* (Result/Failure).

### 3. Metodologías y Pruebas Automatizadas

* **Desarrollo Guiado por Pruebas (TDD):** Todo código productivo debe contar con su correspondiente suite de pruebas unitarias antes de integrarse.
* **Pirámide de Testing:** El sistema debe estructurarse con un 70% de pruebas unitarias (aislando dependencias con mocks/stubs), 20% de integración y 10% de extremo a extremo (E2E).
* **Cobertura (Coverage):** El umbral mínimo requerido para permitir un despliegue es del 90% en líneas y ramas de lógica de negocio.

### 4. Métricas de Complejidad y Rendimiento

* **Complejidad Ciclomática:** Ninguna función puede superar una complejidad ciclomática de 5. Si la función contiene múltiples condiciones anidadas, debe refactorizarse inmediatamente.
* **Límite de Líneas:** Las funciones están limitadas a un máximo absoluto de 25 líneas. Los archivos de módulo no deben exceder las 200 líneas.
* **Asincronía Segura:** Todos los procesos de Entrada/Salida (I/O) deben implementarse mediante async/await. Está prohibido el uso de promesas anidadas tradicionales (.then) o llamadas bloqueantes síncronas.