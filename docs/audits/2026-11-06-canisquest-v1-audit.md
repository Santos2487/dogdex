# Auditoría de CanisQuest antes de v1.0

> **Alcance y límites:** Esta auditoría se realizó únicamente mediante inspección estática del repositorio. No se ejecutó la aplicación y no se accedió a Firebase, Vercel ni a servicios externos. Algunos hallazgos requieren validación adicional en ejecución o contra la configuración desplegada.

Fecha: 6 de noviembre de 2026. Repositorio inspeccionado: `dogdex/` (nombre técnico histórico). No se modificó el proyecto durante la auditoría.

## 1. Estructura principal y stack real

El proyecto usa Next.js 15.5.9 con App Router, React 19.2.1 y TypeScript. Incluye Tailwind CSS 3, componentes de estilo shadcn/ui basados en Radix, Firebase 11, Zustand, React Hook Form, Zod, Framer Motion, Lucide y Genkit con Gemini. El paquete aún se llama `nextn`; es un nombre técnico, no el nombre visible del producto. Véase [`package.json`](../../package.json).

| Área | Ubicación y función |
| --- | --- |
| Páginas | `src/app/` |
| Componentes | `src/components/` |
| Estado global | `src/contexts/AuthContext.tsx` y `src/store/` |
| Datos y tipos | `src/lib/data.ts`, `src/lib/breed-translations.ts`, `src/lib/firebase.ts` y `src/types/index.ts` |
| IA | `src/ai/genkit.ts` y `src/ai/flows/` |
| Recursos PWA | `public/manifest.json`, iconos, favicons y logo |

## 2. Rutas y componentes principales

Las rutas existentes son `/`, `/collection`, `/stats`, `/badges`, `/capture`, `/analyzing`, `/review`, `/entry/[id]`, `/ranking` y `/settings`. La raíz presenta el onboarding o redirige a la colección. El grupo `(main)` comparte layout y barra inferior. La barra contiene Colección, Estadísticas, Captura, Ranking y Ajustes. `/badges` sigue accesible desde Estadísticas. Véanse [`src/app/page.tsx`](../../src/app/page.tsx), [`src/components/layout/BottomNav.tsx`](../../src/components/layout/BottomNav.tsx) y [`src/app/(main)/stats/page.tsx`](../../src/app/(main)/stats/page.tsx).

Los componentes propios más relevantes son `ImageUploader`, `ReviewForm`, `CollectionGrid`, `DogCard`, `BottomNav` y `Onboarding`. `CollectionGrid` observa las capturas, las filtra por favorito, rareza y texto y presenta tarjetas `DogCard`, que enlazan a `/entry/[id]`. La ficha permite consultar la captura, alternar favorito y eliminarla.

## 3. Stores y estado global

`AuthContext` mantiene el usuario Firebase, su perfil Firestore y el estado de carga. El store de captura Zustand conserva temporalmente la imagen como data URI, la raza, confianza, rareza e indicador de mestizo. El store de idioma Zustand admite `en` y `es` y persiste la preferencia localmente con la clave histórica `dogdex-language`. La captura temporal no se persiste. Véanse [`src/contexts/AuthContext.tsx`](../../src/contexts/AuthContext.tsx), [`src/store/capture-store.ts`](../../src/store/capture-store.ts) y [`src/store/language-store.ts`](../../src/store/language-store.ts).

## 4. Firebase y estructura Firestore deducida

La aplicación inicializa Authentication, Firestore y Storage con variables `NEXT_PUBLIC_FIREBASE_*`. La configuración pública contiene valores de sustitución si faltan variables. No se encontraron claves privadas de Gemini en el código inspeccionado. Véase [`src/lib/firebase.ts`](../../src/lib/firebase.ts).

La estructura deducida del código es la siguiente; no se verificó que todos estos documentos existan en producción:

| Ruta | Contenido o uso |
| --- | --- |
| `users/{uid}` | Perfil, proveedor, XP, nivel, contadores y, en cuentas Google, datos de cuenta |
| `users/{uid}/entries/{entryId}` | Imagen, raza, confianza, rareza, `isMixed`, apodo, notas, favorito, fecha y proveedor IA |
| `users/{uid}/achievements/{achievementId}` | Objetivo, métrica, progreso y desbloqueo |
| `trainerNames/{nombreNormalizado}` | Reserva de nombre público único |
| `publicProfiles/{uid}` | Nombre y métricas públicas para el ranking |

