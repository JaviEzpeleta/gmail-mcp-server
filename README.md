# Gmail MCP Server

Servidor MCP (Model Context Protocol) para interactuar con Gmail usando OAuth2.

## Configuración

### 1. Configurar Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la Gmail API:
   - Ve a "APIs & Services" → "Library"
   - Busca "Gmail API"
   - Click en "Enable"

### 2. Crear credenciales OAuth2

1. Ve a "APIs & Services" → "Credentials"
2. Click en "CREATE CREDENTIALS" → "OAuth client ID"
3. Tipo de aplicación: "Desktop app"
4. Dale un nombre (ej: "Gmail MCP Server")
5. Descarga las credenciales

### 3. Configurar OAuth consent screen

1. Ve a "APIs & Services" → "OAuth consent screen"
2. Configura la información básica de tu app
3. En "Test users", añade los emails que usarán la aplicación
4. Guarda los cambios

### 4. Configurar variables de entorno

1. Copia las credenciales a tu archivo `.env`:
```
GMAIL_CLIENT_ID=tu_client_id
GMAIL_CLIENT_SECRET=tu_client_secret
GMAIL_REFRESH_TOKEN=
```

2. Genera el refresh token:
```bash
npm run dev src/get-refresh-token-desktop.ts
```

3. Copia el refresh token al archivo `.env`

## Uso

### Uso standalone

1. Compilar:
```bash
npm run build
```

2. Ejecutar:
```bash
npm start
```

### Configuración con Claude Desktop

1. Compila el proyecto:
```bash
npm run build
```

2. Crea o edita el archivo de configuración de Claude Desktop:
   - En macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - En Windows: `%APPDATA%\Claude\claude_desktop_config.json`

3. Añade la configuración del servidor MCP:
```json
{
  "mcpServers": {
    "gmail": {
      "command": "node",
      "args": ["/ruta/completa/a/tu/proyecto/dist/index.js"],
      "env": {
        "GMAIL_CLIENT_ID": "tu_client_id",
        "GMAIL_CLIENT_SECRET": "tu_client_secret",
        "GMAIL_REFRESH_TOKEN": "tu_refresh_token"
      }
    }
  }
}
```

4. Reinicia Claude Desktop para que cargue la nueva configuración

## Herramientas disponibles

- `list_emails`: Lista emails recientes
- `send_email`: Envía un email
- `search_emails`: Busca emails con query de Gmail

## Solución de problemas

### Error 403: access_denied

Si ves este error, necesitas añadir tu email como tester en Google Cloud Console:
1. Ve a "OAuth consent screen"
2. En "Test users", añade tu email
3. Intenta autorizar de nuevo