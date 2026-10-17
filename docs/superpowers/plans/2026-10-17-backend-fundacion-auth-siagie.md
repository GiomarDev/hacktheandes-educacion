# Fundación del backend: ms-auth + ms-siagie — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Monorepo NestJS con ms-auth (login, JWT RS256, JWKS, refresh rotativo, usuarios y roles con alcance) y ms-siagie (IE, secciones, estudiantes, matrícula, asistencia por día y por hora, ingreso y salida por QR, notas literales), cada uno con su schema PostgreSQL en la base `school`.

**Architecture:** Monorepo Nest (`apps/ms-auth`, `apps/ms-siagie`, `libs/common`, `libs/fixtures`). Cada servicio tiene su propio Prisma (`schema.prisma`, cliente generado y migraciones) apuntando a su schema. ms-siagie verifica los JWT con la llave pública de ms-auth (JWKS en caché), sin llamarlo en cada petición. Entre servicios no hay FK: ms-auth valida IE, UGEL y DRE contra ms-siagie por HTTP interno.

**Tech Stack:** Node 25 · NestJS 12 · Prisma 7.10.1 + `@prisma/adapter-pg` · PostgreSQL · `jsonwebtoken` + `jwks-rsa` (RS256) · `argon2` · `class-validator` · Jest + supertest.

**Spec:** `docs/superpowers/specs/2026-10-17-backend-microservicios-design.md` (secciones 3, 4.0, 4.1, 5 y 6: fases F0, F1a y F1b).

**Fuera de este plan:** ms-alerta, ms-simon y ms-escale, y los eventos de ms-siagie hacia ms-alerta (se añaden en el plan de ms-alerta).

## Global Constraints

- Base `school` en `panel.keoit.com:5432`. Un schema por servicio: `auth`, `siagie`. Tests en `auth_test` y `siagie_test`. **Jamás** correr tests contra `auth` o `siagie`.
- En toda `DATABASE_URL` la contraseña va con `$` codificado como `%24`. Los `.env` no se commitean; el repo solo lleva `.env.example` con `<PASSWORD>`.
- Prisma **7.10.1 fijo** (no `latest`, que es 8.0.0-rc). Configuración en `apps/<svc>/prisma.config.ts` con `import 'dotenv/config'`. Generator `prisma-client` con `output = "../src/generated/prisma"`. El cliente se construye con `new PrismaPg({ connectionString }, { schema })`. Al instalar, confirmar estas APIs en la documentación de Prisma 7; si difieren, ajustar sin cambiar los nombres de tablas y columnas.
- Sin FK entre servicios. Las columnas que referencian a otro servicio son `String @db.Uuid` sin `@relation`.
- IDs `@default(uuid(7)) @db.Uuid`. `created_at` y `updated_at` en `timestamptz`. Tablas y columnas en `snake_case` con `@@map` y `@map`; modelos en `PascalCase`.
- Columnas, tipos y enums **exactamente** como en las secciones 4.0 y 4.1 de la spec, más la unique adicional de `grade_entries` definida en la Tarea 11.
- JWT RS256, issuer `hacktheandes-auth`. Access token: 900 s. Refresh token: 604800 s.
- Claims: `sub`, `name`, `roles: [{ role, schoolId?, ugelId?, dreId? }]`, `kid` en la cabecera.
- Contraseñas con argon2id. Bloqueo de cuenta tras **5** intentos fallidos durante **15 min** (los 15 min son decisión del plan; la spec no fija duración).
- Todo fallo de login responde `401 { "message": "Credenciales inválidas" }`, sea usuario inexistente, contraseña errónea o cuenta bloqueada.
- Llamadas internas con cabecera `x-internal-key: $INTERNAL_API_KEY`.
- Puertos: ms-auth `3000`, ms-siagie `3001`.
- Commits en español, Conventional Commits, en la rama `feat/backend-fundacion`.

## Review Focus

1. **Enumeración de usuarios:** login con un DNI inexistente → misma respuesta que contraseña errónea, y se ejecuta igual un `argon2.verify` contra un hash ficticio. → test en la Tarea 4.
2. **Reutilización de refresh token:** usar un refresh token ya rotado → 401 y se revoca toda la familia (el token nuevo también deja de servir). → test en la Tarea 5.
3. **Fuga entre colegios:** un director de la IE A pide estudiantes o asistencia de la IE B → 403. → test en las Tareas 8 y 13.
4. **Pase de lista inválido:** un `enrollmentId` que no es de la sección o no está ENROLLED, o una fecha futura → 400 sin guardar nada. Reenviar la misma lista → no duplica (upsert). → test en la Tarea 10.
5. **Token falso, vencido o de `kid` desconocido** → 401. Con ms-auth caído, un token válido sigue pasando gracias a la JWKS en caché. → test en la Tarea 6.

---

## Estructura de archivos

