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


### Estándares de Ingeniería y Arquitectura del Proyecto (Gentle AI Stack)

Este documento define las reglas estrictas de desarrollo para los agentes de IA (SDD, JD, Review Agents y GGA). Cualquier código que infrinja estas directrices será rechazado. 

### 1. Arquitectura de Directorios Estricta

* **Raíz Limpia (Clean Root):** Prohibido crear archivos .js o .ts sueltos en la raíz. Todos los scripts de prueba manuales (como test-*.js) deben vivir en la carpeta /scripts.
* **Estructura del Código (/src):** 

  * /src/app: Exclusivo para páginas, layouts y rutas de Next.js (App Router).
  * /src/components: Componentes de interfaz de usuario organizados por contexto (ej: /common, /features).
  * /src/lib: Inicialización de clientes de terceros. El cliente de Supabase debe centralizarse únicamente en /src/lib/supabase.ts.
  * /src/services: Capa de datos y consultas a la base de datos o APIs. Ningún componente visual puede hacer consultas directas.
  * /src/types: Definiciones y contratos de TypeScript globales.

### 2. Reglas de Oro para Next.js y TypeScript

* **Server Components por Defecto:** Todos los componentes son React Server Components (RSC) a menos que requieran interactividad (hooks como useState, useEffect). En ese caso, usar la directiva 'use client' estrictamente en componentes atómicos.
* **Zero 'any':** Queda prohibido el uso del tipo any. Todo tipo desconocido debe tiparse como unknown y validarse mediante Type Guards.
* **Manejo de Errores Exhaustivo:** No se permiten bloques try/catch vacíos. Los errores de Supabase o APIs deben ser tipados y manejados devolviendo un objeto estructurado { data, error }.

### 3. Optimización, Estilos y Rendimiento

* **Tailwind Limpio:** Evitar la duplicación masiva de clases idénticas en el DOM. Componentizar los elementos repetitivos.
* **Seguridad de Tokens:** Las variables de entorno (.env) jamás se suben al repositorio. Deben ser validadas en tiempo de ejecución o compilación.
* **Complejidad Ciclomática:** Las funciones no deben superar una complejidad de 5 (máximo 2 niveles de anidamiento de condiciones). Las funciones deben ser cortas (menos de 25 líneas).

### 4. Flujo de Trabajo con IA (SDD & TDD)

* **Spec-Driven Development:** Antes de codificar cualquier funcionalidad, el agente debe leer o generar la especificación técnica en la carpeta correspondiente.
* **Pruebas Automatizadas:** Cada servicio de /src/services o lógica de negocio compleja debe incluir su archivo de pruebas unitarias (.test.ts) utilizando patrones AAA (Arrange, Act, Assert).