No hay archivos `firestore.rules`, `storage.rules` ni `firebase.json` versionados en este repositorio. Por tanto, esta auditoría no puede confirmar los permisos efectivos de lectura y escritura ni asegurar, solo desde el código cliente, que los documentos públicos contengan exclusivamente campos permitidos.

## 5. Firebase Storage

Las fotos se suben desde el cliente a `users/{uid}/entries/{entryId}.jpg` mediante `uploadString`; después se obtiene una URL de descarga, que se guarda en el documento de Firestore. La ficha intenta borrar el objeto de Storage antes de eliminar el documento. La subida y la escritura de Firestore no forman una transacción conjunta. Véanse [`src/components/review/ReviewForm.tsx`](../../src/components/review/ReviewForm.tsx) y [`src/app/(main)/entry/[id]/page.tsx`](../../src/app/(main)/entry/%5Bid%5D/page.tsx).

## 6. Flujo de autenticación

Al no haber sesión, `AuthContext` crea una cuenta anónima, crea o recupera su perfil y observa sus cambios. Al conectar Google intenta enlazar la cuenta invitada, conservando el UID y la colección cuando el enlace funciona. Si la credencial Google ya pertenece a otra cuenta, inicia sesión en esa cuenta existente; no hay una migración visible de las capturas del invitado hacia ella. Cerrar sesión conduce a la creación automática de otro invitado. Volver a entrar con Google recupera los datos asociados al UID Google. Véase [`src/contexts/AuthContext.tsx`](../../src/contexts/AuthContext.tsx).

Los usuarios registrados pueden reservar un nombre público único de 3 a 20 caracteres ASCII: letras, números o guion bajo. La reserva usa una transacción que escribe `trainerNames`, el perfil del usuario y `publicProfiles`. La interfaz no ofrece cambiarlo después. Se conservan los nombres técnicos históricos `trainerName`, `trainerNameLower` y `trainerNames`. Véase [`src/app/(main)/settings/page.tsx`](../../src/app/(main)/settings/page.tsx).

## 7. Flujo completo de captura e IA

1. `ImageUploader` recibe foto de cámara o archivo, comprueba que el tipo MIME empiece por `image/`, la lee como data URI y la guarda en Zustand.
2. `/analyzing` llama desde el cliente a `identifyDogBreed`, una función marcada `use server`. Genkit usa `googleai/gemini-2.5-flash`; la llamada a Gemini se define en el flujo de servidor. No aparece Cloudflare ni una ruta API propia en este recorrido.
3. El resultado incluye `breedName`, `isMixed`, `confidence`, `rarity` y `candidateBreeds`. La página conserva los cuatro primeros y descarta los candidatos. Si falla el prompt, el flujo devuelve `Mixed Breed`, confianza `0.45` y rareza `Uncommon`, permitiendo continuar.
4. `/review` permite editar la raza, añadir apodo y notas y marcar favorito. Al guardar, el cliente sube la foto a Storage, obtiene la URL y luego escribe la captura, el perfil, los logros y, si hay nombre público, el perfil de ranking mediante una transacción de Firestore.
5. La ficha observa el documento, permite alternar favorito y, al eliminar, intenta borrar primero el objeto de Storage y después el documento de Firestore.

Véanse [`src/components/capture/ImageUploader.tsx`](../../src/components/capture/ImageUploader.tsx), [`src/app/(main)/analyzing/page.tsx`](../../src/app/(main)/analyzing/page.tsx), [`src/ai/genkit.ts`](../../src/ai/genkit.ts), [`src/ai/flows/identify-dog-breed-from-image.ts`](../../src/ai/flows/identify-dog-breed-from-image.ts) y [`src/components/review/ReviewForm.tsx`](../../src/components/review/ReviewForm.tsx).

## 8. Rareza, XP y niveles