```
package.json · nest-cli.json · tsconfig.json · tsconfig.build.json · eslint.config.mjs · .prettierrc · .env.example
scripts/create-database.mjs                 # CREATE DATABASE school (una sola vez)
libs/common/src/
  index.ts
  auth/roles.ts                             # Role (union), RoleClaim, AuthUser
  auth/jwt-auth.guard.ts                    # verifica RS256 con JWKS en caché
  auth/roles.decorator.ts                   # @Roles(...), @Public()
  auth/current-user.decorator.ts            # @CurrentUser()
  auth/scope.ts                             # canAccessSchool(), schoolIdsOf()
  internal/internal-key.guard.ts
  config/require-env.ts
libs/fixtures/src/seed-ids.ts               # UUID fijos compartidos por ambos seeds
apps/ms-auth/
  prisma.config.ts · prisma/schema.prisma · prisma/migrations/ · prisma/seed.ts
  src/main.ts · src/app.module.ts · src/prisma.service.ts
  src/keys/keys.service.ts · src/keys/jwks.controller.ts · src/keys/key-crypto.ts
  src/auth/auth.controller.ts · auth.service.ts · tokens.service.ts · dto/*.ts
  src/users/users.controller.ts · users.service.ts · role-grant.policy.ts · dto/*.ts
  src/siagie/siagie.client.ts
  test/jest-e2e.json · test/global-setup.ts · test/*.e2e-spec.ts
apps/ms-siagie/
  prisma.config.ts · prisma/schema.prisma · prisma/migrations/ · prisma/seed.ts
  src/main.ts · src/app.module.ts · src/prisma.service.ts
  src/geo/ (dres, ugels, schools: controller + service)
  src/internal/internal.controller.ts
  src/school-access.service.ts              # resuelve la IE de cada recurso y aplica scope
  src/sections/ · src/students/ (students + guardians) · src/enrollments/
  src/attendance/ (class-sessions + attendance)
  src/access/ (qr.service + access.controller)
  src/grades/ (grades.service + period-grade.ts)
  test/jest-e2e.json · test/global-setup.ts · test/*.e2e-spec.ts
```

---

### Task 1: Monorepo, configuración y base de datos

**Files:**
- Create: `package.json`, `nest-cli.json`, `tsconfig*.json`, `eslint.config.mjs`, `.prettierrc`, `.env.example`, `scripts/create-database.mjs`, `libs/common/src/config/require-env.ts`, `libs/common/src/index.ts`, `apps/ms-auth/src/main.ts`, `apps/ms-auth/src/app.module.ts`, `apps/ms-siagie/src/main.ts`, `apps/ms-siagie/src/app.module.ts`
- Modify: `.gitignore` (añadir `node_modules/`, `dist/`, `**/src/generated/`, `coverage/`)
- Test: `apps/ms-auth/test/health.e2e-spec.ts`, `apps/ms-siagie/test/health.e2e-spec.ts`

**Interfaces:**
- Produces: alias `@app/common` → `libs/common/src`, alias `@app/fixtures` → `libs/fixtures/src`. `requireEnv(name: string): string` lanza `Error("Falta la variable de entorno <name>")`. `GET /health` → `200 { status: "ok", service: "ms-auth" | "ms-siagie" }` en cada app.

- [ ] **Step 1:** Crear la rama: `git checkout -b feat/backend-fundacion`.
- [ ] **Step 2:** Generar el monorepo con `npx @nestjs/cli@12 new` en modo monorepo (sin git ni instalación por separado), con las apps `ms-auth` y `ms-siagie` y la librería `common`. Fijar en `package.json`: `prisma@7.10.1`, `@prisma/client@7.10.1`, `@prisma/adapter-pg@7.10.1`, `pg`, `dotenv`, `argon2`, `jsonwebtoken`, `jwks-rsa`, `class-validator`, `class-transformer`, `@nestjs/config`. Dev: `supertest`, `@types/jsonwebtoken`.
- [ ] **Step 3:** Escribir `.env.example` con: `ADMIN_DATABASE_URL`, `AUTH_DATABASE_URL` (`?schema=auth`), `AUTH_TEST_DATABASE_URL` (`?schema=auth_test`), `SIAGIE_DATABASE_URL` (`?schema=siagie`), `SIAGIE_TEST_DATABASE_URL` (`?schema=siagie_test`), `KEY_ENCRYPTION_SECRET` (32 bytes en base64), `INTERNAL_API_KEY`, `AUTH_JWKS_URL=http://localhost:3000/.well-known/jwks.json`, `SIAGIE_URL=http://localhost:3001`, `SEED_PASSWORD`. Todas las URL con `<PASSWORD>` y `sslmode=disable`. Crear el `.env` real fuera del commit.
- [ ] **Step 4:** Escribir `health.e2e-spec.ts` en cada app: `GET /health` → status 200 y body `{ status: "ok", service: "<app>" }`. Ejecutar `npx jest --config apps/ms-auth/test/jest-e2e.json` → FAIL (404).
- [ ] **Step 5:** Implementar el `HealthController` en cada `app.module.ts`. Cada `main.ts` usa el puerto `3000` o `3001` y un `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })` global.
- [ ] **Step 6:** Repetir la ejecución de los tests e2e de ambas apps → PASS.
- [ ] **Step 7:** Escribir `scripts/create-database.mjs`: se conecta con `pg` a `ADMIN_DATABASE_URL` (la base `postgres`), revisa `pg_database` y ejecuta `CREATE DATABASE school` solo si no existe. Imprime `school: creada` o `school: ya existía`. **Pedir confirmación al usuario antes de ejecutarlo** (crea un recurso en el servidor compartido). Ejecutar `node scripts/create-database.mjs` → una de esas dos salidas.
- [ ] **Step 8:** `npm run lint` sin errores. Commit: `chore: monorepo NestJS con ms-auth y ms-siagie`.

