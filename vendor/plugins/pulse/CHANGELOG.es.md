# Registro de cambios — Pulse

## 0.8.0

- La app ya está también en italiano y en español: elige el idioma en la parte superior de la página.

## 0.7.0

- Las apps propias de DevQuake reciben ahora sus actualizaciones en directo a través de Pulse. Tus servicios, tu plan y tus límites siguen igual; las conexiones en directo siguen disponibles para ellos como antes.

## 0.6.0

- Pulse ya puede funcionar en tu propio servidor (DevQuake autoalojado): allí cada miembro tiene el plan completo.

## 0.5.1

- Los enlaces “Volver” ahora te llevan a la página de la que venías, con sus filtros y donde te habías quedado al desplazarte.

## 0.5.0

- La tarjeta de la app en DevQuake y su página de inicio muestran ahora cuántos miembros la usan y sus totales: servicios API, eventos de hoy.

## 0.4.1

- Quien aún no usa la app ve ahora en su página de inicio lo que hace, con un enlace al manual de uso, y los enlaces compartidos muestran la imagen propia de la app.

## 0.4.0

- Pruébalo en directo: abre la nueva demo en dos navegadores (con la misma cuenta) y envía un mensaje o tu propio JSON de uno a otro a través de la API real de Pulse. El otro navegador muestra lo que ha llegado y cuánto ha tardado, del remitente al servidor, del servidor al navegador y en total, con la media, el más rápido y el más lento. Gratis en todos los planes, en un canal privado que solo puedes usar tú.

## 0.3.0

- Se cuentan las llamadas a la API: la página de tu servicio muestra cuántas llamadas ha recibido en total, en forma abreviada (como 1.2K o 100K; el número exacto al pasar el puntero por encima), cuántas se rechazaron y las últimas llamadas con su respuesta y cuánto tardaron.
- Para los administradores de DevQuake: los totales de todos los servicios, el tamaño del registro de llamadas y la limpieza del registro ahora mismo o automáticamente cada 1, 7, 30 o 90 días. Limpiar el registro nunca cambia los totales. Cuando Pulse no puede arrancar, los administradores ven ahora qué ajuste falta.

## 0.2.0

- Añade la app a tu pantalla de inicio: en móviles y tabletas, el nuevo botón de la barra de herramientas pone el icono de la app (su logo con la insignia de DevQuake) en tu pantalla de inicio, para que se abra como una app.

## 0.1.0

- Crea servicios API y obtén una clave pública para tus páginas web y una clave secreta para tu servidor (se muestra una vez y nunca se guarda; crea una nueva cuando quieras, la antigua sigue funcionando 24 horas).
- Envía eventos con tus propios datos clave:valor y recíbelos en directo en todos los navegadores conectados, con polling como alternativa donde las conexiones en directo están bloqueadas; los clientes que se reconectan recuperan lo que se perdieron.
- Describe tu propia estructura de datos por evento (claves, tipos, obligatorias) y, si quieres, rechaza todo lo demás.
- Seguridad: la clave pública solo funciona en los sitios web que has verificado con un registro DNS, la clave secreta se rechaza en las páginas web y puede vincularse a las direcciones de tus servidores, los canales privados necesitan tokens de cliente de corta duración y un registro de seguridad te avisa cuando una clave parece compartida.
- Una prueba en directo para probarlo todo con dos dispositivos, código listo para copiar y uso diario. Pruébalo gratis 24 horas (más lento a propósito) o suscríbete; pídenos acceso completo.