Las categorías son `Common`, `Uncommon` y `Rare`. La rareza guardada procede normalmente de Gemini. El mapa local de razas solo se usa si no hay rareza de IA; `getRarityFromBreed` devuelve `Common` para nombres ausentes del mapa. Editar manualmente la raza no recalcula la rareza si la IA ya la proporcionó. Véanse [`src/lib/data.ts`](../../src/lib/data.ts) y [`src/components/review/ReviewForm.tsx`](../../src/components/review/ReviewForm.tsx).

Cada captura otorga **1 XP**, más **2 XP** si la cadena de raza todavía no aparece en la colección y **1 XP** adicional si la rareza es `Rare`. `Uncommon` no recibe ese punto extra. La función central `getLevelFromXp` empieza en nivel 1, exige 10 XP para llegar al nivel 2 y después `10 × nivel actual` para cada nivel siguiente.

## 9. Logros

Hay 15 definiciones progresivas para capturas totales, razas únicas, capturas `Uncommon` y capturas `Rare`. Al iniciar sesión se crean los documentos que falten sin sobrescribir los existentes. Al guardar una captura, el flujo activo consulta por separado `Uncommon` y `Rare` y actualiza el progreso de los logros todavía bloqueados. Los nuevos logros de usuarios antiguos se crean con progreso cero; el progreso histórico no se calcula en ese momento. Véanse [`src/lib/data.ts`](../../src/lib/data.ts), [`src/contexts/AuthContext.tsx`](../../src/contexts/AuthContext.tsx) y [`src/components/review/ReviewForm.tsx`](../../src/components/review/ReviewForm.tsx).

## 10. Ranking y estadísticas

El ranking observa todos los documentos de `publicProfiles` y los ordena en el navegador por XP, capturas o razas únicas. Las escrituras visibles de estos perfiles incluyen UID, nombre público, nivel y contadores; no incluyen email. No se verificaron las reglas desplegadas ni el contenido real de la colección. Véase [`src/app/(main)/ranking/page.tsx`](../../src/app/(main)/ranking/page.tsx).

Estadísticas observa las entradas del usuario y calcula capturas actuales, favoritos, mestizos, tres razas más frecuentes y desglose separado de `Common`, `Uncommon` y `Rare`. Muestra también nombre, nivel, XP, progreso y fecha de alta; para razas únicas usa el contador del perfil. Contiene el acceso a `/badges`. Véase [`src/app/(main)/stats/page.tsx`](../../src/app/(main)/stats/page.tsx).

## 11. Traducciones y PWA

Los textos visibles suelen definirse por pantalla según `en` o `es`. `translateBreed` centraliza un mapa breve de traducciones de razas y devuelve el nombre original cuando no encuentra coincidencia. Las tarjetas y la ficha muestran `(Mestizo)` en español y `(Mix)` en inglés. Véanse [`src/lib/breed-translations.ts`](../../src/lib/breed-translations.ts), [`src/components/collection/DogCard.tsx`](../../src/components/collection/DogCard.tsx) y [`src/app/(main)/entry/[id]/page.tsx`](../../src/app/(main)/entry/%5Bid%5D/page.tsx).

El manifiesto configura instalación en modo `standalone`, orientación vertical e iconos de 192 y 512 píxeles. El layout declara el manifiesto y el apple touch icon. No se encontró registro de service worker en `src`; el repositorio acredita la configuración de instalación, pero no una capacidad sin conexión. Véanse [`public/manifest.json`](../../public/manifest.json) y [`src/app/layout.tsx`](../../src/app/layout.tsx).

## 12. Hallazgos y deuda técnica