### Task 2: Esquema Prisma de ms-auth

**Files:**
- Create: `apps/ms-auth/prisma.config.ts`, `apps/ms-auth/prisma/schema.prisma`, `apps/ms-auth/src/prisma.service.ts`, `apps/ms-auth/test/global-setup.ts`
- Modify: `apps/ms-auth/test/jest-e2e.json` (globalSetup), `apps/ms-auth/src/app.module.ts`
- Test: `apps/ms-auth/test/prisma.e2e-spec.ts`

**Interfaces:**
- Produces: modelos `User`, `UserRole`, `RefreshToken`, `SigningKey`, `AuthEvent` y enums `DocumentType`, `UserStatus`, `Role`, `AuthEventType`, tal como en la sección 4.0 de la spec. `PrismaService extends PrismaClient` (inyectable). El adapter toma la URL de `AUTH_DATABASE_URL` y el schema del parámetro `schema` de la URL. Scripts npm: `auth:migrate` (`prisma migrate dev`), `auth:generate`.

- [ ] **Step 1:** Escribir `prisma.e2e-spec.ts`: crea un `User` y lo lee por `(documentType, documentNumber)`. Crear un segundo usuario con el mismo par → error con código `P2002`. Crear un `UserRole` → `user.roles.length === 1`.
- [ ] **Step 2:** `global-setup.ts`: asigna `DATABASE_URL = AUTH_TEST_DATABASE_URL` y ejecuta `npx prisma migrate reset --force` con `--config apps/ms-auth/prisma.config.ts`. Si la URL no contiene `schema=auth_test`, aborta con un error.
- [ ] **Step 3:** Escribir `schema.prisma` con las 5 tablas de la sección 4.0. Las columnas `school_id`, `ugel_id` y `dre_id` de `user_roles` sin `@relation`. Unique `(user_id, role, school_id, ugel_id, dre_id)`.
- [ ] **Step 4:** Implementar `PrismaService` con `onModuleInit` → `$connect` y `onModuleDestroy` → `$disconnect`.
- [ ] **Step 5:** Ejecutar `npm run auth:migrate -- --name init` contra `auth` (esto crea el schema) y luego el test e2e → PASS.
- [ ] **Step 6:** Commit: `feat(auth): esquema Prisma de identidad y acceso`.

### Task 3: Llaves RS256 y JWKS

**Files:**
- Create: `apps/ms-auth/src/keys/key-crypto.ts`, `keys.service.ts`, `jwks.controller.ts`
- Test: `apps/ms-auth/src/keys/key-crypto.spec.ts`, `apps/ms-auth/test/jwks.e2e-spec.ts`

**Interfaces:**
- Produces:
  - `encryptPrivateKey(pem: string, secretB64: string): string`
  - `decryptPrivateKey(blob: string, secretB64: string): string` (AES-256-GCM; formato `iv.tag.ciphertext` en base64url)
  - `KeysService.getActiveSigningKey(): Promise<{ kid: string; privateKeyPem: string }>`: si no hay ninguna llave activa, genera un par RSA 2048 con `crypto.generateKeyPairSync`, lo guarda y lo devuelve.
  - `KeysService.getJwks(): Promise<{ keys: JsonWebKey[] }>`: todas las llaves con `revoked_at` nulo o rotadas hace menos de 900 s, cada una con `kid`, `alg: "RS256"` y `use: "sig"`.
  - `GET /.well-known/jwks.json` es público.

- [ ] **Step 1:** Unit test: `decryptPrivateKey(encryptPrivateKey(pem, s), s) === pem`. Descifrar con otro secreto → lanza error.
- [ ] **Step 2:** e2e: la primera llamada a `GET /.well-known/jwks.json` devuelve `keys.length === 1`, con `kty "RSA"`, `alg "RS256"` y un `kid` no vacío. La segunda llamada devuelve el mismo `kid`, es decir, no regenera la llave.
- [ ] **Step 3:** Ejecutar ambos → FAIL. Implementar. El JWK se obtiene con `createPublicKey(pem).export({ format: "jwk" })`. Ejecutar → PASS.
- [ ] **Step 4:** Commit: `feat(auth): llaves RS256 cifradas y endpoint JWKS`.

### Task 4: Login con bloqueo y auditoría

**Files:**
- Create: `apps/ms-auth/src/auth/auth.controller.ts`, `auth.service.ts`, `tokens.service.ts`, `dto/login.dto.ts`
- Test: `apps/ms-auth/test/login.e2e-spec.ts`

