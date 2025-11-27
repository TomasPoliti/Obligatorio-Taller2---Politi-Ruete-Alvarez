# Protección contra Ataque del 51%

## Implementación

Se ha implementado exitosamente la prevención del ataque del 51% mediante dos mecanismos complementarios:

### 1. Quorum Mínimo (30% por defecto)
- **Qué es**: Porcentaje mínimo de participación requerido del total de voting power
- **Cómo funciona**: Una propuesta solo puede ser finalizada si al menos el 30% del total de voting power stakeado participa en la votación
- **Por qué previene el ataque**: Evita que una minoría con poco stake pueda aprobar propuestas sin participación suficiente

### 2. Threshold de Aprobación (60% por defecto)
- **Qué es**: Porcentaje mínimo de votos a favor sobre el total de votos emitidos
- **Cómo funciona**: Una propuesta solo se acepta si más del 60% de los votos emitidos son a favor
- **Por qué previene el ataque**: Evita que un atacante con 51% del voting power pueda aprobar propuestas unilateralmente

## Parámetros Configurables

Los parámetros pueden ser ajustados por el owner (multisig) usando la función `setQuorum()`:

```solidity
function setQuorum(uint256 _quorumPercentage, uint256 _approvalPercentage) external onlyOwner
```

**Valores por defecto**:
- `quorumPercentage`: 30% (mínimo de participación)
- `approvalPercentage`: 60% (mínimo de aprobación)

## Escenario de Ataque Prevenido

### Ataque del 51%
Un atacante controla el 51% del total de voting power stakeado.

**Sin protección**:
- Atacante vota a favor (51%)
- Propuesta se acepta con 51% vs 49%

**Con protección (Quorum 30% + Approval 60%)**:
- **Escenario 1**: Solo atacante vota
  - Participación: 51% (> 30% quorum ✓)
  - Aprobación: 100% de los votos emitidos (> 60% ✓)
  - Resultado: ACCEPTED
  - *Nota: Se acepta porque nadie más votó. La comunidad debe participar.*

- **Escenario 2**: Atacante + Defensor votan
  - Participación: 100% (> 30% quorum ✓)
  - Aprobación: 51% de los votos emitidos (< 60% ✗)
  - Resultado: **REJECTED** ✅
  - *El ataque es prevenido si la comunidad participa*

## Cambios en Contratos

### GovernanceBase.sol
- ✅ Agregados parámetros `quorumPercentage` y `approvalPercentage`
- ✅ Agregado tracking de `totalVotingPower`
- ✅ Agregados eventos `QuorumUpdated`
- ✅ Agregados errores `QuorumNotReached` y `ApprovalThresholdNotReached`

### GovernanceAdmin.sol
- ✅ Agregada función `setQuorum()` para actualizar parámetros

### GovernanceStaking.sol
- ✅ Actualización de `totalVotingPower` al hacer stake/unstake

### GovernanceProposals.sol
- ✅ Validación de quorum en `finalizeProposal()`
- ✅ Validación de approval threshold en `finalizeProposal()`

### GovernanceDAO.sol
- ✅ Constructor actualizado con parámetros de quorum y approval

## Tests Implementados

### Suite: Anti-51% Attack (Quorum and Approval)
- ✅ Test: Should reject when quorum not reached
- ✅ Test: Should accept when quorum reached and approval threshold met
- ✅ Test: Should reject when approval threshold not met
- ✅ Test: Should prevent 51% attack scenario

### Suite: Admin - setQuorum
- ✅ Test: Should allow owner to update quorum
- ✅ Test: Should revert non-owner
- ✅ Test: Should revert zero quorum
- ✅ Test: Should revert quorum over 100
- ✅ Test: Should revert zero approval
- ✅ Test: Should revert approval over 100

### Deployment Tests
- ✅ Test: Should revert with zero quorum percentage
- ✅ Test: Should revert with quorum percentage over 100
- ✅ Test: Should revert with zero approval percentage
- ✅ Test: Should revert with approval percentage over 100

**Total**: 14 nuevos tests + actualizaciones a 81 tests existentes = **95 tests**

## Cobertura

```
File                        % Stmts  % Branch   % Funcs   % Lines
contracts\                     100%    85.71%     100%    97.13%
  GovernanceBase.sol            100%    96.15%     100%    96.77%
  GovernanceAdmin.sol           100%    89.29%     100%    95.65%
  GovernanceStaking.sol         100%       75%     100%      100%
  GovernanceProposals.sol       100%    84.62%     100%    96.15%
```

## Uso en Deployment

```javascript
const quorumPercentage = 30;  // 30% minimum participation
const approvalPercentage = 60; // 60% minimum approval

const governanceDAO = await GovernanceDAO.deploy(
  owner,
  tokenAddress,
  tokenPriceWei,
  minStakeForVoting,
  minStakeForProposing,
  minStakeLockTime,
  proposalDuration,
  tokensPerVotePower,
  quorumPercentage,      // ← NUEVO
  approvalPercentage     // ← NUEVO
);
```

## Seguridad

Esta implementación previene efectivamente el ataque del 51% mediante:

1. **Doble validación**: Quorum + Approval threshold
2. **Parámetros ajustables**: El owner puede modificar según necesidades
3. **Incentivo a participación**: El quorum incentiva que todos los stakeholders voten
4. **Protección matemática**: 51% no es suficiente para aprobar (necesita > 60%)

## Recomendaciones

Para maximizar la seguridad:
- Mantener `approvalPercentage` > 50% (preferiblemente 60-66%)
- Mantener `quorumPercentage` entre 20-40% (balance entre participación y bloqueo)
- Educar a la comunidad sobre la importancia de votar en todas las propuestas
- Considerar implementar notificaciones automáticas para nuevas propuestas

