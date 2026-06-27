/* ==========================================================================
 * genetics/genetics.js — genetic algorithm engine
 * ============================================================
 * Pure functions for car evolution:
 *   - createNormal — symmetric normal distribution
 *   - random — mutation helpers (createNormals, mapToFloat, mapToInteger, mapToShuffle, mutateReplace)
 *   - createInstance — car definition creation (generationZero, crossBreed, mutatedClone, applyTypes)
 *   - cw_slimCarDefinition / cw_slimGeneration — ancestry stripping
 *   - carConstantsData — inlined schema config
 *   - carConstruct.generateSchema — schema builder (pure)
 *   - getStatus / hasFailed / hasSuccess / calculateScore — scoring
 *   - flatRankSelect — tournament parent selection
 *   - pickParent / cw_chooseParent / initializePick — crossover logic
 *   - generationConfig — runtime config factory
 *   - manageRound — generation manager (generationZero, nextGeneration, copyEliteCars, breedRemaining)
 * ========================================================================== */

var genetics = (function () {

  /* -------------------------------------------------------------------------
   * genetics/create-normal.js
   * ------------------------------------------------------------------------- */

  /**
   * Create a symmetric (inclusive) normal-distributed random value [0, 1].
   */
  function createNormal(prop, generator) {
    if (!prop.inclusive) {
      return generator();
    } else {
      return generator() < 0.5 ?
        generator() :
        1 - generator();
    }
  }

  /* -------------------------------------------------------------------------
   * genetics/random.js
   * ------------------------------------------------------------------------- */

  var random = {
    createNormals(prop, generator) {
      return Array.apply(null, Array(prop.length)).map(function () {
        return createNormal(prop, generator);
      });
    },
    mapToFloat(prop, normals) {
      prop = {
        min: prop.min || 0,
        range: prop.range || 1
      };
      return normals.map(function (normal) {
        var min = prop.min;
        var range = prop.range;
        return min + normal * range;
      });
    },
    mapToInteger(prop, normals) {
      return normals.map(function (normal) {
        var min = prop.min || 0;
        var range = prop.range || 1;
        return min + Math.floor(normal * range);
      });
    },
    mapToShuffle(prop, normals) {
      return normals.map(function (normal) {
        var min = prop.min || 0;
        var range = prop.limit || prop.range || 1;
        return min + Math.floor(normal * range);
      });
    },
    mutateReplace(prop, generator, originalValues, mutation_range, chanceToMutate) {
      var factor = (prop.factor || 1) * mutation_range;
      return originalValues.map(function (originalValue) {
        if (generator() > chanceToMutate) {
          return originalValue;
        }
        var minBound = Math.max(0, originalValue - (factor / 2));
        var maxBound = Math.min(1, originalValue + (factor / 2));
        if (factor >= 1) {
          minBound = 0;
          maxBound = 1;
        }
        var rangeValue = createNormal({ inclusive: true }, generator);
        return minBound + (rangeValue * (maxBound - minBound));
      });
    }
  };

  /* -------------------------------------------------------------------------
   * machine-learning/create-instance.js
   * ------------------------------------------------------------------------- */

  var createInstance = {
    createGenerationZero(schema, generator) {
      return Object.keys(schema).reduce(function (instance, key) {
        var schemaProp = schema[key];
        var values = random.createNormals(schemaProp, generator);
        instance[key] = values;
        return instance;
      }, { id: Math.random().toString(32) });
    },
    createCrossBreed(schema, parents, parentChooser) {
      var id = Math.random().toString(32);
      return Object.keys(schema).reduce(function (crossDef, key) {
        var schemaDef = schema[key];
        var values = [];
        for (var i = 0, l = schemaDef.length; i < l; i++) {
          var p = parentChooser(id, key, parents);
          values.push(parents[p][key][i]);
        }
        crossDef[key] = values;
        return crossDef;
      }, { id: id });
    },
    createMutatedClone(schema, generator, parent, factor, chanceToMutate) {
      var mutateFn = random.mutateReplace;
      return Object.keys(schema).reduce(function (clone, key) {
        var schemaProp = schema[key];
        var originalValues = parent[key];
        var values = mutateFn(
          schemaProp, generator, originalValues, factor, chanceToMutate
        );
        clone[key] = values;
        return clone;
      }, { id: parent.id });
    },
    applyTypes(schema, parent) {
      return Object.keys(schema).reduce(function (clone, key) {
        var schemaProp = schema[key];
        var originalValues = parent[key];

        // Backwards compatibility: if a gene is missing (schema changed),
        // fill with random values matching the schema length
        if (!originalValues || originalValues.length === 0) {
          originalValues = Array(schemaProp.length).fill(0.5);
        }

        var values;
        switch (schemaProp.type) {
          case "shuffle":
            values = random.mapToShuffle(schemaProp, originalValues); break;
          case "float":
            values = random.mapToFloat(schemaProp, originalValues); break;
          case "integer":
            values = random.mapToInteger(schemaProp, originalValues); break;
          default:
            throw new Error(`Unknown type ${schemaProp.type} of schema for key ${key}`);
        }
        clone[key] = values;
        return clone;
      }, { id: parent.id });
    }
  };

  /* -------------------------------------------------------------------------
   * genetics/slim-car.js
   * ------------------------------------------------------------------------- */

  /**
   * Strip car definition of ancestry metadata for serialization.
   */
  function cw_slimCarDefinition(def) {
    return Object.keys(def).reduce(function (clone, key) {
      if (key !== "ancestry") {
        clone[key] = def[key];
      }
      return clone;
    }, { id: def.id });
  }

  /**
   * Strip an entire generation of ancestry metadata for serialization.
   */
  function cw_slimGeneration(generation) {
    return (generation || []).map(cw_slimCarDefinition);
  }

  /* -------------------------------------------------------------------------
   * car-schema/car-constants.json (inlined)
   * ------------------------------------------------------------------------- */
  var carConstantsData = {
    "maxWheelCount": 8,
    "wheelMinRadius": 0.2,
    "wheelRadiusRange": 0.5,
    "wheelMinDensity": 40,
    "wheelDensityRange": 100,
    "chassisDensityRange": 300,
    "chassisMinDensity": 30,
    "chassisMinAxis": 0.1,
    "chassisAxisRange": 1.1
  };

  /* -------------------------------------------------------------------------
   * car-schema/construct.js (original schema — matches defToCar expectations)
   * ------------------------------------------------------------------------- */

  var carConstruct = {
    carConstants: function () {
      return carConstantsData;
    },
    generateSchema: function (values) {
      return {
        wheel_count: { type: "integer", length: 1, min: 1, range: values.maxWheelCount, factor: 1 },
        wheel_radius: { type: "float", length: values.maxWheelCount, min: values.wheelMinRadius, range: values.wheelRadiusRange, factor: 1 },
        wheel_density: { type: "float", length: values.maxWheelCount, min: values.wheelMinDensity, range: values.wheelDensityRange, factor: 1 },
        chassis_density: { type: "float", length: 1, min: values.chassisDensityRange, range: values.chassisMinDensity, factor: 1 },
        vertex_list: { type: "float", length: 12, min: values.chassisMinAxis, range: values.chassisAxisRange, factor: 1 },
        wheel_vertex: { type: "shuffle", length: values.maxWheelCount, limit: 8, factor: 1 },
      };
    }
  };

  /* -------------------------------------------------------------------------
   * genetics/scoring.js
   * ------------------------------------------------------------------------- */

  /**
   * Determine car status based on position relative to track bounds.
   * @returns {number} Status code (-1=failed, 1=success, 0=alive).
   */
  function getStatus(state, constants) {
    if (hasFailed(state, constants)) return -1;
    if (hasSuccess(state, constants)) return 1;
    return 0;
  }

  function hasFailed(state) {
    return state.health <= 0;
  }

  function hasSuccess(state, constants) {
    return state.maxPositionx > constants.finishLine;
  }

  function calculateScore(state, constants) {
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

  /* -------------------------------------------------------------------------
   * generation-config/selectFromAllParents.js
   * ------------------------------------------------------------------------- */

  function flatRankSelect(parents) {
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

  /* -------------------------------------------------------------------------
   * generation-config/pickParent.js
   * ------------------------------------------------------------------------- */
  var nAttributes = 38; // wheel_count(1) + wheel_radius(8) + wheel_density(8) + chassis_density(1) + vertex_list(12) + wheel_vertex(8)

  function pickParent(currentChoices, chooseId, key) {
    if (!currentChoices.has(chooseId)) {
      currentChoices.set(chooseId, initializePick());
    }

    var state = currentChoices.get(chooseId);
    state.i++;
    if (key === "wheel_radius" || key === "wheel_vertex" || key === "wheel_density") {
      state.curparent = cw_chooseParent(state);
      return state.curparent;
    }
    state.curparent = cw_chooseParent(state);
    return state.curparent;
  }

  function cw_chooseParent(state) {
    var curparent = state.curparent;
    var attributeIndex = state.i;
    var swapPoint1 = state.swapPoint1;
    var swapPoint2 = state.swapPoint2;
    if ((swapPoint1 == attributeIndex) || (swapPoint2 == attributeIndex)) {
      return curparent == 1 ? 0 : 1;
    }
    return curparent;
  }

  function initializePick() {
    var swapPoint1 = Math.floor(Math.random() * nAttributes);
    var swapPoint2 = swapPoint1;
    while (swapPoint2 == swapPoint1) {
      swapPoint2 = Math.floor(Math.random() * nAttributes);
    }
    return {
      curparent: 0,
      i: 0,
      swapPoint1: swapPoint1,
      swapPoint2: swapPoint2
    };
  }

  /* -------------------------------------------------------------------------
   * generation-config/generateRandom.js
   * ------------------------------------------------------------------------- */

  function generateRandom() {
    return Math.random();
  }

  /* -------------------------------------------------------------------------
   * generation-config/index.js
   * ------------------------------------------------------------------------- */

  var generationConfig = (function () {
    var carConstants = carConstruct.carConstants();
    var schema = carConstruct.generateSchema(carConstants);
    var constants = {
      generationSize: 20,
      schema: schema,
      championLength: 1,
      mutation_range: 1,
      gen_mutation: 0.05
    };
    var fn = function () {
      var currentChoices = new Map();
      return Object.assign({}, constants, {
        selectFromAllParents: flatRankSelect,
        generateRandom: generateRandom,
        pickParent: pickParent.bind(void 0, currentChoices)
      });
    };
    fn.constants = constants;
    return fn;
  })();

  /* -------------------------------------------------------------------------
   * machine-learning/genetic-algorithm/manage-round.js
   * ------------------------------------------------------------------------- */

  var manageRound = (function () {
    var create = createInstance;

    function generationZero(config) {
      var generationSize = config.generationSize,
        schema = config.schema;
      var cw_carGeneration = [];
      for (var k = 0; k < generationSize; k++) {
        var def = create.createGenerationZero(schema, function () {
          return Math.random();
        });
        def.index = k;
        cw_carGeneration.push(def);
      }
      return {
        counter: 0,
        generation: cw_carGeneration
      };
    }

    /**
     * Copy elite car definitions from the previous generation into the new one.
     */
    function copyEliteCars(previousState, scores, config) {
      var newGeneration = [];
      for (var k = 0; k < config.championLength; k++) {
        var elite = cw_slimCarDefinition(scores[k].def);
        elite.is_elite = true;
        elite.index = k;
        newGeneration.push(elite);
      }
      return {
        counter: previousState.counter + 1,
        generation: newGeneration
      };
    }

    /**
     * Breed remaining slots in the new generation using tournament selection,
     * crossover, and mutation.
     */
    function breedRemaining(scores, newGeneration, config, parentList) {
      for (var k = config.championLength; k < config.generationSize; k++) {
        var parent1 = config.selectFromAllParents(scores, parentList);
        var parent2 = parent1;
        while (parent2 == parent1) {
          parent2 = config.selectFromAllParents(scores, parentList, parent1);
        }
        var pair = [parent1, parent2];
        parentList.push(pair);
        var newborn = makeChild(config,
          pair.map(function (parent) { return scores[parent].def; })
        );
        newborn = mutate(config, newborn);
        newborn.is_elite = false;
        newborn.index = k;
        newGeneration.push(newborn);
      }
    }

    function nextGeneration(previousState, scores, config) {
      var champion_length = config.championLength,
        generationSize = config.generationSize,
        selectFromAllParents = config.selectFromAllParents;

      // Copy elite cars first
      var state = copyEliteCars(previousState, scores, config);
      var newGeneration = state.generation;

      // Breed remaining slots
      var parentList = [];
      breedRemaining(scores, newGeneration, config, parentList);

      return {
        counter: state.counter,
        generation: newGeneration
      };
    }

    function makeChild(config, parents) {
      var schema = config.schema,
        pickParent = config.pickParent;
      return create.createCrossBreed(schema, parents, pickParent);
    }

    function mutate(config, parent) {
      var schema = config.schema,
        mutation_range = config.mutation_range,
        gen_mutation = config.gen_mutation,
        generateRandom = config.generateRandom;
      return create.createMutatedClone(
        schema,
        generateRandom,
        parent,
        mutation_range,
        gen_mutation
      );
    }

    return { generationZero: generationZero, nextGeneration: nextGeneration };
  })();


  /* -------------------------------------------------------------------------
   * genetics/car-run.js
   * ------------------------------------------------------------------------- */

  /**
   * Build the initial physics state for a car (positions, velocities).
   */
  function getInitialState(world_def) {
    return {
      frames: 0,
      health: world_def.max_car_health,
      maxPositiony: 0,
      minPositiony: 0,
      maxPositionx: 0,
    };
  }

  /**
   * Step physics simulation: apply forces, update state, check status.
   * NOTE: Requires Box2D (worldConstruct uses chassis physics).
   */
  function updateState(constants, worldConstruct, state) {
    if (state.health <= 0) {
      throw new Error("Already Dead");
    }
    if (state.maxPositionx > constants.finishLine) {
      throw new Error("already Finished");
    }
    var position = worldConstruct.chassis.GetPosition();
    var nextState = {
      frames: state.frames + 1,
      maxPositionx: position.x > state.maxPositionx ? position.x : state.maxPositionx,
      maxPositiony: position.y > state.maxPositiony ? position.y : state.maxPositiony,
      minPositiony: position.y < state.minPositiony ? position.y : state.minPositiony
    };
    if (position.x > constants.finishLine) {
      nextState.health = state.health;
      return nextState;
    }
    if (position.x > state.maxPositionx + 0.02) {
      nextState.health = constants.max_car_health;
      return nextState;
    }
    nextState.health = state.health - 1;
    if (Math.abs(worldConstruct.chassis.GetLinearVelocity().x) < 0.001) {
      nextState.health -= 5;
    }
    return nextState;
  }


  /**
   * Convert a genetic definition into a Box2D car instance.
   * @param {Object} normal_def - Normalized car definition.
   * @param {b2World} world - Box2D physics world.
   * @param {Object} constants - Car physics constants (gravity, schema, motorSpeed, finishLine).
   * @returns {Object} Car instance with chassis and wheels.
   */
  function defToCar(normal_def, world, constants) {
    var car_def = createInstance.applyTypes(constants.schema, normal_def)
    var instance = {};
    instance.chassis = createChassis(
      world, car_def.vertex_list, car_def.chassis_density
    );
    var i;

    // Read wheel count from genetic definition (evolved!)
    var wheelCount = Math.min(
      car_def.wheel_count[0],
      car_def.wheel_radius.length
    );

    instance.wheels = [];
    for (i = 0; i < wheelCount; i++) {
      instance.wheels[i] = createWheel(
        world,
        car_def.wheel_radius[i],
        car_def.wheel_density[i]
      );
    }

    var carmass = instance.chassis.GetMass();
    for (i = 0; i < wheelCount; i++) {
      carmass += instance.wheels[i].GetMass();
    }

    var joint_def = new b2RevoluteJointDef();

    for (i = 0; i < wheelCount; i++) {
      var torque = carmass * -constants.gravity.y / car_def.wheel_radius[i];

      var randvertex = instance.chassis.vertex_list[car_def.wheel_vertex[i]];
      joint_def.localAnchorA.Set(randvertex.x, randvertex.y);
      joint_def.localAnchorB.Set(0, 0);
      joint_def.maxMotorTorque = torque;
      joint_def.motorSpeed = -constants.motorSpeed;
      joint_def.enableMotor = true;
      joint_def.bodyA = instance.chassis;
      joint_def.bodyB = instance.wheels[i];
      world.CreateJoint(joint_def);
    }

    return instance;
  }

  /**
   * Create a convex polygon chassis body from vertices.
   */
  function createChassis(world, vertexs, density) {
    var vertex_list = [];
    vertex_list.push(new b2Vec2(vertexs[0], 0));
    vertex_list.push(new b2Vec2(vertexs[1], vertexs[2]));
    vertex_list.push(new b2Vec2(0, vertexs[3]));
    vertex_list.push(new b2Vec2(-vertexs[4], vertexs[5]));
    vertex_list.push(new b2Vec2(-vertexs[6], 0));
    vertex_list.push(new b2Vec2(-vertexs[7], -vertexs[8]));
    vertex_list.push(new b2Vec2(0, -vertexs[9]));
    vertex_list.push(new b2Vec2(vertexs[10], -vertexs[11]));

    var body_def = new b2BodyDef();
    body_def.type = b2Body.b2_dynamicBody;
    body_def.position.Set(0.0, 4.0);

    var body = world.CreateBody(body_def);

    createChassisPart(body, vertex_list[0], vertex_list[1], density);
    createChassisPart(body, vertex_list[1], vertex_list[2], density);
    createChassisPart(body, vertex_list[2], vertex_list[3], density);
    createChassisPart(body, vertex_list[3], vertex_list[4], density);
    createChassisPart(body, vertex_list[4], vertex_list[5], density);
    createChassisPart(body, vertex_list[5], vertex_list[6], density);
    createChassisPart(body, vertex_list[6], vertex_list[7], density);
    createChassisPart(body, vertex_list[7], vertex_list[0], density);

    body.vertex_list = vertex_list;

    return body;
  }

  function createChassisPart(body, vertex1, vertex2, density) {
    var vertex_list = [];
    vertex_list.push(vertex1);
    vertex_list.push(vertex2);
    vertex_list.push(b2Vec2.Make(0, 0));
    var fix_def = new b2FixtureDef();
    fix_def.shape = new b2PolygonShape();
    fix_def.density = density;
    fix_def.friction = 10;
    fix_def.restitution = 0.2;
    fix_def.filter.groupIndex = -1;
    fix_def.shape.SetAsArray(vertex_list, 3);

    body.CreateFixture(fix_def);
  }

  /**
   * Create a circular wheel body with physics fixtures.
   */
  function createWheel(world, radius, density) {
    var body_def = new b2BodyDef();
    body_def.type = b2Body.b2_dynamicBody;
    body_def.position.Set(0, 0);

    var body = world.CreateBody(body_def);

    var fix_def = new b2FixtureDef();
    fix_def.shape = new b2CircleShape(radius);
    fix_def.density = density;
    fix_def.friction = 1;
    fix_def.restitution = 0.2;
    fix_def.filter.groupIndex = -1;

    body.CreateFixture(fix_def);
    return body;
  }

  var carRun = {
    getInitialState: getInitialState,
    updateState: updateState,
    getStatus: getStatus,
    calculateScore: calculateScore,
  };


  /* ==========================================================================
   * Public API
   * ========================================================================== */

  return {
    // Car construction (Box2D-dependent)
    defToCar: defToCar,

    // Car run (state machine)
    carRun: carRun,

    // Pure functions
    createNormal: createNormal,
    random: random,
    createInstance: createInstance,

    // Serialization
    cw_slimCarDefinition: cw_slimCarDefinition,
    cw_slimGeneration: cw_slimGeneration,

    // Car schema
    carConstants: carConstruct.carConstants.bind(carConstruct),
    generateSchema: carConstruct.generateSchema.bind(carConstruct),

    // Scoring
    getStatus: getStatus,
    hasFailed: hasFailed,
    hasSuccess: hasSuccess,
    calculateScore: calculateScore,

    // Parent selection
    flatRankSelect: flatRankSelect,
    pickParent: pickParent,
    cw_chooseParent: cw_chooseParent,
    initializePick: initializePick,

    // Generation config
    generationConfig: generationConfig,

    // Generation management
    manageRound: manageRound
  };

})();