**Interfaces:**
- Consumes: `KeysService.getActiveSigningKey()`.
- Produces:
  - `POST /auth/login` con body `{ documentType?: "DNI"|"CE"|"PASSPORT" (default "DNI"), documentNumber: string, password: string }` → `200 { accessToken, refreshToken, expiresIn: 900, mustChangePassword: boolean }`.
  - `TokensService.issueAccessToken(user: User & { roles: UserRole[] }): Promise<string>`, que firma el payload `{ sub, name, roles: RoleClaim[] }` con `kid` en la cabecera y `iss` igual a `hacktheandes-auth`.
  - `TokensService.issueRefreshToken(userId: string, familyId?: string, meta: { ip, userAgent }): Promise<string>`: token de 32 bytes aleatorios en base64url. Guarda `sha256` en hex como `token_hash`.

- [ ] **Step 1:** Escribir los tests e2e, con un usuario creado en `beforeEach` (contraseña `Clave-Prueba-1`):
  - `login ok` → 200; el `accessToken` se verifica con la JWKS y su payload trae `roles`. Se crea un `auth_events` `LOGIN_OK` y se actualiza `last_login_at`.
  - `contraseña errónea` → 401 `{ message: "Credenciales inválidas" }`, `failed_login_attempts` sube en 1 y se crea `LOGIN_FAILED`.
  - `usuario inexistente` → la misma respuesta 401 y un `LOGIN_FAILED` con `user_id` nulo.
  - `5 fallos` → `status` queda `LOCKED`, `locked_until` es aproximadamente ahora + 15 min y se crea `LOCKED`. Un sexto intento con la contraseña **correcta** → 401.
  - `bloqueo vencido` (`locked_until` en el pasado) con la contraseña correcta → 200, y el contador vuelve a 0.
  - `usuario INACTIVE` → 401.
- [ ] **Step 2:** Ejecutar → FAIL. Implementar. Si el usuario no existe, verificar igual contra un hash argon2 ficticio creado al arrancar el servicio. Ejecutar → PASS.
- [ ] **Step 3:** Commit: `feat(auth): login con argon2id, bloqueo por intentos y auditoría`.

### Task 5: Refresh rotativo, reutilización, logout y cambio de contraseña

**Files:**
- Modify: `apps/ms-auth/src/auth/auth.controller.ts`, `auth.service.ts`, `tokens.service.ts`
- Create: `dto/refresh.dto.ts`, `dto/change-password.dto.ts`
- Test: `apps/ms-auth/test/refresh.e2e-spec.ts`

**Interfaces:**
- Produces:
  - `POST /auth/refresh` con `{ refreshToken }` → `200 { accessToken, refreshToken, expiresIn }`. Revoca el token anterior y emite uno nuevo con el mismo `family_id`.
  - `POST /auth/logout` con `{ refreshToken }` → 204; revoca toda la familia.
  - `POST /auth/change-password` (requiere JWT) con `{ currentPassword, newPassword }`, donde `newPassword` tiene entre 10 y 128 caracteres → 204. Pone `must_change_password=false`, revoca todos los refresh tokens del usuario y crea `PASSWORD_CHANGED`.

- [ ] **Step 1:** Escribir los tests e2e:
  - `refresh ok` → 200, un token distinto del anterior y un evento `REFRESH`.
  - `reutilización`: refrescar con A da B; volver a usar A → 401 y `TOKEN_REUSE_DETECTED`; luego B → 401 también.
  - `vencido` (`expires_at` en el pasado) → 401.
  - `logout` → 204 y luego refresh → 401.
  - `change-password` con la contraseña actual errónea → 401. Con la correcta → 204; el login con la contraseña nueva da 200 y el refresh anterior da 401.
- [ ] **Step 2:** Ejecutar → FAIL. Implementar. Buscar por `token_hash` y hacer la rotación dentro de `prisma.$transaction`. Ejecutar → PASS.
- [ ] **Step 3:** Commit: `feat(auth): refresh rotativo con detección de reutilización y logout`.

### Task 6: Guard JWT compartido (`libs/common`) y `/auth/me`

**Files:**
- Create: `libs/common/src/auth/roles.ts`, `jwt-auth.guard.ts`, `roles.decorator.ts`, `current-user.decorator.ts`, `scope.ts`, `libs/common/src/internal/internal-key.guard.ts`
- Modify: `libs/common/src/index.ts`, `apps/ms-auth/src/auth/auth.controller.ts`
- Test: `libs/common/src/auth/scope.spec.ts`, `libs/common/src/auth/jwt-auth.guard.spec.ts`, `apps/ms-auth/test/me.e2e-spec.ts`