| Prioridad | Hallazgo |
| --- | --- |
| **Crítico** | La eliminación sigue borrando el documento de Firestore aunque falle el borrado en Storage. Por tanto, el caso de imagen huérfana descrito como corregido sigue siendo posible en el código local. Véase `src/app/(main)/entry/[id]/page.tsx`. |
| **Importante** | Al borrar una captura desde la ficha no se ajustan `totalCaptures`, `uniqueBreedsCount`, XP, logros ni `publicProfiles`. Estadísticas calcula capturas desde las entradas, mientras ranking y algunos logros usan contadores guardados; pueden divergir. |
| **Importante** | Si una credencial Google ya está vinculada a otra cuenta, la ruta de recuperación cambia a ese UID sin trasladar la colección invitada. Este caso requiere una decisión de producto y pruebas antes de intervenir. |
| **Importante** | La imagen se sube antes de la transacción de Firestore y no se retira si esta falla. También puede quedar un objeto huérfano por un error al guardar. |
| **Importante** | `src/app/actions.ts` contiene acciones de servidor exportadas que aceptan `userId` como argumento, sin comprobación visible de identidad dentro de esas funciones. No se encontraron llamadas a ellas en la interfaz actual; su exposición y efecto reales deben evaluarse junto con autenticación y reglas antes de usarlas. Además, `saveCapture` mezcla `Uncommon` y `Rare`, a diferencia del guardado activo. |
| **Importante** | Las búsquedas de raza, rareza y logros se hacen antes de la transacción de guardado. Dos guardados simultáneos pueden partir de los mismos resultados y contabilizar dos veces una raza nueva o dejar progreso desfasado. |
| **Importante** | Los logros añadidos a usuarios antiguos se inicializan con progreso cero. Se conservan los documentos previos, pero no se garantiza mostrar inmediatamente el avance acumulado de logros nuevos. |
| **Importante** | Next está configurado para ignorar errores de TypeScript y ESLint durante `build`. Un build exitoso, por sí solo, no acreditaría esas comprobaciones. Véase `next.config.ts`. |
| **Mejora** | La captura temporal vive solo en memoria; recargar `/analyzing` o `/review` la pierde. No hay límite de tamaño visible antes de leer y enviar imágenes como data URI. |
| **Mejora** | El ranking descarga la colección pública completa y ordena localmente. Puede aumentar coste y tiempo de carga al crecer la comunidad. |
| **Cosmético** | El onboarding todavía dice `DogExplorer` y está solo en inglés. La revelación de captura muestra `(Mix)` también en español. Hay textos sueltos como `Nivel`, `Trainer` y `of` sin adaptación completa. |

### Partes posiblemente obsoletas o duplicadas

Los flujos `dog-breed-recognition`, `review-capture-with-fallback` y `suggest-manual-breed-selection-on-error` se registran para Genkit, pero no se encontraron llamadas desde las páginas web. `src/app/actions.ts` duplica operaciones que la interfaz realiza directamente. `candidateBreeds` se pide a Gemini y `aiCandidates` figura en el tipo, pero ninguno llega a la captura guardada. Cualquier retirada requeriría confirmar antes si hay usos externos. Véanse [`src/ai/dev.ts`](../../src/ai/dev.ts), [`src/app/actions.ts`](../../src/app/actions.ts) y [`src/types/index.ts`](../../src/types/index.ts).

## 13. Discrepancias con el documento de contexto y zonas delicadas

Las discrepancias materiales son: el borrado puede dejar imágenes huérfanas; el caso de Google ya vinculado no conserva automáticamente las capturas invitadas; los logros nuevos no recuperan progreso histórico al crearse; existen candidatos alternativos en el contrato de IA aunque el flujo web los desecha; y la interfaz todavía contiene `DogExplorer` y algunas cadenas sin traducir. El desglose activo de `Uncommon` y `Rare` sí está separado, tanto al guardar como en Estadísticas. El archivo duplicado `actions.ts` conserva la lógica antigua que los suma.

Las zonas especialmente delicadas para trabajos futuros son el enlace de cuentas, las reglas efectivas de Firebase, la secuencia Storage–Firestore, la coherencia de contadores y logros, el contrato de Gemini y la publicación del perfil público. Los cambios en estas áreas pueden afectar al otro desarrollador y a datos existentes. No se propone renombrar la carpeta, el repositorio ni los identificadores técnicos históricos.

## Estado general de CanisQuest antes de realizar cambios

El repositorio contiene el recorrido principal de una aplicación reconocible: identificación con Gemini en servidor, colección persistida en Firebase, gamificación, ranking separado de perfiles privados y soporte parcial de español e inglés. La prioridad para v1.0 es verificar y resolver la consistencia de datos en borrados y fallos de guardado, seguida de los casos de conversión de invitado a Google y la validación de reglas de Firebase. Esta auditoría no prueba el comportamiento desplegado: no se ejecutaron la aplicación, pruebas ni conexiones a servicios.
