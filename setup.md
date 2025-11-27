# Guía de Configuración para Pruebas

Instrucciones paso a paso para configurar las pruebas locales con Ganache.

## Requisitos Previos

- **Node.js** (v18 o superior)
- **npm** o **bun**
- **Ganache CLI**: `npm install -g ganache`

## Paso 1: Instalar Dependencias
```bash
npm install
```

## Paso 2: Iniciar Ganache
```bash
ganache --port 7545 --networkId 1337 --mnemonic "twin shadow palm spy donor slight muscle obtain during gentle smart cushion"
```

Deja esta terminal en ejecución.

## Paso 3: Configurar las Variables de Entorno

Copia el archivo de entorno de ejemplo:
```bash
cp .env.example .env.local
```

Los valores predeterminados en `.env.example` ya están configurados para pruebas locales. Deja las direcciones de los contratos vacías por ahora.

## Paso 4: Desplegar los Contratos Inteligentes

Abre una nueva terminal y ejecuta:
```bash
npx hardhat run scripts/deploy.cjs --network ganache
```

Copia las direcciones de los contratos desplegados de la salida y actualiza tu `.env.local`:
```env
NEXT_PUBLIC_DAO_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_GOVERNANCE_DAO_ADDRESS=0x...
NEXT_PUBLIC_GOVERNANCE_DAO_ADDRESS-0x...
```

## Paso 5:
Ejecutar las Pruebas:
```bash
npx hardhat test

```
Ejecutar las pruebas con cobertura:
```bash
npm run test:coverage
```

## Paso 6: Conectar MetaMask a Ganache

1. **Abre MetaMask** en la extensión del navegador
2. **Agrega una red personalizada**:

    - Haz clic en el menú desplegable de red
    - Haz clic en "Agregar red" → "Agregar una red manualmente"
    - Completa los detalles:
        - **Nombre de la red**: `Ganache Local`
        - **URL de RPC**: `http://127.0.0.1:7545`
        - **ID de cadena**: `1337`
        - **Símbolo de moneda**: `ETH`
    - Haz clic en "Guardar"

3. **Importa una cuenta de Ganache**:
    - En MetaMask, haz clic en el ícono de cuenta
    - Haz clic en "Importar cuenta"
    - Selecciona "Clave privada"
    - Ve a la salida de la terminal de Ganache y copia una de las claves privadas
    - Pégala en MetaMask y haz clic en "Importar"

Ahora deberías ver 1000 ETH en tu cuenta importada.

## Paso 7: Iniciar el Servidor de Desarrollo
```bash
npm run dev
```

La aplicación estará disponible en http://localhost:3000

## Solución de Problemas

### "Error: connect ECONNREFUSED 127.0.0.1:7545"

Asegúrate de que Ganache esté en ejecución en el puerto 7545.

### Los contratos necesitan ser redesplegar

Reinicia Ganache (esto reinicia la blockchain) y ejecuta el script de despliegue nuevamente.