**Interfaces:**
- Produces:
  - `type Role = "MINEDU_ADMIN"|"DRE_SPECIALIST"|"UGEL_SPECIALIST"|"DIRECTOR"|"SECRETARY"|"TUTOR"|"TEACHER"|"AUXILIAR"|"PSYCHOLOGIST"`
  - `interface RoleClaim { role: Role; schoolId?: string; ugelId?: string; dreId?: string }`
  - `interface AuthUser { id: string; name: string; roles: RoleClaim[] }`
  - `JwtAuthGuard` (`APP_GUARD` global): lee `AUTH_JWKS_URL`; usa `jwks-rsa` con `cache: true`, `cacheMaxAge: 600000` y `rateLimit: true`; verifica `algorithms: ["RS256"]` y `issuer: "hacktheandes-auth"`; deja el usuario en `req.user: AuthUser`. Las rutas con `@Public()` se saltan el guard. Si el token se verifica pero no tiene ninguno de los roles de `@Roles(...)` → 403.
  - `@Roles(...roles: Role[])`, `@Public()`, `@CurrentUser(): AuthUser`
  - `canAccessSchool(user: AuthUser, school: { id: string; ugelId: string; dreId: string }): boolean`
  - `schoolIdsOf(user: AuthUser, roles?: Role[]): string[]`
  - `InternalKeyGuard`: compara la cabecera `x-internal-key` con `INTERNAL_API_KEY` usando `timingSafeEqual`; si no coincide → 401.

- [ ] **Step 1:** Unit tests de `scope.spec.ts`:
  - MINEDU_ADMIN → `true` para cualquier IE.
  - DRE_SPECIALIST con `dreId` igual → `true`; distinto → `false`.
  - UGEL_SPECIALIST por `ugelId`, con la misma lógica.
  - DIRECTOR con `schoolId` igual → `true`; otra IE → `false`.
  - Usuario sin roles → `false`.
- [ ] **Step 2:** Unit tests de `jwt-auth.guard.spec.ts`, con un servidor JWKS falso (`http.createServer`) y un par de llaves de prueba:
  - Token válido → pasa y `req.user.roles` viene poblado.
  - Firmado con otra llave → 401.
  - Vencido → 401.
  - `kid` desconocido → 401.
  - `alg: "HS256"` → 401.
  - Sin cabecera `Authorization` → 401.
  - **Caché:** se verifica un token válido, se apaga el servidor JWKS y otro token con el mismo `kid` sigue pasando.
- [ ] **Step 3:** e2e de ms-auth: `GET /auth/me` con el access token de un login → `200 { id, name, roles }`; sin token → 401.
- [ ] **Step 4:** Ejecutar → FAIL. Implementar. Registrar el guard en ms-auth: `login`, `refresh`, `logout`, `jwks` y `health` son `@Public()`. Ejecutar → PASS.
- [ ] **Step 5:** Commit: `feat(common): guard JWT con JWKS en caché, roles y alcance`.

### Task 7: Esquema Prisma de ms-siagie

**Files:**
- Create: `apps/ms-siagie/prisma.config.ts`, `prisma/schema.prisma`, `src/prisma.service.ts`, `test/global-setup.ts`
- Modify: `apps/ms-siagie/test/jest-e2e.json`, `src/app.module.ts`
- Test: `apps/ms-siagie/test/prisma.e2e-spec.ts`

**Interfaces:**
- Produces: todos los modelos y enums de la sección 4.1 de la spec (`Dre`, `Ugel`, `School`, `AuditLog`, `AcademicPeriod`, `Section`, `CurricularArea`, `Competency`, `TeachingAssignment`, `Student`, `Guardian`, `StudentGuardian`, `Enrollment`, `ClassSession`, `AttendanceRecord`, `QrCredential`, `AccessEvent`, `GradeEntry`, `PeriodGrade`). Toda columna `*_user_id` va sin `@relation`. Scripts npm: `siagie:migrate`, `siagie:generate`. El global-setup aplica la misma protección que en ms-auth, exigiendo `schema=siagie_test`.

- [ ] **Step 1:** Escribir `prisma.e2e-spec.ts`:
  - La cadena dre → ugel → school → section → student → enrollment se crea y se lee con `include`.
  - Una segunda matrícula del mismo estudiante en el mismo `year` → `P2002`.
  - Dos `attendance_records` con el mismo `(enrollment_id, date, class_session_id)` → `P2002`.
  - El `modular_code` de `schools` es único.
- [ ] **Step 2:** Escribir el schema, con todas las uniques de la sección 4.1, más `@@unique([enrollmentId, competencyId, periodId, columnNumber])` en `GradeEntry`. Ejecutar `npm run siagie:migrate -- --name init` y el test → PASS.
- [ ] **Step 3:** Commit: `feat(siagie): esquema Prisma de IE, matrícula, asistencia y notas`.

### Task 8: Geografía e IE con alcance y endpoint interno

**Files:**
- Create: `apps/ms-siagie/src/geo/*.ts` (controller + service + dto de dres, ugels y schools), `src/internal/internal.controller.ts`, `src/school-access.service.ts`
- Test: `apps/ms-siagie/test/geo.e2e-spec.ts`, `apps/ms-siagie/test/helpers/tokens.ts`

