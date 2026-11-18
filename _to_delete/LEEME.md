# Archivos apartados (revisar y borrar)

Nada de aquí lo usa la app. Se movió en vez de borrarse para poder revisarlo.

## raiz-duplicados/
Se subieron sueltos a la raíz desde la web de GitHub (commit dfe71dc).

- `app.ts`, `auth.ts`, `config.ts`, `store.ts`, `stripeService.ts`, `validation.ts`:
  **idénticos byte a byte** a `server/*.ts` (salida del parche 0001). La copia viva está en `server/`.
- `security.test.ts`: idéntico a `server/tests/security.test.ts`.
- `env.example`: idéntico a `.env.example`.
- `README.md`: idéntico al `README.md` de la raíz actual (antes `NexxusTech/README.md`).
- `gitignore-raiz-anterior`: el `.gitignore` de la raíz anterior. Tenía `**/data/`, que también
  ignoraba `src/data/` (el contenido de las materias). Se reemplazó por el `.gitignore` de la app.
- `config.jsonc`: vacío (0 bytes).

## parches-aplicados/
`0001-…patch` (seguridad y despliegue) y `0002-…patch` (reestructura del front a `src/`).
Ya están aplicados en la rama `fix/build-y-guinda`. El 0002 se aplicó con `--ignore-whitespace`
porque 3 archivos solo diferían en fin de línea/espacios.

Las definiciones de entidades de Base44 (`*.jsonc`) no se apartaron: están en `docs/entidades-base44/`.
