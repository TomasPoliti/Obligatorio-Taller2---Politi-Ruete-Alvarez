# Obligatorio Taller 2 – DAO Governance

Aplicación en Node.js + Hardhat que implementa una DAO con token ERC‑20, staking, propuestas y un tipo especial de propuesta de *treasury* (Conjunto C del enunciado).

## Requisitos

- Node.js 20+
- npm 10+
- Hardhat (se instala como devDependency con `npm install`)
- Ganache **o** `npx hardhat node` para simular la red Ethereum
- Metamask (u otra wallet compatible con Ethereum) para probar la dApp desde el navegador

## Instalación

Desde la raíz del proyecto:

```bash
npm install
```

Esto instala las dependencias de backend, frontend y Hardhat (toolbox, chai matchers, etc.).

## Contratos inteligentes

### Compilar contratos

```bash
npx hardhat compile
```

Usa Solidity 0.8.20 con optimizer y `viaIR` habilitado, lo que evita errores de *stack too deep*.

### Ejecutar tests de contratos

```bash
npx hardhat test
```

La suite cubre `contracts/DaoToken.sol` y `contracts/GovernanceDAO.sol` (incluyendo Conjunto C: propuestas de treasury). Actualmente todos los tests pasan.

### Coverage (opcional)

Si querés ver coverage detallado:

```bash
npx hardhat coverage
```

> Nota: genera un reporte en la carpeta `coverage/`.

---

## Levantar entorno local completo (contratos + backend + frontend)

Hay dos variantes posibles de red: Hardhat Node o Ganache. El backend está preparado para hablar con cualquier RPC que expongas en `RPC_URL`.

### 1. Levantar una red Ethereum local

#### Opción A: Hardhat Node (recomendada)

En terminal:

npx hardhat node


Esto levanta un nodo en `http://127.0.0.1:8545` con varias cuentas prefundidas.

#### Opción B: Ganache

Configurada en `hardhat.config.js` como red `ganache`:

- URL: `http://127.0.0.1:7545`
- `mnemonic`: configurado en el propio `hardhat.config.js`

En Ganache, configurá el mismo mnemonic o usá el que viene por defecto y luego usá la red `ganache` en los comandos de Hardhat con `--network ganache`.

### 2. Deploy de contratos en la red local

Con la red corriendo (Hardhat o Ganache), en otra terminal:

```bash
npx hardhat console --network localhost    # si usás npx hardhat node
# o
npx hardhat console --network ganache      # si usás Ganache
```

Dentro de la consola de Hardhat ejecutá:

```js
const [owner, panicMultisig] = await ethers.getSigners();

const DaoToken = await ethers.getContractFactory("DaoToken");
const token = await DaoToken.deploy("DAO Token", "DTK", owner.address);
await token.waitForDeployment();

const GovernanceDAO = await ethers.getContractFactory("GovernanceDAO");
const dao = await GovernanceDAO.deploy(
  owner.address,
  await token.getAddress(),
  ethers.parseEther("0.001"), // tokenPriceWei
  ethers.parseEther("100"),   // minStakeForVoting
  ethers.parseEther("100"),   // minStakeForProposing
  60n,                        // minStakeLockTime (segundos)
  3600n,                      // proposalDuration (segundos)
  ethers.parseEther("10")     // tokensPerVotePower
);
await dao.waitForDeployment();

console.log("TOKEN_ADDRESS =", await token.getAddress());
console.log("DAO_ADDRESS   =", await dao.getAddress());
```

Guardá los valores impresos de `TOKEN_ADDRESS` y `DAO_ADDRESS`, los vas a usar para configurar el backend.

> Opcional: desde la misma consola podés configurar la `panicWallet` con  
> `await dao.setPanicWallet(panicMultisig.address);` para poder operar la DAO.

### 3. Configurar variables de entorno del backend

El backend (`controllers/daoController.js`) necesita saber dónde están los contratos y qué RPC usar. Las variables son:

- `DAO_ADDRESS`: address del contrato `GovernanceDAO` desplegado.
- `TOKEN_ADDRESS`: address del contrato `DaoToken` desplegado.
- `RPC_URL`: URL del nodo Ethereum local. Por defecto es `http://127.0.0.1:8545`.

En PowerShell (Windows), desde la raíz del proyecto:

```powershell
$env:DAO_ADDRESS="0x..."
$env:TOKEN_ADDRESS="0x..."
$env:RPC_URL="http://127.0.0.1:8545"   # o la URL de Ganache
npm run dev
```

En bash (Linux/macOS):

```bash
export DAO_ADDRESS=0x...
export TOKEN_ADDRESS=0x...
export RPC_URL=http://127.0.0.1:8545
npm run dev
```

### 4. Levantar backend + frontend

Con las variables de entorno seteadas, ejecutá:

```bash
npm run dev
```

- El backend Express se levanta en `http://localhost:3000`.
- Sirve el frontend estático desde `public/`.
- Expone la API REST usada por la dApp:
  - `GET /health`
  - `GET /dao/parameters`
  - `GET /dao/user/:address`
  - `GET /dao/proposals`
  - `GET /dao/proposals/:id`

Finalmente, abrí en el navegador:

```text
http://localhost:3000
```

La dApp permite:

- Ver parámetros de la DAO (pánico, pausada, staking mínimo, token price, etc.).
- Ver listado de propuestas y su detalle (incluyendo propuestas de treasury).
- Ver el estado de cuenta del usuario (balance de tokens, staking y voting power).
- Conectarse con Metamask para leer la cuenta actual (las acciones de crear/votar propuestas se hacen directamente desde la wallet hacia los contratos).

---

## Sólo ver el frontend (sin contratos)

Si solo querés ver la UI, sin conectar a un nodo Ethereum ni contratos:

```bash
npm install
npm run dev
```

Y abrís `http://localhost:3000`.

Las llamadas a `/dao/*` pueden fallar o mostrar errores porque no habrá contratos configurados, pero la interfaz carga igual (sirve para revisar el diseño).

---

## Notas

- Los contratos y tests están pensados para usarse con redes EVM compatibles (Hardhat, Ganache, testnets de Ethereum/Polygon).
- Para la entrega final, deberás desplegar `DaoToken` y `GovernanceDAO` en una testnet pública (por ejemplo Sepolia o Mumbai) y verificar los contratos en Etherscan/Polygonscan. Este repo cubre la parte de implementación y pruebas locales.