**Interfaces:**
- Consumes: `JwtAuthGuard`, `canAccessSchool`, `InternalKeyGuard`.
- Produces:
  - `SchoolAccessService.assertSchool(user: AuthUser, schoolId: string): Promise<School>`: 404 si no existe; 403 si `canAccessSchool` da false.
  - `SchoolAccessService.assertSection(user, sectionId): Promise<Section & { school: School }>`
  - `SchoolAccessService.assertEnrollment(user, enrollmentId)`
  - `SchoolAccessService.assertStudent(user, studentId)`: usa la matrícula del año en curso.
  - `POST /dres` y `POST /ugels`: MINEDU_ADMIN.
  - `POST /schools`: MINEDU_ADMIN o UGEL_SPECIALIST de esa UGEL.
  - `GET /schools?ugelId=`: filtrado por alcance.
  - `GET /schools/:id`.
  - `GET /internal/schools/:id` → `{ id, ugelId, dreId }` o 404.
  - `GET /internal/ugels/:id` → `{ id, dreId }`.
  - `GET /internal/dres/:id` → `{ id }`.
  - Todos los `/internal` usan `@Public()` + `InternalKeyGuard`.
  - Helper de test: `signTestToken(claims: Partial<AuthUser>): string` y un servidor JWKS de prueba levantado en `beforeAll`, con `AUTH_JWKS_URL` apuntando a él.

- [ ] **Step 1:** Escribir los tests e2e:
  - El admin crea una DRE, una UGEL y una IE → 201.
  - Un UGEL_SPECIALIST de otra UGEL crea una IE → 403.
  - El director de la IE A hace `GET /schools/:idB` → 403.
  - `GET /schools` como director → solo su IE.
  - `/internal/schools/:id` sin la cabecera → 401; con la cabecera → `{ id, ugelId, dreId }`; con un id inexistente → 404.
  - `modular_code` duplicado → 409.
- [ ] **Step 2:** Ejecutar → FAIL. Implementar (`P2002` se mapea a 409 con un filtro de excepciones en `libs/common`). Ejecutar → PASS.
- [ ] **Step 3:** Commit: `feat(siagie): DRE, UGEL e IE con control de alcance y API interna`.

### Task 9: Alta de usuarios y roles en ms-auth

**Files:**
- Create: `apps/ms-auth/src/users/users.controller.ts`, `users.service.ts`, `role-grant.policy.ts`, `dto/*.ts`, `apps/ms-auth/src/siagie/siagie.client.ts`
- Test: `apps/ms-auth/src/users/role-grant.policy.spec.ts`, `apps/ms-auth/test/users.e2e-spec.ts`

**Interfaces:**
- Consumes: `GET /internal/schools/:id`, `/internal/ugels/:id` y `/internal/dres/:id` (Tarea 8).
- Produces:
  - `SiagieClient.getSchool(id): Promise<{ id; ugelId; dreId } | null>`, más `getUgel` y `getDre`, con la cabecera interna y un timeout de 3 s.
  - `canGrant(granter: AuthUser, grant: RoleClaim, target: { ugelId?: string; dreId?: string }): boolean`, con estas reglas:
    - MINEDU_ADMIN puede todo.
    - UGEL_SPECIALIST otorga roles de IE en IEs de su UGEL.
    - DIRECTOR otorga TEACHER, TUTOR, AUXILIAR, SECRETARY y PSYCHOLOGIST en su IE.
    - Nadie se otorga un rol a sí mismo, salvo MINEDU_ADMIN.
  - `POST /users` con `{ documentType, documentNumber, firstName, lastName, email?, phone?, temporaryPassword }` → 201 `{ id }`, con `must_change_password=true`.
  - `POST /users/:id/roles` con `RoleClaim` → 201. Valida con `SiagieClient` que la IE, UGEL o DRE exista (si no → 422) y que el alcance coincida con el rol (rol de IE ⇒ `schoolId` obligatorio; UGEL_SPECIALIST ⇒ `ugelId`; DRE_SPECIALIST ⇒ `dreId`; si no → 400).
  - `DELETE /users/:id/roles/:roleId` → 204 (`is_active=false`).

- [ ] **Step 1:** Unit tests de `role-grant.policy.spec.ts`, uno por regla, cada una con un caso permitido y otro negado.
- [ ] **Step 2:** e2e, con `SiagieClient` reemplazado por un fake mediante `overrideProvider`:
  - El director crea un docente y le otorga TEACHER en su IE → 201.
  - El director otorga DIRECTOR → 403.
  - El director otorga TEACHER en otra IE → 403.
  - Una IE inexistente → 422.
  - TEACHER sin `schoolId` → 400.
  - Documento duplicado → 409.
- [ ] **Step 3:** Ejecutar → FAIL. Implementar. Ejecutar → PASS.
- [ ] **Step 4:** Commit: `feat(auth): alta de usuarios y roles con política de alcance`.

### Task 10: Secciones, estudiantes, apoderados, matrícula y pase de lista

**Files:**
- Create: `apps/ms-siagie/src/sections/*`, `src/students/*`, `src/enrollments/*`, `src/attendance/class-sessions.*`, `src/attendance/attendance.*`
- Test: `apps/ms-siagie/test/enrollment.e2e-spec.ts`, `apps/ms-siagie/test/attendance.e2e-spec.ts`

