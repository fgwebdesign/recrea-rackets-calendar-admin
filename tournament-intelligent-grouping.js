/**
 * 🎯 AGRUPACIÓN INTELIGENTE 100% AUTOMÁTICA
 *
 * Objetivo: Agrupar equipos y asignar días AUTOMÁTICAMENTE a TODOS los grupos
 *
 * Estrategia MEJORADA:
 * 1. Clasificar equipos por preferencia de día (día 1, día 2, o flexibles)
 * 2. Formar grupos homogéneos que jueguen todo en el mismo día
 * 3. Usar equipos flexibles para completar grupos
 * 4. Para grupos mixtos: CALCULAR automáticamente el mejor día usando scoring
 * 5. Balancear carga entre días (evitar sobrecarga de un solo día)
 *
 * NOTA: Ya no existen grupos sin día asignado. Todos reciben DAY_1 o DAY_2.
 */

/**
 * Clasifica a un equipo según su preferencia de día basado en sus restricciones
 * @param {Array} unavailable_times - Array de slot IDs no disponibles (ej: ["slot_day1_1700", "slot_day2_0800"])
 * @returns {Object} Preferencia de día y detalles
 */
function classifyTeamByDayPreference(unavailable_times) {
  if (!unavailable_times || unavailable_times.length === 0) {
    return {
      preference: 'FLEXIBLE',
      score: 0,
      day1_restrictions: 0,
      day2_restrictions: 0,
      details: 'Sin restricciones - puede jugar cualquier día'
    };
  }

  // 🔧 CORRECCIÓN: Parsear slot IDs con prefijo de día
  // Formato nuevo: "slot_day1_1700", "slot_day2_0800"
  // Formato viejo (retrocompatibilidad): "17:00", "08:00"
  
  // IMPORTANTE: Si un equipo NO PUEDE jugar en ciertos slots del día 1,
  // entonces PREFIERE jugar en el día 2 (y viceversa)
  
  const day1Hours = unavailable_times.filter(slotId => {
    // Formato nuevo: "slot_day1_HHMM"
    if (slotId.startsWith('slot_day1_')) {
      return true;
    }
    // Formato viejo: parsear hora (retrocompatibilidad)
    if (slotId.includes(':')) {
      const hour = parseInt(slotId.split(':')[0]);
      return hour >= 17 && hour <= 23;
    }
    return false;
  });

  const day2Hours = unavailable_times.filter(slotId => {
    // Formato nuevo: "slot_day2_HHMM"
    if (slotId.startsWith('slot_day2_')) {
      return true;
    }
    // Formato viejo: parsear hora (retrocompatibilidad)
    if (slotId.includes(':')) {
      const hour = parseInt(slotId.split(':')[0]);
      return hour >= 8 && hour < 17;
    }
    return false;
  });

  const day1_restrictions = day1Hours.length;
  const day2_restrictions = day2Hours.length;

  // 🔧 LÓGICA CORREGIDA:
  // - Si tiene restricciones en día 1 (17:00-23:00) → NO puede jugar día 1 → prefiere DÍA 2
  // - Si tiene restricciones en día 2 (08:00-16:45) → NO puede jugar día 2 → prefiere DÍA 1
  // - Si tiene restricciones mixtas → flexible (pero con penalización)

  if (day1_restrictions > day2_restrictions) {
    // Más restricciones en horarios de día 1 → Prefiere jugar en día 2
    return {
      preference: 'DAY_2',
      score: day1_restrictions - day2_restrictions,
      day1_restrictions,
      day2_restrictions,
      details: `Prefiere día 2 (tiene ${day1_restrictions} restricciones en horarios 17:00-23:00, solo ${day2_restrictions} en 08:00-16:45)`
    };
  } else if (day2_restrictions > day1_restrictions) {
    // Más restricciones en horarios de día 2 → Prefiere jugar en día 1
    return {
      preference: 'DAY_1',
      score: day2_restrictions - day1_restrictions,
      day1_restrictions,
      day2_restrictions,
      details: `Prefiere día 1 (tiene ${day2_restrictions} restricciones en horarios 08:00-16:45, solo ${day1_restrictions} en 17:00-23:00)`
    };
  } else if (day1_restrictions > 0 && day2_restrictions > 0) {
    // Restricciones en ambos días
    return {
      preference: 'MIXED',
      score: 0,
      day1_restrictions,
      day2_restrictions,
      details: 'Restricciones en ambos períodos - difícil de programar'
    };
  } else {
    // Sin restricciones o solo en un día pero igual cantidad
    return {
      preference: 'FLEXIBLE',
      score: 0,
      day1_restrictions,
      day2_restrictions,
      details: 'Sin restricciones o neutral - puede jugar cualquier día'
    };
  }
}

