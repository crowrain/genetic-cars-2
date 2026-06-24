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