**Interfaces:**
- Consumes: `SchoolAccessService`.
- Produces:
  - `POST /sections`, `POST /students` (con `guardians[]` en el mismo body), `POST /enrollments` y `PATCH /enrollments/:id/status` con `{ status, statusReason }`. Todos para DIRECTOR o SECRETARY de la IE. `statusReason` es obligatorio si el status es distinto de ENROLLED.
  - `GET /sections/:id/students` → matrículas ENROLLED con datos del estudiante. Para cualquier rol de la IE.
  - `POST /class-sessions` con `{ sectionId, areaId?, date, periodNumber: 1..8 }`. Para TEACHER, TUTOR o AUXILIAR de la IE. El docente es el usuario actual.
  - `POST /attendance/bulk` con `{ sectionId, date, classSessionId?, records: [{ enrollmentId, status, justification? }] }` → `200 { saved: number }`. Para TUTOR, TEACHER, AUXILIAR o DIRECTOR de la IE. Hace upsert por la unique y usa `source=MANUAL`.

- [ ] **Step 1:** Tests e2e de matrícula:
  - El secretario matricula a un estudiante con 2 apoderados → 201.
  - Matrícula duplicada en el mismo año → 409.
  - `PATCH status=WITHDRAWN` sin `statusReason` → 400; con `statusReason` → 200 y `status_changed_at` registrado.
  - Un TEACHER intenta matricular → 403.
- [ ] **Step 2:** Tests e2e de asistencia (**Review Focus 3 y 4**):
  - El auxiliar pasa lista a 3 alumnos → `{ saved: 3 }`.
  - Reenviar la misma lista con un estado cambiado → `{ saved: 3 }`, con 3 filas en total y el estado actualizado.
  - Un `enrollmentId` de otra sección → 400 con `invalidEnrollmentIds`, y no se guarda ninguna fila.
  - Una matrícula WITHDRAWN → 400.
  - Fecha de mañana → 400.
  - El director de otra IE → 403.
  - Una lista por hora con `classSessionId` coexiste con la lista del día de la misma fecha.
- [ ] **Step 3:** Ejecutar → FAIL. Implementar (validar todo antes de escribir y escribir en una sola `$transaction`). Ejecutar → PASS.
- [ ] **Step 4:** Commit: `feat(siagie): secciones, matrícula y pase de lista por día y por hora`.

### Task 11: Notas literales y nota del periodo

**Files:**
- Create: `apps/ms-siagie/src/grades/period-grade.ts`, `grades.service.ts`, `grades.controller.ts`, `dto/*.ts`
- Test: `apps/ms-siagie/src/grades/period-grade.spec.ts`, `apps/ms-siagie/test/grades.e2e-spec.ts`

**Interfaces:**
- Produces:
  - `calculatePeriodGrade(entries: { columnNumber: number; value: LiteralGrade | null }[]): LiteralGrade | null`
  - `calculateAttendanceRate(statuses: AttendanceStatus[]): number` → porcentaje con 2 decimales. Cuentan como asistidos PRESENT, LATE y LEFT_EARLY. Lista vacía → 0.
  - `POST /grades/entries` con `{ enrollmentId, competencyId, periodId, columnNumber: 1..20, value: "AD"|"A"|"B"|"C"|null, isCompensatory?: boolean }` → 200. Hace upsert de la columna, recalcula y hace upsert de `period_grades` con `calculation_method = "MODE_RECENT_TIEBREAK"` y el `attendance_rate` de los registros del día (`class_session_id` nulo) dentro de las fechas del periodo. Permitido a TEACHER o TUTOR con un `teaching_assignment` en la sección y el área de la competencia; si no → 403.
- Algoritmo de la nota (decisión del plan; la regla oficial está marcada como "Validar" en la spec): se ignoran los `null`. Sin valores → `null`. Gana la nota más frecuente; si hay empate, gana la del `columnNumber` más alto entre las empatadas.

- [ ] **Step 1:** Unit tests:
  - `[A,A,B] → A`
  - `[A,B] → B` (empate; gana la columna más reciente)
  - `[AD,null,AD,C] → AD`
  - `[null,null] → null`
  - `[] → null`
  - `[C,B,B,C]` con columnas 1..4 → `C`
  - `calculateAttendanceRate([PRESENT,ABSENT,LATE,JUSTIFIED]) === 50`
- [ ] **Step 2:** Tests e2e:
  - Un docente con asignación registra 3 columnas → `period_grades.value` correcto.
  - Cambiar una columna recalcula la nota.
  - Un docente sin asignación en esa área → 403.
  - `value: "D"` → 400.
- [ ] **Step 3:** Ejecutar → FAIL. Implementar. Ejecutar → PASS.
- [ ] **Step 4:** Commit: `feat(siagie): registro auxiliar de notas literales y nota del periodo`.

### Task 12: Carné QR e ingreso y salida