/**
 * Agrupa equipos de manera inteligente priorizando jugar en un solo día
 * @param {Array} teams - Equipos con sus restricciones
 * @param {Object} format - Formato del torneo (teams_per_group, groups_count)
 * @param {Object} availableSlots - Slots disponibles por día (opcional, para validación multi-categoría)
 * @returns {Array} Grupos distribuidos con asignación de día preferido
 */
export function distributeTeamsByDayPreference(teams, format, availableSlots = null) {
  console.log('\n🎯 ========== INICIANDO AGRUPACIÓN INTELIGENTE POR DÍA ==========');
  console.log(`📊 Total equipos: ${teams.length}`);
  console.log(`🎲 Formato: ${format.groups_count} grupos de ${format.teams_per_group} equipos`);

  // 1. Clasificar todos los equipos por preferencia de día
  const teamsWithPreference = teams.map(team => {
    const preference = classifyTeamByDayPreference(team.unavailable_times);
    return {
      ...team,
      day_preference: preference
    };
  });

  // 2. Agrupar por categoría de preferencia
  const day1Teams = teamsWithPreference.filter(t => t.day_preference.preference === 'DAY_1')
    .sort((a, b) => b.day_preference.score - a.day_preference.score); // Mayor score = más fuerte preferencia

  const day2Teams = teamsWithPreference.filter(t => t.day_preference.preference === 'DAY_2')
    .sort((a, b) => b.day_preference.score - a.day_preference.score);

  const flexibleTeams = teamsWithPreference.filter(t => t.day_preference.preference === 'FLEXIBLE');

  const mixedTeams = teamsWithPreference.filter(t => t.day_preference.preference === 'MIXED');

  console.log(`\n📋 CLASIFICACIÓN DE EQUIPOS:`);
  console.log(`   ☀️  Prefieren DÍA 1: ${day1Teams.length} equipos`);
  console.log(`   🌙 Prefieren DÍA 2: ${day2Teams.length} equipos`);
  console.log(`   🔄 FLEXIBLES: ${flexibleTeams.length} equipos`);
  console.log(`   ⚠️  MIXTOS (difíciles): ${mixedTeams.length} equipos`);

  // 3. Formar grupos homogéneos
  const groups = [];
  const usedTeamIds = new Set();

  // 3a. Formar grupos COMPLETOS de día 1
  console.log(`\n🔹 FASE 1: Formando grupos homogéneos de DÍA 1...`);
  while (day1Teams.length >= format.teams_per_group && groups.length < format.groups_count) {
    const group = day1Teams.splice(0, format.teams_per_group);
    group.forEach(t => usedTeamIds.add(t.id));
    groups.push({
      teams: group,
      preferred_day: 'DAY_1',
      is_homogeneous: true
    });
    console.log(`   ✅ Grupo ${groups.length} (DÍA 1): ${group.map(t => t.id.substring(0, 8)).join(', ')}`);
  }

  // 3b. Formar grupos COMPLETOS de día 2
  console.log(`\n🔹 FASE 2: Formando grupos homogéneos de DÍA 2...`);
  while (day2Teams.length >= format.teams_per_group && groups.length < format.groups_count) {
    const group = day2Teams.splice(0, format.teams_per_group);
    group.forEach(t => usedTeamIds.add(t.id));
    groups.push({
      teams: group,
      preferred_day: 'DAY_2',
      is_homogeneous: true
    });
    console.log(`   ✅ Grupo ${groups.length} (DÍA 2): ${group.map(t => t.id.substring(0, 8)).join(', ')}`);
  }

  // 4. Completar grupos con equipos restantes + flexibles
  console.log(`\n🔹 FASE 3: Completando grupos con equipos restantes...`);

  const remainingTeams = [...day1Teams, ...day2Teams, ...flexibleTeams, ...mixedTeams];
  console.log(`   📦 Equipos disponibles: ${remainingTeams.length}`);

  while (groups.length < format.groups_count && remainingTeams.length >= format.teams_per_group) {
    const group = [];

    // Estrategia: intentar mantener preferencia mayoritaria
    const day1Count = remainingTeams.filter(t => t.day_preference.preference === 'DAY_1').length;
    const day2Count = remainingTeams.filter(t => t.day_preference.preference === 'DAY_2').length;

    let preferredDay = 'MIXED';
    if (day1Count >= format.teams_per_group) {
      preferredDay = 'DAY_1';
      // Tomar equipos de día 1 primero
      for (let i = 0; i < format.teams_per_group && remainingTeams.length > 0; i++) {
        const idx = remainingTeams.findIndex(t => t.day_preference.preference === 'DAY_1' || t.day_preference.preference === 'FLEXIBLE');
        if (idx !== -1) {
          group.push(remainingTeams.splice(idx, 1)[0]);
        } else {
          group.push(remainingTeams.shift());
        }
      }
    } else if (day2Count >= format.teams_per_group) {
      preferredDay = 'DAY_2';
      // Tomar equipos de día 2 primero
      for (let i = 0; i < format.teams_per_group && remainingTeams.length > 0; i++) {
        const idx = remainingTeams.findIndex(t => t.day_preference.preference === 'DAY_2' || t.day_preference.preference === 'FLEXIBLE');
        if (idx !== -1) {
          group.push(remainingTeams.splice(idx, 1)[0]);
        } else {
          group.push(remainingTeams.shift());
        }
      }
    } else {
      // Grupo mixto inevitable
      for (let i = 0; i < format.teams_per_group && remainingTeams.length > 0; i++) {
        group.push(remainingTeams.shift());
      }
    }

    if (group.length === format.teams_per_group) {
      group.forEach(t => usedTeamIds.add(t.id));
      groups.push({
        teams: group,
        preferred_day: preferredDay,
        is_homogeneous: false
      });
      console.log(`   ⚠️  Grupo ${groups.length} (${preferredDay}): ${group.map(t => t.id.substring(0, 8)).join(', ')}`);
    }
  }

  // 5. Validar que todos los grupos estén formados
  if (groups.length < format.groups_count) {
    console.log(`\n⚠️  ADVERTENCIA: Solo se formaron ${groups.length}/${format.groups_count} grupos`);
  }

  console.log(`\n📊 RESUMEN DE AGRUPACIÓN:`);
  console.log(`   ✅ Total grupos creados: ${groups.length}`);
  console.log(`   ☀️  Grupos homogéneos DÍA 1: ${groups.filter(g => g.preferred_day === 'DAY_1' && g.is_homogeneous).length}`);
  console.log(`   🌙 Grupos homogéneos DÍA 2: ${groups.filter(g => g.preferred_day === 'DAY_2' && g.is_homogeneous).length}`);
  console.log(`   ⚠️  Grupos mixtos (requieren auto-asignación): ${groups.filter(g => g.preferred_day === 'MIXED' || !g.is_homogeneous).length}`);

  // 🆕 PASO ADICIONAL: Auto-asignar días a grupos mixtos
  const finalGroups = autoAssignDaysToMixedGroups(groups);

  console.log(`\n🤖 AUTO-ASIGNACIÓN DE DÍAS A GRUPOS MIXTOS:`);
  finalGroups.filter(g => g.was_mixed).forEach(g => {
    console.log(`   ✅ Grupo ${finalGroups.indexOf(g) + 1}: MIXED → ${g.preferred_day} (score: ${g.auto_assignment_score})`);
  });

  // 🆕 VALIDACIÓN DE CAPACIDAD MÍNIMA: Asegurar que cada día pueda completar al menos un grupo
  const validatedGroups = validateMinimumSlotsPerDay(finalGroups, format, availableSlots);

  console.log(`\n📊 RESUMEN FINAL:`);
  console.log(`   ☀️  Total grupos DÍA 1: ${validatedGroups.filter(g => g.preferred_day === 'DAY_1').length}`);
  console.log(`   🌙 Total grupos DÍA 2: ${validatedGroups.filter(g => g.preferred_day === 'DAY_2').length}`);
  console.log(`   ✅ Todos los grupos tienen día asignado automáticamente`);
  console.log('========== FIN AGRUPACIÓN INTELIGENTE ==========\n');

  // Retornar solo los teams (compatibilidad con código existente)
  return validatedGroups.map(g => ({
    teams: g.teams,
    preferred_day: g.preferred_day,
    is_homogeneous: g.is_homogeneous,
    auto_assigned: g.was_mixed || false,
    assignment_score: g.auto_assignment_score || null,
    assignment_reason: g.assignment_reason || null,
    was_reassigned: g.was_reassigned || false,
    reassignment_reason: g.reassignment_reason || null
  }));
}

