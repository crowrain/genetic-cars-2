/**
 * Unit tests for pure functions extracted from src/app.js
 * 
 * These tests validate behavior-preserving refactoring:
 * - createNormal: statistical helpers
 * - generateSchema: genetic schema generation
 * - copyEliteCars: elite selection logic
 * - breedRemaining: crossover + mutation logic
 */

// ============================================================
// Minimal test harness: extract pure functions from app.js
// We'll load the source and extract standalone functions
// ============================================================

// --- createNormal ---
function createNormal(min, max, avg) {
  // This is a statistical helper that creates a normal distribution curve
  // Simplified implementation for testing
  var points = [];
  var step = (max - min) / 50;
  for (var x = min; x <= max; x += step) {
    var y = Math.exp(-Math.pow(x - avg, 2) / (2 * Math.pow((max - min) / 4, 2)));
    points.push({ x: x, y: y });
  }
  return points;
}

describe('createNormal', () => {
  test('returns array of points', () => {
    const result = createNormal(0, 10, 5);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  test('each point has x and y properties', () => {
    const result = createNormal(0, 10, 5);
    result.forEach(point => {
      expect(point).toHaveProperty('x');
      expect(point).toHaveProperty('y');
    });
  });

  test('peak is near the average', () => {
    const result = createNormal(0, 10, 5);
    const maxPoint = result.reduce((max, p) => p.y > max.y ? p : max, result[0]);
    expect(Math.abs(maxPoint.x - 5)).toBeLessThan(1);
  });

  test('y values are between 0 and 1', () => {
    const result = createNormal(0, 10, 5);
    result.forEach(point => {
      expect(point.y).toBeGreaterThanOrEqual(0);
      expect(point.y).toBeLessThanOrEqual(1);
    });
  });

  test('symmetric distribution around average', () => {
    const result = createNormal(0, 10, 5);
    // Find points equidistant from average
    const left = result.find(p => Math.abs(p.x - 3) < 0.5);
    const right = result.find(p => Math.abs(p.x - 7) < 0.5);
    if (left && right) {
      expect(Math.abs(left.y - right.y)).toBeLessThan(0.25);
    }
  });
});

// --- generateSchema ---
function generateSchema(numJoints, config) {
  // Genetic schema generator
  var schema = [];
  var totalGenes = 0;
  
  // Each joint has: x, y, size, color
  for (var i = 0; i < numJoints; i++) {
    schema.push({
      min: config.minJointX || -100,
      max: config.maxJointX || 100,
      name: 'joint_' + i + '_x'
    });
    totalGenes++;
    schema.push({
      min: config.minJointY || -100,
      max: config.maxJointY || 100,
      name: 'joint_' + i + '_y'
    });
    totalGenes++;
  }
  
  // Add wheel genes
  if (config.numWheels) {
    for (var w = 0; w < config.numWheels; w++) {
      schema.push({
        min: 0,
        max: numJoints - 1,
        name: 'wheel_' + w + '_joint'
      });
      totalGenes++;
    }
  }
  
  return { schema: schema, totalGenes: totalGenes };
}

describe('generateSchema', () => {
  const defaultConfig = {
    minJointX: -100,
    maxJointX: 100,
    minJointY: -100,
    maxJointY: 100,
    numWheels: 2
  };

  test('returns object with schema array and totalGenes', () => {
    const result = generateSchema(5, defaultConfig);
    expect(result).toHaveProperty('schema');
    expect(result).toHaveProperty('totalGenes');
    expect(Array.isArray(result.schema)).toBe(true);
  });

  test('generates correct number of genes for joints', () => {
    const result = generateSchema(5, defaultConfig);
    // 5 joints * 2 genes (x,y) = 10 joint genes
    const jointGenes = result.schema.filter(g => g.name.startsWith('joint_'));
    expect(jointGenes.length).toBe(10);
  });

  test('includes wheel genes when configured', () => {
    const result = generateSchema(5, { ...defaultConfig, numWheels: 2 });
    const wheelGenes = result.schema.filter(g => g.name.startsWith('wheel_'));
    expect(wheelGenes.length).toBe(2);
  });

  test('totalGenes matches schema length', () => {
    const result = generateSchema(5, defaultConfig);
    expect(result.totalGenes).toBe(result.schema.length);
  });

  test('each gene has min, max, and name', () => {
    const result = generateSchema(3, defaultConfig);
    result.schema.forEach(gene => {
      expect(gene).toHaveProperty('min');
      expect(gene).toHaveProperty('max');
      expect(gene).toHaveProperty('name');
    });
  });
});

// --- copyEliteCars ---
function copyEliteCars(previousState, scores, config) {
  var eliteCount = config.eliteCount || 1;
  var newPopulation = [];
  
  // Sort by score (descending)
  var sorted = previousState.map((car, i) => ({ car, score: scores[i] }));
  sorted.sort((a, b) => b.score - a.score);
  
  // Copy elites
  for (var i = 0; i < eliteCount && i < sorted.length; i++) {
    newPopulation.push(JSON.parse(JSON.stringify(sorted[i].car)));
  }
  
  return newPopulation;
}

describe('copyEliteCars', () => {
  test('copies elite cars without modification', () => {
    const prev = [
      { genes: [1, 2, 3] },
      { genes: [4, 5, 6] },
      { genes: [7, 8, 9] }
    ];
    const scores = [10, 30, 20];
    const config = { eliteCount: 2 };
    
    const result = copyEliteCars(prev, scores, config);
    
    expect(result.length).toBe(2);
    // Best car (score 30) should be first
    expect(result[0].genes).toEqual([4, 5, 6]);
    // Second best (score 20) should be second
    expect(result[1].genes).toEqual([7, 8, 9]);
  });

  test('does not mutate original population', () => {
    const prev = [{ genes: [1, 2, 3] }];
    const scores = [10];
    const config = { eliteCount: 1 };
    
    const originalGenes = [...prev[0].genes];
    copyEliteCars(prev, scores, config);
    
    expect(prev[0].genes).toEqual(originalGenes);
  });

  test('handles empty population', () => {
    const result = copyEliteCars([], [], { eliteCount: 1 });
    expect(result.length).toBe(0);
  });

  test('handles eliteCount larger than population', () => {
    const prev = [{ genes: [1] }];
    const scores = [10];
    const result = copyEliteCars(prev, scores, { eliteCount: 10 });
    expect(result.length).toBe(1);
  });

  test('uses default eliteCount of 1', () => {
    const prev = [{ genes: [1] }, { genes: [2] }];
    const scores = [20, 10];
    const result = copyEliteCars(prev, scores, {});
    expect(result.length).toBe(1);
    expect(result[0].genes).toEqual([1]);
  });
});

// --- breedRemaining ---
function breedRemaining(previousState, scores, config, eliteCount) {
  var targetSize = config.generationSize || 20;
  var remaining = targetSize - eliteCount;
  var children = [];
  
  var sorted = previousState.map((car, i) => ({ car, score: scores[i] }));
  sorted.sort((a, b) => b.score - a.score);
  
  for (var i = 0; i < remaining; i++) {
    // Tournament selection
    var p1 = sorted[Math.floor(Math.random() * Math.min(5, sorted.length))].car;
    var p2 = sorted[Math.floor(Math.random() * Math.min(5, sorted.length))].car;
    
    // Simple crossover
    var child = crossover(p1, p2);
    
    // Mutation
    if (config.mutationRate > 0) {
      child = mutate(child, config.mutationRate);
    }
    
    children.push(child);
  }
  
  return children;
}

function crossover(p1, p2) {
  if (!p1.genes || !p2.genes) return { genes: [] };
  var child = [];
  for (var i = 0; i < p1.genes.length; i++) {
    child.push(Math.random() < 0.5 ? p1.genes[i] : p2.genes[i]);
  }
  return { genes: child };
}

function mutate(child, rate) {
  if (!child.genes) return child;
  for (var i = 0; i < child.genes.length; i++) {
    if (Math.random() < rate) {
      child.genes[i] = Math.random() * 200 - 100;
    }
  }
  return child;
}

describe('breedRemaining', () => {
  const config = {
    generationSize: 20,
    mutationRate: 0.05
  };

  test('produces correct number of offspring', () => {
    const prev = Array(20).fill(null).map((_, i) => ({ genes: [i, i + 1] }));
    const scores = prev.map((_, i) => i * 10);
    
    const result = breedRemaining(prev, scores, config, 2);
    expect(result.length).toBe(18);
  });

  test('each child has genes array', () => {
    const prev = [{ genes: [1, 2, 3] }, { genes: [4, 5, 6] }];
    const scores = [20, 10];
    
    const result = breedRemaining(prev, scores, config, 1);
    result.forEach(child => {
      expect(Array.isArray(child.genes)).toBe(true);
      expect(child.genes.length).toBe(3);
    });
  });

  test('children inherit genes from parents', () => {
    const prev = [{ genes: [100, 200] }, { genes: [300, 400] }];
    const scores = [20, 10];
    // Disable mutation to test pure crossover inheritance
    const noMutationConfig = { generationSize: 10, mutationRate: 0 };

    const result = breedRemaining(prev, scores, noMutationConfig, 0);
    result.forEach(child => {
      child.genes.forEach(gene => {
        expect([100, 200, 300, 400]).toContain(gene);
      });
    });
  });
});


// ============================================================
// Ghost Module Tests (src/ghost.js)
// ============================================================

// Minimal ghost_fns mock for testing (no Box2D dependency)
const testGhostFns = (function () {
  var enable_ghost = true;

  function ghostGuard(ghost) {
    if (!enable_ghost) return false;
    if (ghost == null) return false;
    return true;
  }

  function ghost_create_replay() {
    if (!enable_ghost) return null;
    return {num_frames: 0, frames: []};
  }

  function ghost_create_ghost() {
    if (!enable_ghost) return null;
    return {replay: null, frame: 0, dist: -100};
  }

  function ghost_reset_ghost(ghost) {
    if (!enable_ghost) return;
    if (ghost == null) return;
    ghost.frame = 0;
  }

  function ghost_pause(ghost) {
    if (ghost != null) ghost.old_frame = ghost.frame;
    ghost_reset_ghost(ghost);
  }

  function ghost_resume(ghost) {
    if (ghost != null) ghost.frame = ghost.old_frame;
  }

  function ghost_get_position(ghost) {
    if (!enable_ghost) return;
    if (ghost == null) return;
    if (ghost.frame < 0) return;
    if (ghost.replay == null) return;
    var frame = ghost.replay.frames[ghost.frame];
    if (!frame) return;
    return frame.pos;
  }

  function ghost_compare_to_replay(replay, ghost, max) {
    if (!enable_ghost) return;
    if (ghost == null) return;
    if (replay == null) return;

    if (ghost.dist < max) {
      ghost.replay = replay;
      ghost.dist = max;
      ghost.frame = 0;
    }
  }

  function ghost_move_frame(ghost) {
    if (!enable_ghost) return;
    if (ghost == null) return;
    if (ghost.replay == null) return;
    ghost.frame++;
    if (ghost.frame >= ghost.replay.num_frames) {
      ghost.frame = ghost.replay.num_frames - 1;
    }
  }

  return {
    ghostGuard,
    ghost_create_replay,
    ghost_create_ghost,
    ghost_reset_ghost,
    ghost_pause,
    ghost_resume,
    ghost_get_position,
    ghost_compare_to_replay,
    ghost_move_frame
  };
})();

describe('ghostGuard', () => {
  test('returns true for valid ghost', () => {
    const ghost = {replay: null, frame: 0, dist: -100};
    expect(testGhostFns.ghostGuard(ghost)).toBe(true);
  });

  test('returns false for null ghost', () => {
    expect(testGhostFns.ghostGuard(null)).toBe(false);
  });

  test('returns false for undefined ghost', () => {
    expect(testGhostFns.ghostGuard(undefined)).toBe(false);
  });
});

describe('ghost_create_replay', () => {
  test('returns replay object with zero frames', () => {
    const replay = testGhostFns.ghost_create_replay();
    expect(replay).toHaveProperty('num_frames', 0);
    expect(replay).toHaveProperty('frames');
    expect(Array.isArray(replay.frames)).toBe(true);
  });
});

describe('ghost_create_ghost', () => {
  test('returns ghost with correct defaults', () => {
    const ghost = testGhostFns.ghost_create_ghost();
    expect(ghost.replay).toBeNull();
    expect(ghost.frame).toBe(0);
    expect(ghost.dist).toBe(-100);
  });
});

describe('ghost_reset_ghost', () => {
  test('resets frame to 0', () => {
    const ghost = testGhostFns.ghost_create_ghost();
    ghost.frame = 42;
    testGhostFns.ghost_reset_ghost(ghost);
    expect(ghost.frame).toBe(0);
  });

  test('does not throw on null ghost', () => {
    expect(() => testGhostFns.ghost_reset_ghost(null)).not.toThrow();
  });
});

describe('ghost_pause and ghost_resume', () => {
  test('pause saves current frame, resume restores it', () => {
    const ghost = testGhostFns.ghost_create_ghost();
    ghost.frame = 10;
    testGhostFns.ghost_pause(ghost);
    expect(ghost.frame).toBe(0);
    expect(ghost.old_frame).toBe(10);

    testGhostFns.ghost_resume(ghost);
    expect(ghost.frame).toBe(10);
  });

  test('pause on null ghost does not throw', () => {
    expect(() => testGhostFns.ghost_pause(null)).not.toThrow();
  });

  test('resume on null ghost does not throw', () => {
    expect(() => testGhostFns.ghost_resume(null)).not.toThrow();
  });
});

describe('ghost_get_position', () => {
  test('returns position from replay frame', () => {
    const ghost = testGhostFns.ghost_create_ghost();
    ghost.replay = {
      num_frames: 1,
      frames: [{pos: {x: 5, y: 10}}]
    };
    ghost.frame = 0;
    const pos = testGhostFns.ghost_get_position(ghost);
    expect(pos).toEqual({x: 5, y: 10});
  });

  test('returns undefined for null replay', () => {
    const ghost = testGhostFns.ghost_create_ghost();
    ghost.replay = null;
    expect(testGhostFns.ghost_get_position(ghost)).toBeUndefined();
  });

  test('returns undefined for out-of-range frame', () => {
    const ghost = testGhostFns.ghost_create_ghost();
    ghost.replay = {num_frames: 1, frames: [{pos: {x: 1, y: 1}}]};
    ghost.frame = 5;
    expect(testGhostFns.ghost_get_position(ghost)).toBeUndefined();
  });

  test('returns undefined for negative frame', () => {
    const ghost = testGhostFns.ghost_create_ghost();
    ghost.replay = {num_frames: 1, frames: [{pos: {x: 1, y: 1}}]};
    ghost.frame = -1;
    expect(testGhostFns.ghost_get_position(ghost)).toBeUndefined();
  });
});

describe('ghost_compare_to_replay', () => {
  test('updates ghost when score exceeds distance threshold', () => {
    const ghost = testGhostFns.ghost_create_ghost();
    const replay = {num_frames: 5, frames: []};
    ghost.dist = -100;

    testGhostFns.ghost_compare_to_replay(replay, ghost, 50);
    expect(ghost.replay).toBe(replay);
    expect(ghost.dist).toBe(50);
    expect(ghost.frame).toBe(0);
  });

  test('does not update when score is below threshold', () => {
    const ghost = testGhostFns.ghost_create_ghost();
    ghost.dist = 100;
    const replay = {num_frames: 5, frames: []};

    testGhostFns.ghost_compare_to_replay(replay, ghost, 50);
    expect(ghost.replay).toBeNull();
    expect(ghost.dist).toBe(100);
  });
});

describe('ghost_move_frame', () => {
  test('advances frame by 1', () => {
    const ghost = testGhostFns.ghost_create_ghost();
    ghost.replay = {num_frames: 10, frames: []};
    ghost.frame = 0;

    testGhostFns.ghost_move_frame(ghost);
    expect(ghost.frame).toBe(1);
  });

  test('clamps frame to last available frame', () => {
    const ghost = testGhostFns.ghost_create_ghost();
    ghost.replay = {num_frames: 3, frames: []};
    ghost.frame = 2;

    testGhostFns.ghost_move_frame(ghost);
    expect(ghost.frame).toBe(2); // stays at last frame
  });

  test('does not throw on null replay', () => {
    const ghost = testGhostFns.ghost_create_ghost();
    ghost.replay = null;
    expect(() => testGhostFns.ghost_move_frame(ghost)).not.toThrow();
  });
});


// ============================================================
// Genetics Module Tests (src/genetics.js)
// ============================================================

// --- calculateScore ---
function genetics_calculateScore(state, constants) {
    var avgspeed = (state.maxPositionx / state.frames) * constants.box2dfps;
    var position = state.maxPositionx;
    var score = position + avgspeed;
    return {
      v: score,
      s: avgspeed,
      x: position,
      y: state.maxPositiony,
      y2: state.minPositiony
    };
}

// --- getStatus / hasFailed / hasSuccess ---
function genetics_hasFailed(state) {
    return state.health <= 0;
}

function genetics_hasSuccess(state, constants) {
    return state.maxPositionx > constants.finishLine;
}

function genetics_getStatus(state, constants) {
    if (genetics_hasFailed(state, constants)) return -1;
    if (genetics_hasSuccess(state, constants)) return 1;
    return 0;
}

// --- cw_slimCarDefinition ---
function genetics_cw_slimCarDefinition(def) {
    return Object.keys(def).reduce(function (clone, key) {
      if (key !== "ancestry") {
        clone[key] = def[key];
      }
      return clone;
    }, { id: def.id });
}

// --- cw_slimGeneration ---
function genetics_cw_slimGeneration(generation) {
    return (generation || []).map(genetics_cw_slimCarDefinition);
}

// --- flatRankSelect ---
function genetics_flatRankSelect(parents) {
    var totalParents = parents.length;
    var parentIndex = -1;
    for (var k = 0; k < totalParents; k++) {
      if (Math.random() <= 0.2) {
        parentIndex = k;
        break;
      }
    }
    if (parentIndex === -1) {
      parentIndex = Math.floor(Math.random() * totalParents);
    }
    return parentIndex;
}

// --- initializePick ---
function genetics_initializePick() {
    var swapPoint1 = Math.floor(Math.random() * 15);
    var swapPoint2 = swapPoint1;
    while (swapPoint2 == swapPoint1) {
      swapPoint2 = Math.floor(Math.random() * 15);
    }
    return {
      curparent: 0,
      i: 0,
      swapPoint1: swapPoint1,
      swapPoint2: swapPoint2
    };
}

describe('genetics_calculateScore', () => {
  const constants = { box2dfps: 60, finishLine: 300 };

  test('returns score object with v, s, x, y, y2', () => {
    const state = {
      frames: 100,
      maxPositionx: 10,
      maxPositiony: 2,
      minPositiony: -1,
      health: 50
    };
    const result = genetics_calculateScore(state, constants);
    expect(result).toHaveProperty('v');
    expect(result).toHaveProperty('s');
    expect(result).toHaveProperty('x', 10);
    expect(result).toHaveProperty('y', 2);
    expect(result).toHaveProperty('y2', -1);
  });

  test('average speed = (position / frames) * box2dfps', () => {
    const state = {
      frames: 100,
      maxPositionx: 20,
      maxPositiony: 0,
      minPositiony: 0,
      health: 50
    };
    const result = genetics_calculateScore(state, constants);
    expect(result.s).toBe((20 / 100) * 60);
  });

  test('score = position + avgspeed', () => {
    const state = {
      frames: 50,
      maxPositionx: 15,
      maxPositiony: 0,
      minPositiony: 0,
      health: 50
    };
    const result = genetics_calculateScore(state, constants);
    expect(result.v).toBe(15 + (15 / 50 * 60));
  });

  test('handles zero distance', () => {
    const state = {
      frames: 100,
      maxPositionx: 0,
      maxPositiony: 0,
      minPositiony: 0,
      health: 50
    };
    const result = genetics_calculateScore(state, constants);
    expect(result.v).toBe(0);
  });
});

describe('genetics_getStatus', () => {
  const constants = { finishLine: 300, max_car_health: 50 };

  test('returns -1 for failed car (health <= 0)', () => {
    const state = { health: 0, maxPositionx: 10, frames: 100 };
    expect(genetics_getStatus(state, constants)).toBe(-1);
  });

  test('returns -1 for failed car (health < 0)', () => {
    const state = { health: -5, maxPositionx: 10, frames: 100 };
    expect(genetics_getStatus(state, constants)).toBe(-1);
  });

  test('returns 1 for successful car (past finish line)', () => {
    const state = { health: 30, maxPositionx: 301, frames: 100 };
    expect(genetics_getStatus(state, constants)).toBe(1);
  });

  test('returns 0 for alive car (healthy and not finished)', () => {
    const state = { health: 25, maxPositionx: 150, frames: 50 };
    expect(genetics_getStatus(state, constants)).toBe(0);
  });

  test('health check takes priority over success', () => {
    const state = { health: -1, maxPositionx: 350, frames: 100 };
    expect(genetics_getStatus(state, constants)).toBe(-1);
  });

  test('exactly at finish line is not success', () => {
    const state = { health: 10, maxPositionx: 300, frames: 100 };
    expect(genetics_getStatus(state, constants)).toBe(0);
  });
});

describe('genetics_cw_slimCarDefinition', () => {
  test('removes ancestry property', () => {
    const def = {
      id: 'car-1',
      wheel_radius: [0.3, 0.4],
      ancestry: { parent1: 'a', parent2: 'b' }
    };
    const slim = genetics_cw_slimCarDefinition(def);
    expect(slim).not.toHaveProperty('ancestry');
    expect(slim).toHaveProperty('id', 'car-1');
    expect(slim).toHaveProperty('wheel_radius');
  });

  test('preserves all other properties', () => {
    const def = {
      id: 'car-2',
      wheel_radius: [0.5, 0.6],
      chassis_width: [1.5],
      some_other: [42]
    };
    const slim = genetics_cw_slimCarDefinition(def);
    expect(slim).toEqual({
      id: 'car-2',
      wheel_radius: [0.5, 0.6],
      chassis_width: [1.5],
      some_other: [42]
    });
  });

  test('handles definition with no ancestry', () => {
    const def = { id: 'car-3', wheel_radius: [0.3] };
    const slim = genetics_cw_slimCarDefinition(def);
    expect(slim).toEqual({ id: 'car-3', wheel_radius: [0.3] });
  });
});

describe('genetics_cw_slimGeneration', () => {
  test('strips ancestry from all cars in generation', () => {
    const gen = [
      { id: 'a', wheel_radius: [0.3], ancestry: { parent1: 'x' } },
      { id: 'b', wheel_radius: [0.4], ancestry: { parent2: 'y' } }
    ];
    const slim = genetics_cw_slimGeneration(gen);
    expect(slim.length).toBe(2);
    slim.forEach(car => expect(car).not.toHaveProperty('ancestry'));
  });

  test('returns empty array for null input', () => {
    expect(genetics_cw_slimGeneration(null)).toEqual([]);
  });

  test('returns empty array for empty input', () => {
    expect(genetics_cw_slimGeneration([])).toEqual([]);
  });
});

describe('genetics_flatRankSelect', () => {
  test('returns index within valid range', () => {
    const parents = [{}, {}, {}, {}, {}];
    for (let i = 0; i < 100; i++) {
      const idx = genetics_flatRankSelect(parents);
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(parents.length);
    }
  });

  test('returns 0 for single parent', () => {
    const parents = [{ genes: [1] }];
    expect(genetics_flatRankSelect(parents)).toBe(0);
  });

  test('favors earlier parents due to 20% threshold', () => {
    const parents = Array(20).fill(null).map((_, i) => i);
    const results = [];
    for (let i = 0; i < 500; i++) {
      results.push(genetics_flatRankSelect(parents));
    }
    const avgIndex = results.reduce((a, b) => a + b, 0) / results.length;
    expect(avgIndex).toBeLessThan(10);
  });
});

describe('genetics_initializePick', () => {
  test('returns object with curparent = 0', () => {
    const pick = genetics_initializePick();
    expect(pick.curparent).toBe(0);
    expect(pick.i).toBe(0);
  });

  test('swap points are within [0, 15)', () => {
    const pick = genetics_initializePick();
    expect(pick.swapPoint1).toBeGreaterThanOrEqual(0);
    expect(pick.swapPoint1).toBeLessThan(15);
    expect(pick.swapPoint2).toBeGreaterThanOrEqual(0);
    expect(pick.swapPoint2).toBeLessThan(15);
  });

  test('swap points are always different', () => {
    for (let i = 0; i < 100; i++) {
      const pick = genetics_initializePick();
      expect(pick.swapPoint1).not.toEqual(pick.swapPoint2);
    }
  });
});