**Files:**
- Create: `apps/ms-siagie/src/access/qr.service.ts`, `access.controller.ts`, `dto/*.ts`
- Test: `apps/ms-siagie/test/access.e2e-spec.ts`

**Interfaces:**
- Produces:
  - `POST /students/:id/qr` → `201 { token }`: devuelve el token **una sola vez** (32 bytes en base64url) y revoca la credencial activa anterior. Para DIRECTOR o SECRETARY de la IE.
  - `POST /access-events` con `{ token?: string, studentId?: string, type: "ENTRY"|"EXIT", deviceId?: string }` (exactamente uno de `token` o `studentId`) → 201 `{ id, studentId, type, occurredAt }`. `method` es QR si viene token y MANUAL si viene `studentId`. `school_id` sale de la matrícula del año en curso. Para AUXILIAR, DIRECTOR o SECRETARY de esa IE.

- [ ] **Step 1:** Tests e2e:
  - Emitir un QR y registrar ENTRY con el token → 201 y `method=QR`.
  - Volver a emitir el QR y usar el token anterior → 404.
  - Un token inventado → 404.
  - Mandar a la vez `token` y `studentId` → 400.
  - EXIT manual por `studentId` → 201 y `method=MANUAL`.
  - Un auxiliar de otra IE escanea el token → 403.
  - El token no se guarda en claro (`token_hash` es distinto del token).
- [ ] **Step 2:** Ejecutar → FAIL. Implementar. Ejecutar → PASS.
- [ ] **Step 3:** Commit: `feat(siagie): carné QR y registro de ingreso y salida`.

### Task 13: Resumen del estudiante, seeds sintéticos y prueba de punta a punta

**Files:**
- Create: `libs/fixtures/src/seed-ids.ts`, `apps/ms-auth/prisma/seed.ts`, `apps/ms-siagie/prisma/seed.ts`, `apps/ms-siagie/test/cross-service.e2e-spec.ts`
- Modify: `apps/ms-siagie/src/students/students.controller.ts` (añadir el resumen), `package.json` (scripts `auth:seed` y `siagie:seed`)

**Interfaces:**
- Produces:
  - `GET /students/:id/summary` → `{ student, enrollment, attendance: { present, absent, late, justified, rate }, periodGrades: [{ competencyCode, periodNumber, value }] }`, para el año en curso. Para cualquier rol con alcance sobre la IE. Cada llamada escribe un `audit_logs` con `action="VIEW_STUDENT"`, `entity="student"`, el `entity_id` y el `user_id`. El e2e del Step 1 verifica que se creó esa fila.
  - `SEED_IDS` con UUID fijos para: `dreUcayali`, `ugelCoronelPortillo`, `school`, `sections.a1` y `sections.b1`, y los usuarios `admin`, `ugelSpecialist`, `director`, `secretary`, `tutorA`, `tutorB`, `teacherMat`, `teacherCom`, `auxiliar` y `psychologist`.
- Datos del seed (todos **sintéticos**, marcados así en `name`):
  - DRE Ucayali y UGEL Coronel Portillo.
  - IE secundaria pública urbana "IE Sintética Demo", con `modular_code` `9999901`, ubigeo `250101` y `attention_goal` 70.
  - 4 bimestres de 2026.
  - Secciones 1.° A y 1.° B.
  - Áreas MAT y COM, con 2 competencias cada una.
  - 60 estudiantes (30 por sección) con nombres generados a partir de listas fijas, sin librerías nuevas, cada uno con un apoderado con `whatsapp_opt_in=true`.
  - Las contraseñas salen de `SEED_PASSWORD`.
  - Los seeds son idempotentes (upsert por los UUID fijos).

- [ ] **Step 1:** e2e `cross-service`: levanta **ambas** apps en el mismo proceso, en puertos aleatorios. ms-siagie usa como `AUTH_JWKS_URL` el puerto de ms-auth. Corre los seeds contra los schemas `_test`. Luego:
  - El director hace login **real** en ms-auth y llama a `GET /sections/:a1/students` en ms-siagie → 30 alumnos.
  - Un director de otra IE (creado en el test) → 403.
  - Se apaga ms-auth y el mismo access token sigue funcionando en ms-siagie.
  - `GET /students/:id/summary` después de un pase de lista → `attendance.present === 1`.
- [ ] **Step 2:** Ejecutar → FAIL. Implementar el resumen y los seeds. Ejecutar → PASS.
- [ ] **Step 3:** Correr la suite completa: `npm run lint && npx jest && npx jest --config apps/ms-auth/test/jest-e2e.json && npx jest --config apps/ms-siagie/test/jest-e2e.json` → todo en verde.
- [ ] **Step 4:** **Con confirmación del usuario**, ejecutar `npm run auth:seed && npm run siagie:seed` contra los schemas reales `auth` y `siagie`.
- [ ] **Step 5:** Documentar en `README.md` (sección "Backend") cómo crear el `.env`, migrar, sembrar y levantar ambas apps. Commit: `feat: seeds sintéticos, resumen del estudiante y prueba entre servicios`.