/**
 * 🤖 AUTO-ASIGNACIÓN INTELIGENTE DE DÍAS A GRUPOS MIXTOS
 *
 * Calcula automáticamente el mejor día para grupos mixtos usando scoring
 *
 * @param {Array} groups - Grupos con equipos y preferencias
 * @returns {Array} Grupos con días asignados automáticamente
 */
function autoAssignDaysToMixedGroups(groups) {
  console.log(`\n🤖 ========== AUTO-ASIGNACIÓN DE DÍAS ==========`);

  const mixedGroups = groups.filter(g => g.preferred_day === 'MIXED' || !g.is_homogeneous);

  if (mixedGroups.length === 0) {
    console.log(`   ✅ No hay grupos mixtos, todos tienen día asignado`);
    return groups;
  }

  console.log(`   📊 Grupos mixtos a procesar: ${mixedGroups.length}`);

  // 🆕 BALANCE DE CARGA: Contar grupos ya asignados a cada día
  const day1GroupsCount = groups.filter(g => g.preferred_day === 'DAY_1' && g.is_homogeneous).length;
  const day2GroupsCount = groups.filter(g => g.preferred_day === 'DAY_2' && g.is_homogeneous).length;

  console.log(`   📊 Distribución actual: Día 1 (${day1GroupsCount} grupos) | Día 2 (${day2GroupsCount} grupos)`);
  
  // DÍA 1 tiene menos slots (17:00-23:00 = ~8 slots) vs DÍA 2 (08:00-23:00 = ~20 slots)
  // Ratio de capacidad aproximado: 8:20 = 2:5
  const DAY1_CAPACITY_RATIO = 2;
  const DAY2_CAPACITY_RATIO = 5;
  const day1Saturation = (day1GroupsCount / DAY1_CAPACITY_RATIO);
  const day2Saturation = (day2GroupsCount / DAY2_CAPACITY_RATIO);

  console.log(`   ⚖️  Saturación relativa: Día 1 (${day1Saturation.toFixed(2)}) | Día 2 (${day2Saturation.toFixed(2)})`);

  const updatedGroups = groups.map(group => {
    if (group.preferred_day !== 'MIXED' && group.is_homogeneous) {
      return group; // Ya tiene día asignado
    }

    // Calcular score para día 1 y día 2
    const day1Score = calculateDayScore(group.teams, 1);
    const day2Score = calculateDayScore(group.teams, 2);

    let assignedDay;
    let reason;
    let score;

    // 🆕 PRIORIDAD 1: Si día 1 está más saturado proporcionalmente, preferir día 2
    if (day1Saturation > day2Saturation && day2Score.total_conflicts <= day1Score.total_conflicts) {
      assignedDay = 'DAY_2';
      reason = `Día 1 más saturado (${day1Saturation.toFixed(2)} vs ${day2Saturation.toFixed(2)}) y día 2 tiene conflictos aceptables (${day2Score.total_conflicts})`;
      score = day2Score.total_conflicts;
    }
    // PRIORIDAD 2: Comparar conflictos reales
    else if (day1Score.total_conflicts < day2Score.total_conflicts) {
      assignedDay = 'DAY_1';
      reason = `Día 1 tiene menos conflictos (${day1Score.total_conflicts} vs ${day2Score.total_conflicts})`;
      score = day1Score.total_conflicts;
    } else if (day2Score.total_conflicts < day1Score.total_conflicts) {
      assignedDay = 'DAY_2';
      reason = `Día 2 tiene menos conflictos (${day2Score.total_conflicts} vs ${day1Score.total_conflicts})`;
      score = day2Score.total_conflicts;
    } else {
      // Empate: usar preferencias de equipos
      const day1Preferences = group.teams.filter(t => t.day_preference?.preference === 'DAY_1').length;
      const day2Preferences = group.teams.filter(t => t.day_preference?.preference === 'DAY_2').length;

      if (day1Preferences > day2Preferences && day1Saturation <= day2Saturation) {
        assignedDay = 'DAY_1';
        reason = `Más equipos prefieren día 1 (${day1Preferences} vs ${day2Preferences}) y no está saturado`;
        score = day1Score.total_conflicts;
      } else if (day2Preferences > day1Preferences) {
        assignedDay = 'DAY_2';
        reason = `Más equipos prefieren día 2 (${day2Preferences} vs ${day1Preferences})`;
        score = day2Score.total_conflicts;
      } else {
        // Empate total: balancear carga considerando capacidad relativa
        // DÍA 1 tiene menos capacidad (8 slots) que DÍA 2 (20 slots)
        // Por lo tanto, preferimos DÍA 2 cuando hay empate
        if (day1Saturation < day2Saturation) {
          assignedDay = 'DAY_1';
          reason = `Balance de carga (día 1 menos saturado: ${day1Saturation.toFixed(2)} vs ${day2Saturation.toFixed(2)})`;
        } else {
          assignedDay = 'DAY_2';
          reason = `Balance de carga (día 2 tiene más capacidad y/o está menos saturado)`;
        }
        score = Math.min(day1Score.total_conflicts, day2Score.total_conflicts);
      }
    }

    console.log(`   🎯 Grupo: ${group.teams.map(t => t.id.substring(0, 8)).join(', ')}`);
    console.log(`      Día 1: ${day1Score.total_conflicts} conflictos | Día 2: ${day2Score.total_conflicts} conflictos`);
    console.log(`      ✅ Asignado: ${assignedDay} - ${reason}`);

    return {
      ...group,
      preferred_day: assignedDay,
      is_homogeneous: true, // Ahora es homogéneo porque tiene día asignado
      was_mixed: true, // Flag para tracking
      auto_assignment_score: score,
      assignment_reason: reason,
      day1_analysis: day1Score,
      day2_analysis: day2Score
    };
  });

  console.log(`========== FIN AUTO-ASIGNACIÓN ==========\n`);

  return updatedGroups;
}

