# Governance DAO - Obligatorio Taller 2

Proyecto de DAO (Organización Autónoma Descentralizada) con sistema de gobernanza basado en staking de tokens ERC20.

## 📋 Descripción

Sistema completo de gobernanza descentralizada que incluye:
- Token ERC20 personalizado (DaoToken)
- Sistema de staking para votar y proponer
- Propuestas y votaciones
- Propuestas de tesoro (treasury)
- Controles de pánico
- Compra de tokens

## 🏗️ Arquitectura

### Smart Contracts

- **DaoToken.sol**: Token ERC20 con función mint
- **GovernanceDAO.sol**: Contrato principal que hereda de:
  - **GovernanceProposals**: Lógica de propuestas y votaciones
  - **GovernanceStaking**: Lógica de staking
  - **GovernanceAdmin**: Funciones administrativas
  - **GovernanceBase**: Estado base y modifiers

### Frontend

Next.js 16 con React 19, TailwindCSS y ethers.js para interacción con blockchain.

## 🧪 Testing

### Cobertura de Tests

El proyecto cuenta con **100% de cobertura** en statements y functions:

```
File                        % Stmts  % Branch   % Funcs   % Lines
contracts\                     100     85.48       100     97.32
  DaoToken.sol                  100       100       100       100
  GovernanceDAO.sol             100       100       100       100
  GovernanceAdmin.sol           100     88.46       100     95.45
  GovernanceBase.sol            100     94.44       100     95.65
  GovernanceProposals.sol       100     86.96       100     97.06
  GovernanceStaking.sol         100        75       100       100
```

### Comandos de Testing

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests con coverage
npm run test:coverage

# Ver reporte de coverage (genera archivos HTML)
npm run test:coverage
# Luego abrir: coverage/index.html
```

### Documentación de Tests

Ver [TEST_COVERAGE.md](./TEST_COVERAGE.md) para detalles completos sobre:
- Descripción de cada suite de tests
- Escenarios edge case cubiertos
- Explicación de branches no cubiertos

## 🚀 Inicio Rápido

### Prerequisitos

- Node.js v18 o superior
- npm o bun
- Ganache (para red local)

### Instalación

```bash
# Instalar dependencias
npm install

# Compilar contratos
npx hardhat compile
```

### Deployment Local

Ver [TESTING_SETUP.md](./TESTING_SETUP.md) para instrucciones detalladas de:
- Configuración de Ganache
- Deploy de contratos
- Configuración de MetaMask

```bash
# 1. Iniciar Ganache
ganache --port 7545 --networkId 1337

# 2. Deploy contratos
npx hardhat run scripts/deploy.cjs --network ganache

# 3. Iniciar frontend
npm run dev
```

## 📦 Scripts Disponibles

```bash
npm run dev          # Iniciar servidor de desarrollo
npm run build        # Build de producción
npm run start        # Iniciar servidor de producción
npm run lint         # Ejecutar linter
npm test             # Ejecutar tests
npm run test:coverage # Ejecutar tests con coverage
```

## 🔧 Tecnologías

### Smart Contracts
- Solidity ^0.8.20
- Hardhat
- OpenZeppelin Contracts
- Ethers.js v6

### Frontend
- Next.js 16
- React 19
- TailwindCSS 4
- TypeScript

### Testing
- Hardhat Network Helpers
- Chai
- Solidity Coverage

## 📄 Licencia

MIT

## 👥 Autores

Politi - Ruete - Alvarez

---

Para más información sobre testing, ver [TEST_COVERAGE.md](./TEST_COVERAGE.md)
Para setup de testing local, ver [TESTING_SETUP.md](./TESTING_SETUP.md)