/**
 * 🔍 VALIDACIÓN DE CAPACIDAD MÍNIMA POR DÍA
 *
 * Asegura que cada día tenga suficientes slots libres para completar
 * al menos los partidos de UN GRUPO COMPLETO.
 *
 * Si un día no tiene suficientes slots, reasigna todos los grupos
 * de ese día al otro día.
 *
 * @param {Array} groups - Grupos con días asignados
 * @param {Object} format - Formato del torneo
 * @param {Object} availableSlots - Slots disponibles por día (opcional, para contexto multi-categoría)
 * @returns {Array} Grupos con días validados y posiblemente reasignados
 */
function validateMinimumSlotsPerDay(groups, format, availableSlots = null) {
  console.log(`\n🔍 ========== VALIDACIÓN DE CAPACIDAD MÍNIMA ==========`);

  // Calcular partidos por grupo según formato
  const matchesPerGroup = format.teams_per_group === 3 ? 3 : 6; // Round-robin: C(n,2)

  console.log(`📊 Partidos por grupo: ${matchesPerGroup} (grupos de ${format.teams_per_group})`);

  // Contar grupos por día
  const day1Groups = groups.filter(g => g.preferred_day === 'DAY_1');
  const day2Groups = groups.filter(g => g.preferred_day === 'DAY_2');

  const day1MatchesNeeded = day1Groups.length * matchesPerGroup;
  const day2MatchesNeeded = day2Groups.length * matchesPerGroup;

  console.log(`\n📋 DISTRIBUCIÓN ACTUAL:`);
  console.log(`   DÍA 1: ${day1Groups.length} grupos × ${matchesPerGroup} partidos = ${day1MatchesNeeded} partidos necesarios`);
  console.log(`   DÍA 2: ${day2Groups.length} grupos × ${matchesPerGroup} partidos = ${day2MatchesNeeded} partidos necesarios`);

  // Si hay información de slots disponibles (contexto multi-categoría)
  if (availableSlots) {
    console.log(`\n🏟️  SLOTS DISPONIBLES (post otras categorías):`);
    console.log(`   DÍA 1: ${availableSlots.day1} slots libres`);
    console.log(`   DÍA 2: ${availableSlots.day2} slots libres`);

    // Validar si un día NO tiene suficientes slots para completar los grupos asignados
    let needsReassignment = false;
    let reassignmentDay = null;
    let targetDay = null;

    if (day1Groups.length > 0 && availableSlots.day1 < matchesPerGroup) {
      console.log(`\n⚠️  PROBLEMA: Día 1 no tiene suficientes slots para completar un grupo completo`);
      console.log(`   Slots disponibles: ${availableSlots.day1}`);
      console.log(`   Mínimo requerido: ${matchesPerGroup}`);
      needsReassignment = true;
      reassignmentDay = 'DAY_1';
      targetDay = 'DAY_2';
    }

    if (day2Groups.length > 0 && availableSlots.day2 < matchesPerGroup) {
      console.log(`\n⚠️  PROBLEMA: Día 2 no tiene suficientes slots para completar un grupo completo`);
      console.log(`   Slots disponibles: ${availableSlots.day2}`);
      console.log(`   Mínimo requerido: ${matchesPerGroup}`);
      needsReassignment = true;
      reassignmentDay = 'DAY_2';
      targetDay = 'DAY_1';
    }

    if (needsReassignment) {
      console.log(`\n🔄 REASIGNANDO GRUPOS:`);
      console.log(`   Moviendo todos los grupos de ${reassignmentDay} a ${targetDay}...`);

      groups.forEach(g => {
        if (g.preferred_day === reassignmentDay) {
          g.preferred_day = targetDay;
          g.was_reassigned = true;
          g.reassignment_reason = `Capacidad insuficiente en ${reassignmentDay} (< ${matchesPerGroup} slots)`;
          console.log(`   ✅ Grupo reasignado: ${reassignmentDay} → ${targetDay}`);
        }
      });

      console.log(`\n📊 NUEVA DISTRIBUCIÓN:`);
      const newDay1Groups = groups.filter(g => g.preferred_day === 'DAY_1');
      const newDay2Groups = groups.filter(g => g.preferred_day === 'DAY_2');
      console.log(`   DÍA 1: ${newDay1Groups.length} grupos`);
      console.log(`   DÍA 2: ${newDay2Groups.length} grupos`);
    } else {
      console.log(`\n✅ Capacidad validada: Ambos días tienen suficientes slots`);
    }
  } else {
    console.log(`\n💡 Sin información de slots disponibles - validación básica aplicada`);
    console.log(`   Asumiendo que hay suficiente capacidad para la distribución actual`);
  }

  console.log(`========== FIN VALIDACIÓN ==========\n`);

  return groups;
}

/**
 * Calcula el score de conflictos para un grupo en un día específico
 * @param {Array} teams - Equipos del grupo
 * @param {number} day - Día (1 o 2)
 * @returns {Object} Score y detalles
 */
function calculateDayScore(teams, day) {
  const timeRanges = {
    1: { start: 17, end: 23 }, // Día 1: 17:00 - 23:00
    2: { start: 8, end: 17 }   // Día 2: 08:00 - 17:00
  };

  const range = timeRanges[day];
  let totalConflicts = 0;
  const restrictedTimes = new Set();
  const teamsWithConflicts = [];

  for (const team of teams) {
    if (!team.unavailable_times || team.unavailable_times.length === 0) {
      continue;
    }

    const teamConflictsInDay = team.unavailable_times.filter(slotId => {
      // Formato nuevo: "slot_day1_HHMM" o "slot_day2_HHMM"
      if (slotId.startsWith('slot_day1_')) {
        return day === 1; // Conflicto si estamos evaluando día 1
      }
      if (slotId.startsWith('slot_day2_')) {
        return day === 2; // Conflicto si estamos evaluando día 2
      }
      // Formato viejo: parsear hora (retrocompatibilidad)
      if (slotId.includes(':')) {
        const hour = parseInt(slotId.split(':')[0]);
        return hour >= range.start && hour < range.end;
      }
      return false;
    });

    if (teamConflictsInDay.length > 0) {
      totalConflicts += teamConflictsInDay.length;
      teamsWithConflicts.push(team.id);
      teamConflictsInDay.forEach(time => restrictedTimes.add(time));
    }
  }

  return {
    total_conflicts: totalConflicts,
    teams_with_conflicts: teamsWithConflicts.length,
    restricted_times: Array.from(restrictedTimes),
    percentage: (teamsWithConflicts.length / teams.length) * 100
  };
}
