(function () {


  /* -------------------------------------------------------------------------
   * draw/draw-circle.js
   * ------------------------------------------------------------------------- */



  function cw_drawCircle(ctx, body, center, radius, angle, color) {
    var p = body.GetWorldPoint(center);
    ctx.fillStyle = color;

    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, 2 * Math.PI, true);

    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + radius * Math.cos(angle), p.y + radius * Math.sin(angle));

    ctx.fill();
    ctx.stroke();
  }


   /* -------------------------------------------------------------------------
   * draw/draw-virtual-poly.js
   * ------------------------------------------------------------------------- */


  function cw_drawVirtualPoly(ctx, body, vtx, n_vtx) {
    // set strokestyle and fillstyle before call
    // call beginPath before call

    var p0 = body.GetWorldPoint(vtx[0]);
    ctx.moveTo(p0.x, p0.y);
    for (var i = 1; i < n_vtx; i++) {
      var p = body.GetWorldPoint(vtx[i]);
      ctx.lineTo(p.x, p.y);
    }
    ctx.lineTo(p0.x, p0.y);
  }


  /* -------------------------------------------------------------------------
   * draw/draw-floor.js
   * ------------------------------------------------------------------------- */

  function cw_drawFloor(ctx, camera, cw_floorTiles) {
    var camera_x = camera.pos.x;
    var zoom = camera.zoom;
    ctx.strokeStyle = "#000";
    ctx.fillStyle = "#777";
    ctx.lineWidth = 1 / zoom;
    ctx.beginPath();

    var k;
    if (camera.pos.x - 10 > 0) {
      k = Math.floor((camera.pos.x - 10) / 1.5);
    } else {
      k = 0;
    }


    outer_loop:
    for (k; k < cw_floorTiles.length; k++) {
      var b = cw_floorTiles[k];
      for (var f = b.GetFixtureList(); f; f = f.m_next) {
        var s = f.GetShape();
        var shapePosition = b.GetWorldPoint(s.m_vertices[0]).x;
        if ((shapePosition > (camera_x - 5)) && (shapePosition < (camera_x + 10))) {
          cw_drawVirtualPoly(ctx, b, s.m_vertices, s.m_vertexCount);
        }
        if (shapePosition > camera_x + 10) {
          break outer_loop;
        }
      }
    }
    ctx.fill();
    ctx.stroke();
  }


  /* -------------------------------------------------------------------------
   * draw/scatter-plot.js
   * ------------------------------------------------------------------------- */


  // Called when the Visualization API is loaded.


  /* -------------------------------------------------------------------------
   * draw/plot-graphs.js
   * ------------------------------------------------------------------------- */


  var graph_fns = {
    plotGraphs: function (graphElem, topScoresElem, scatterPlotElem, lastState, scores, config) {
      lastState = lastState || {};
      var generationSize = scores.length
      var graphcanvas = graphElem;
      var graphctx = graphcanvas.getContext("2d");
      var graphwidth = 400;
      var graphheight = 250;
      var nextState = cw_storeGraphScores(
        lastState, scores, generationSize
      );
      cw_clearGraphics(graphcanvas, graphctx, graphwidth, graphheight);
      cw_plotAverage(nextState, graphctx);
      cw_plotElite(nextState, graphctx);
      cw_plotTop(nextState, graphctx);
      cw_listTopScores(topScoresElem, nextState);
      return nextState;
    },
  };


/**
   * Store current generation scores for graph plotting.
   * @param {Array} cars - Array of car objects with scores
   */
  function cw_storeGraphScores(lastState, cw_carScores, generationSize) {
    var maxGraphHistory = 2000;
    var maxTopScores = 100;

    return {
      cw_topScores: cw_limitTopScores(
        (lastState.cw_topScores || []).concat([cw_carScores[0].score]),
        maxTopScores
      ),
      cw_graphAverage: cw_limitHistory((lastState.cw_graphAverage || []).concat([
        cw_average(cw_carScores, generationSize)
      ]), maxGraphHistory),
      cw_graphElite: cw_limitHistory((lastState.cw_graphElite || []).concat([
        cw_eliteaverage(cw_carScores, generationSize)
      ]), maxGraphHistory),
      cw_graphTop: cw_limitHistory((lastState.cw_graphTop || []).concat([
        cw_carScores[0].score.v
      ]), maxGraphHistory),
    }
  }

/**
   * Trim history arrays to prevent memory leaks.
   * @param {Array} arr - History array
   * @param {number} max - Maximum length
   */
  function cw_limitHistory(values, maxLength) {
    return values.length > maxLength ? values.slice(values.length - maxLength) : values;
  }

  function cw_limitTopScores(values, maxLength) {
    return values.slice().sort(function (a, b) {
      return b.v - a.v;
    }).slice(0, maxLength);
  }

/**
   * Plot a line on the statistics graph canvas.
   * @param {Object} ctx - Canvas context
   * @param {Array} data - Data points
   * @param {string} color - Line color
   */
  function cw_plotLine(state, graphctx, dataKey, color) {
    var data = state[dataKey];
    var graphsize = data.length;
    graphctx.strokeStyle = color;
    graphctx.beginPath();
    graphctx.moveTo(0, 0);
    for (var k = 0; k < graphsize; k++) {
      graphctx.lineTo(400 * (k + 1) / graphsize, data[k]);
    }
    graphctx.stroke();
  }

/**
   * Plot the top score line (red) on the graph.
   */
  function cw_plotTop(state, graphctx) {
    cw_plotLine(state, graphctx, "cw_graphTop", "#C83B3B");
  }

/**
   * Plot the elite average line (green) on the graph.
   */
  function cw_plotElite(state, graphctx) {
    cw_plotLine(state, graphctx, "cw_graphElite", "#7BC74D");
  }

/**
   * Plot the generation average line (blue) on the graph.
   */
  function cw_plotAverage(state, graphctx) {
    cw_plotLine(state, graphctx, "cw_graphAverage", "#3F72AF");
  }


  function cw_eliteaverage(scores, generationSize) {
    var sum = 0;
    for (var k = 0; k < Math.floor(generationSize / 2); k++) {
      sum += scores[k].score.v;
    }
    return sum / Math.floor(generationSize / 2);
  }

/**
   * Calculate the average of an array of scores.
   * @param {number[]} scores - Array of numeric scores
   * @param {number} generationSize - Population size for normalization
   * @returns {number} Average score
   */
  function cw_average(scores, generationSize) {
    var sum = 0;
    for (var k = 0; k < generationSize; k++) {
      sum += scores[k].score.v;
    }
    return sum / generationSize;
  }

/**
   * Clear all graph canvases.
   */
  function cw_clearGraphics(graphcanvas, graphctx, graphwidth, graphheight) {
    graphcanvas.width = graphcanvas.width;
    graphctx.translate(0, graphheight);
    graphctx.scale(1, -1);
    graphctx.lineWidth = 1;
    graphctx.strokeStyle = "#3F72AF";
    graphctx.beginPath();
    graphctx.moveTo(0, graphheight / 2);
    graphctx.lineTo(graphwidth, graphheight / 2);
    graphctx.moveTo(0, graphheight / 4);
    graphctx.lineTo(graphwidth, graphheight / 4);
    graphctx.moveTo(0, graphheight * 3 / 4);
    graphctx.lineTo(graphwidth, graphheight * 3 / 4);
    graphctx.stroke();
  }

/**
   * List top N scores in the statistics table.
   */
  function cw_listTopScores(elem, state) {
    var cw_topScores = state.cw_topScores;
    var ts = elem;
    ts.innerHTML = "<b>Top Scores:</b><br />";
    cw_topScores.sort(function (a, b) {
      if (a.v > b.v) {
        return -1
      } else {
        return 1
      }
    });

    for (var k = 0; k < Math.min(10, cw_topScores.length); k++) {
      var topScore = cw_topScores[k];
      var n = "#" + (k + 1) + ":";
      var score = Math.round(topScore.v * 100) / 100;
      var distance = "d:" + Math.round(topScore.x * 100) / 100;
      var yrange = "h:" + Math.round(topScore.y2 * 100) / 100 + "/" + Math.round(topScore.y * 100) / 100 + "m";
      var gen = "(Gen " + cw_topScores[k].i + ")"

      ts.innerHTML += [n, score, distance, yrange, gen].join(" ") + "<br />";
    }
  }

  /* -------------------------------------------------------------------------
   * draw/draw-car.js
   * ------------------------------------------------------------------------- */




  /**
   * Draw all wheels of a car, coloring by density.
   * @param {Object} myCar - Car wrapper object
   * @param {Object} camera - Camera with .pos.x and .zoom
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} car_constants - Car constants with wheelMinDensity and wheelDensityRange
   */
  function drawCarWheels(myCar, camera, ctx, car_constants) {
    var zoom = camera.zoom;
    var wheelMinDensity = car_constants.wheelMinDensity;
    var wheelDensityRange = car_constants.wheelDensityRange;

    ctx.strokeStyle = "#444";
    ctx.lineWidth = 1 / zoom;

    var wheels = myCar.car.car.wheels;

    for (var i = 0; i < wheels.length; i++) {
      var b = wheels[i];
      for (var f = b.GetFixtureList(); f; f = f.m_next) {
        var s = f.GetShape();
        var color = Math.round(255 - (255 * (f.m_density - wheelMinDensity)) / wheelDensityRange).toString();
        var rgbcolor = "rgb(" + color + "," + color + "," + color + ")";
        cw_drawCircle(ctx, b, s.m_p, s.m_radius, b.m_sweep.a, rgbcolor);
      }
    }
  }

  /**
   * Draw the chassis polygon of a car. Elite cars get a blue tint.
   * @param {Object} myCar - Car wrapper object
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  function drawCarChassis(myCar, ctx) {
    if (myCar.is_elite) {
      ctx.strokeStyle = "#3F72AF";
      ctx.fillStyle = "#DBE2EF";
    } else {
      ctx.strokeStyle = "#F7C873";
      ctx.fillStyle = "#FAEBCD";
    }
    ctx.beginPath();

    var chassis = myCar.car.car.chassis;

    for (var f = chassis.GetFixtureList(); f; f = f.m_next) {
      var cs = f.GetShape();
      cw_drawVirtualPoly(ctx, chassis, cs.m_vertices, cs.m_vertexCount);
    }
    ctx.fill();
    ctx.stroke();
  }

  function drawCar(car_constants, myCar, camera, ctx) {
    var camera_x = camera.pos.x;

    if (!myCar.alive) {
      return;
    }
    var myCarPos = myCar.getPosition();

    if (myCarPos.x < (camera_x - 5)) {
      // too far behind, don't draw
      return;
    }

    drawCarWheels(myCar, camera, ctx, car_constants);
    drawCarChassis(myCar, ctx);
  }


  /* -------------------------------------------------------------------------
   * draw/draw-car-stats.js
   * ------------------------------------------------------------------------- */


  var run = genetics.carRun;

  /* ========================================================================= */
  /* === Car ================================================================= */
  /**
   * Car class constructor: manages physics state, score tracking, and rendering.
   * @constructor
   * @param {b2World} world - Box2D physics world.
   * @param {Object} car_def - Genetic definition of the car.
   * @param {Object} constants - Car physics constants.
   */


  var cw_Car = function () {
    this.__constructor.apply(this, arguments);
  }

  cw_Car.prototype.__constructor = function (car) {
    this.car = car;
    this.car_def = car.def;
    var car_def = this.car_def;

    this.frames = 0;
    this.alive = true;
    this.is_elite = car.def.is_elite;
    this.healthBar = document.getElementById("health" + car_def.index).style;
    this.healthBarText = document.getElementById("health" + car_def.index).nextSibling.nextSibling;
    this.healthBarText.innerHTML = car_def.index;
    this.minimapmarker = document.getElementById("bar" + car_def.index);

    if (this.is_elite) {
      this.healthBar.backgroundColor = "#3F72AF";
      this.minimapmarker.style.borderLeft = "1px solid #3F72AF";
      this.minimapmarker.innerHTML = car_def.index;
    } else {
      this.healthBar.backgroundColor = "#F7C873";
      this.minimapmarker.style.borderLeft = "1px solid #F7C873";
      this.minimapmarker.innerHTML = car_def.index;
    }

  }

  cw_Car.prototype.getPosition = function () {
    return this.car.car.chassis.GetPosition();
  }

  cw_Car.prototype.kill = function (currentRunner, constants) {
    this.minimapmarker.style.borderLeft = "1px solid #ccc";
    var finishLine = currentRunner.scene.finishLine
    var max_car_health = constants.max_car_health;
    var status = run.getStatus(this.car.state, {
      finishLine: finishLine,
      max_car_health: max_car_health,
    })
    switch (status) {
      case 1: {
        this.healthBar.width = "0";
        break
      }
      case -1: {
        this.healthBarText.innerHTML = "&dagger;";
        this.healthBar.width = "0";
        break
      }
    }
    this.alive = false;

  }




  /* -------------------------------------------------------------------------
   * world/setup-scene.js
   * ------------------------------------------------------------------------- */


  /*
  
  world_def = {
    gravity: {x, y},
    doSleep: boolean,
    floorseed: string,
    tileDimensions,
    maxFloorTiles,
    mutable_floor: boolean
  }
  
  */

  /**
   * Initialize the physics scene: create world, floor tiles, and starting car.
   * @param {Object} world_def - World configuration (gravity, seed, dimensions).
   */


  function setupScene(world_def) {

    var world = new b2World(world_def.gravity, world_def.doSleep);
    var floorTiles = cw_createFloor(
      world,
      world_def.floorseed,
      world_def.tileDimensions,
      world_def.maxFloorTiles,
      world_def.mutable_floor
    );

    var last_tile = floorTiles[
      floorTiles.length - 1
    ];
    var last_fixture = last_tile.GetFixtureList();
    var tile_position = last_tile.GetWorldPoint(
      last_fixture.GetShape().m_vertices[3]
    );
    var finishLine = tile_position.x + 5;
    world.finishLine = finishLine;
    return {
      world: world,
      floorTiles: floorTiles,
      finishLine: finishLine
    };
  }

/**
   * Create the terrain/floor from world seed data using Box2D chain shapes.
   * @param {Object} world - Box2D world
   * @param {Array} seed - World seed data
   */
  function cw_createFloor(world, floorseed, dimensions, maxFloorTiles, mutable_floor) {
    var last_tile = null;
    var tile_position = new b2Vec2(-5, 0);
    var cw_floorTiles = [];
    Math.seedrandom(floorseed);
    for (var k = 0; k < maxFloorTiles; k++) {
      if (!mutable_floor) {
        // keep old impossible tracks if not using mutable floors
        last_tile = cw_createFloorTile(
          world, dimensions, tile_position, (Math.random() * 3 - 1.5) * 1.5 * k / maxFloorTiles
        );
      } else {
        // if path is mutable over races, create smoother tracks
        last_tile = cw_createFloorTile(
          world, dimensions, tile_position, (Math.random() * 3 - 1.5) * 1.2 * k / maxFloorTiles
        );
      }
      cw_floorTiles.push(last_tile);
      var last_fixture = last_tile.GetFixtureList();
      tile_position = last_tile.GetWorldPoint(last_fixture.GetShape().m_vertices[3]);
    }
    return cw_floorTiles;
  }


/**
   * Create a single floor tile (chain edge) from seed data.
   * @param {Object} world - Box2D world
   * @param {number} x - X position
   * @param {number} y - Y position
   * @returns {Object} Box2D body for the floor tile
   */
  function cw_createFloorTile(world, dim, position, angle) {
    var body_def = new b2BodyDef();

    body_def.position.Set(position.x, position.y);
    var body = world.CreateBody(body_def);
    var fix_def = new b2FixtureDef();
    fix_def.shape = new b2PolygonShape();
    fix_def.friction = 0.5;

    var coords = [];
    coords.push(new b2Vec2(0, 0));
    coords.push(new b2Vec2(0, -dim.y));
    coords.push(new b2Vec2(dim.x, -dim.y));
    coords.push(new b2Vec2(dim.x, 0));

    var center = new b2Vec2(0, 0);

    var newcoords = cw_rotateFloorTile(coords, center, angle);

    fix_def.shape.SetAsArray(newcoords);

    body.CreateFixture(fix_def);
    return body;
  }

/**
   * Rotate floor tile coordinates around a center point.
   * @param {{x: number, y: number}} coords - Original coordinates
   * @param {{x: number, y: number}} center - Rotation center
   * @param {number} angle - Rotation angle in radians
   * @returns {{x: number, y: number}} Rotated coordinates
   */
  function cw_rotateFloorTile(coords, center, angle) {
    return coords.map(function (coord) {
      return {
        x: Math.cos(angle) * (coord.x - center.x) - Math.sin(angle) * (coord.y - center.y) + center.x,
        y: Math.sin(angle) * (coord.x - center.x) + Math.cos(angle) * (coord.y - center.y) + center.y,
      };
    });
  }


  /* -------------------------------------------------------------------------
   * world/run.js
   * ------------------------------------------------------------------------- */
  /**
   * Main simulation runner: iterate physics steps, update cars, check round end.
   * @param {Object} world_def - World configuration.
   * @param {Object[]} defs - Array of car definitions.
   * @param {Object} listeners - Callbacks (onStep, onEnd, etc).
   */


  function worldRun(world_def, defs, listeners) {
    if (world_def.mutable_floor) {
      // GHOST DISABLED
      world_def.floorseed = btoa(Math.seedrandom());
    }

    var scene = setupScene(world_def);
    world_def.finishLine = scene.finishLine;
    scene.world.Step(1 / world_def.box2dfps, 20, 20);
    var cars = defs.map((def, i) => {
      return {
        index: i,
        def: def,
        car: genetics.defToCar(def, scene.world, world_def),
        state: genetics.carRun.getInitialState(world_def)
      };
    });
    var alivecars = cars;

    /**
     * Update a single car's state and return its run status.
     * Status 0 = still alive, non-zero = finished.
     * @param {Object} car - Car object with .car and .state
     * @param {Object} world_def - World definition
     * @param {Object} listeners - Car event listeners
     * @returns {number} Run status code
     */
    function updateCarStep(car, world_def, listeners) {
      car.state = genetics.carRun.updateState(
        world_def, car.car, car.state
      );
      var status = genetics.carRun.getStatus(car.state, world_def);
      listeners.carStep(car);
      return status;
    }

    /**
     * Remove a dead car's Box2D bodies from the world.
     * Destroys the chassis and all wheels.
     * @param {Object} car - Car object with .car (contains chassis and wheels)
     * @param {Object} world - Box2D world instance
     */
    function cleanupDeadCar(car, world) {
      var worldCar = car.car;
      world.DestroyBody(worldCar.chassis);
      for (var w = 0; w < worldCar.wheels.length; w++) {
        world.DestroyBody(worldCar.wheels[w]);
      }
    }

    return {
      scene: scene,
      cars: cars,
      step: function () {
        if (alivecars.length === 0) {
          throw new Error("no more cars");
        }
        scene.world.Step(1 / world_def.box2dfps, 20, 20);
        listeners.preCarStep();
        alivecars = alivecars.filter(function (car) {
          var status = updateCarStep(car, world_def, listeners);
          if (status === 0) {
            return true;
          }
          car.score = genetics.carRun.calculateScore(car.state, world_def);
          listeners.carDeath(car);
          cleanupDeadCar(car, scene.world);
          return false;
        })
        if (alivecars.length === 0) {
          listeners.generationEnd(cars);
        }
      }
    }

  }


  /* -------------------------------------------------------------------------
   * index.js (main entry)
   * ------------------------------------------------------------------------- */
  // Global Vars




  var plot_graphs = graph_fns.plotGraphs;

  var ghost_draw_frame = ghost_fns.ghost_draw_frame;
  var ghost_create_ghost = ghost_fns.ghost_create_ghost;
  var ghost_add_replay_frame = ghost_fns.ghost_add_replay_frame;
  var ghost_compare_to_replay = ghost_fns.ghost_compare_to_replay;
  var ghost_get_position = ghost_fns.ghost_get_position;
  var ghost_move_frame = ghost_fns.ghost_move_frame;
  var ghost_reset_ghost = ghost_fns.ghost_reset_ghost
  var ghost_pause = ghost_fns.ghost_pause;
  var ghost_resume = ghost_fns.ghost_resume;
  var ghost_create_replay = ghost_fns.ghost_create_replay;

  var ghost;
  var carMap = new Map();

  var doDraw = true;
  var cw_paused = false;
  var cw_animationFrameId = null;
  var cw_runningInterval = null;

  var box2dfps = 60;
  var screenfps = 60;
  var skipTicks = Math.round(1000 / box2dfps);
  var maxFrameSkip = skipTicks * 2;

  var canvas = document.getElementById("mainbox");
  var ctx = canvas.getContext("2d");

  var camera = {
    speed: 0.05,
    pos: {
      x: 0, y: 0
    },
    target: -1,
    zoom: 70
  }

  var minimapcamera = document.getElementById("minimapcamera").style;
  var minimapholder = document.querySelector("#minimapholder");

  var minimapcanvas = document.getElementById("minimap");
  var minimapctx = minimapcanvas.getContext("2d");
  var minimapscale = 3;
  var minimapfogdistance = 0;
  var lastFloorSeed = null;
  var fogdistance = document.getElementById("minimapfog").style;


  var carConstants = genetics.carConstants();


  var max_car_health = box2dfps * 10;

  var cw_ghostReplayInterval = null;

  var distanceMeter = document.getElementById("distancemeter");
  var heightMeter = document.getElementById("heightmeter");

  var leaderPosition = {
    x: 0, y: 0
  }

  minimapcamera.width = 12 * minimapscale + "px";
  minimapcamera.height = 6 * minimapscale + "px";


  // ======= WORLD STATE ======


  var world_def = {
    gravity: new b2Vec2(0.0, -9.81),
    doSleep: true,
    floorseed: btoa(Math.seedrandom()),
    tileDimensions: new b2Vec2(1.5, 0.15),
    maxFloorTiles: 200,
    mutable_floor: false,
    box2dfps: box2dfps,
    motorSpeed: 20,
    max_car_health: max_car_health,
    schema: genetics.generationConfig.constants.schema
  }

  var cw_deadCars;
  var graphState = {
    cw_topScores: [],
    cw_graphAverage: [],
    cw_graphElite: [],
    cw_graphTop: [],
  };

/**
   * Reset all graph tracking state (history arrays, scores).
   */
  function resetGraphState() {
    graphState = {
      cw_topScores: [],
      cw_graphAverage: [],
      cw_graphElite: [],
      cw_graphTop: [],
    };
  }



  // ==========================

  var generationState;

  // ======== Activity State ====
  var currentRunner;
  var loops = 0;
  var nextGameTick = (new Date).getTime();
  var serverSync = (function () {
    var params = new URLSearchParams(window.location.search);
    var apiBase = params.get("api") || window.BOXCAR_API_BASE ||
      (window.location.protocol + "//" + window.location.hostname + ":8089");

    return {
      enabled: params.get("nosync") !== "1" && typeof fetch === "function" && !!window.location.hostname,
      isRunner: params.get("runner") === "1",
      apiBase: apiBase.replace(/\/$/, ""),
      runnerId: Math.random().toString(36).slice(2),
      statusElem: document.getElementById("server-status"),
      lastServerGeneration: -1,
      pollMs: Number(params.get("pollMs") || 10000),
      saveInFlight: false,
      pendingSave: false,
      pendingSnapshot: null,
      runnerStarted: false,
      pollFailureCount: 0,
      maxPollFailures: 5,
      pollTimer: null,
      heartbeatTimer: null
    };
  })();

/**
 * Update the distance and height display on the statistics table.
   * @param {number} distance - Current best distance
   * @param {number} height - Current height
   */
  function showDistance(distance, height) {
    distanceMeter.innerHTML = distance + " meters<br />";
    heightMeter.innerHTML = height + " meters";
    if (distance > minimapfogdistance) {
      fogdistance.width = 800 - Math.round(distance + 15) * minimapscale + "px";
      minimapfogdistance = distance;
    }
  }

/**
   * Update the server sync status indicator.
   * @param {string} text - Status message
   * @param {string} state - CSS state class
   */
  function serverSetStatus(text, state) {
    if (!serverSync.statusElem) {
      return;
    }
    serverSync.statusElem.textContent = text;
    serverSync.statusElem.className = "server-status" + (state ? " " + state : "");
  }

/**
   * Normalize graph state object to a consistent format.
   * @param {Object} input - Raw state object
   * @returns {Object} Normalized state
   */
  function normalizeGraphState(input) {
    input = input || {};
    return {
      cw_topScores: input.cw_topScores || [],
      cw_graphAverage: input.cw_graphAverage || [],
      cw_graphElite: input.cw_graphElite || [],
      cw_graphTop: input.cw_graphTop || [],
    };
  }

/**
   * Build a snapshot of current simulation progress for saving.
   * @param {string} reason - Reason for saving (manual, checkpoint, etc.)
   * @param {Object} options - Snapshot options
   * @returns {Object} Progress snapshot
   */
  function buildProgressSnapshot(reason, options) {
    options = options || {};
    var bestScore = (graphState.cw_topScores || [])[0] || null;
    return {
      version: 1,
      reason: reason || "generation",
      generation: Number(generationState && generationState.counter || 0),
      savedGeneration: generationState && generationState.generation ? genetics.cw_slimGeneration(generationState.generation) : [],
      ghost: options.includeGhost === false ? null : ghost,
      graphState: normalizeGraphState(graphState),
      floorSeed: world_def.floorseed,
      bestScore: bestScore,
      runnerId: serverSync.runnerId,
      savedAt: new Date().toISOString(),
      config: {
        mutationRate: genetics.generationConfig.constants.gen_mutation,
        mutationRange: genetics.generationConfig.constants.mutation_range,
        eliteSize: genetics.generationConfig.constants.championLength,
        mutableFloor: world_def.mutable_floor,
        gravity: world_def.gravity.y
      }
    };
  }

/**
   * Apply a saved progress snapshot to restore simulation state.
   * @param {Object} snapshot - Saved progress data
   * @param {Object} options - Apply options
   * @returns {boolean} Whether restoration succeeded
   */
  function applyProgressSnapshot(snapshot, options) {
    options = options || {};
    if (!snapshot || !Array.isArray(snapshot.savedGeneration)) {
      return false;
    }

    if (cw_runningInterval) {
      clearInterval(cw_runningInterval);
      cw_runningInterval = null;
      doDraw = true;
    }

    cw_stopSimulation();
    if (currentRunner) {
      try {
        cw_clearPopulationWorld();
      } catch (err) {
        console.warn("Could not clear previous population before restore", err);
      }
    }

    carMap.clear();
    generationState = {
      generation: snapshot.savedGeneration,
      counter: Number(snapshot.generation || snapshot.genCounter || 0)
    };
    ghost = snapshot.ghost || ghost_create_ghost();
    graphState = normalizeGraphState(snapshot.graphState || {
      cw_topScores: snapshot.cw_topScores || []
    });
    world_def.floorseed = snapshot.floorSeed || snapshot.cw_floorSeed || world_def.floorseed;
    document.getElementById("newseed").value = world_def.floorseed;

    currentRunner = worldRun(world_def, generationState.generation, uiListeners);
    setupCarUI();
    cw_drawMiniMap();
    Math.seedrandom();
    resetCarUI();
    cw_drawScreen();

    serverSync.lastServerGeneration = Number(generationState.counter || 0);
    if (options.start !== false) {
      cw_startSimulation();
    }
    return true;
  }

/**
   * Save progress snapshot to browser localStorage.
   * @param {Object} snapshot - Progress snapshot
   */
  function saveProgressToLocal(snapshot) {
    localStorage.cw_savedGeneration = JSON.stringify(snapshot.savedGeneration);
    localStorage.cw_genCounter = snapshot.generation;
    localStorage.cw_ghost = JSON.stringify(snapshot.ghost);
    localStorage.cw_topScores = JSON.stringify(snapshot.graphState.cw_topScores);
    localStorage.cw_graphState = JSON.stringify(snapshot.graphState);
    localStorage.cw_floorSeed = snapshot.floorSeed;
  }

/**
   * Load progress snapshot from browser localStorage.
   * @returns {Object|null} Saved snapshot or null
   */
  function loadProgressFromLocal() {
    if (typeof localStorage.cw_savedGeneration == 'undefined' || localStorage.cw_savedGeneration == null) {
      return null;
    }
    return {
      version: 1,
      generation: Number(localStorage.cw_genCounter || 0),
      savedGeneration: JSON.parse(localStorage.cw_savedGeneration),
      ghost: JSON.parse(localStorage.cw_ghost),
      graphState: localStorage.cw_graphState ?
        JSON.parse(localStorage.cw_graphState) :
        { cw_topScores: JSON.parse(localStorage.cw_topScores || "[]") },
      floorSeed: localStorage.cw_floorSeed
    };
  }

/**
   * Fetch the latest progress snapshot from the server API.
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} Server snapshot
   */
  function serverLoadLatest(options) {
    options = options || {};
    if (!serverSync.enabled) {
      return Promise.resolve(false);
    }

    return fetch(serverSync.apiBase + "/api/state", { cache: "no-store" }).then(function (response) {
      if (response.status === 404) {
        if (!options.quiet404) {
          serverSetStatus("Server sync: no saved state yet", "warning");
        }
        return null;
      }
      if (!response.ok) {
        throw new Error("HTTP " + response.status);
      }
      return response.json();
    }).then(function (snapshot) {
      if (!snapshot) {
        return false;
      }
      var remoteGeneration = Number(snapshot.generation || 0);
      if (options.onlyIfNewer && generationState && remoteGeneration <= Number(generationState.counter || 0)) {
        serverSetStatus("Server sync: watching generation " + generationState.counter, "running");
        return false;
      }
      if (options.deferActive && !serverSync.isRunner && carMap.size > 0) {
        serverSync.pendingSnapshot = snapshot;
        serverSetStatus(
          "Server sync: generation " + remoteGeneration + " ready; waiting for current round",
          "warning"
        );
        return false;
      }
      if (applyProgressSnapshot(snapshot, { start: true })) {
        serverSetStatus("Server sync: loaded generation " + remoteGeneration, "running");
        return true;
      }
      return false;
    }).catch(function (err) {
      if (!options.quiet) {
        if (err.message === "Failed to fetch" || err.message === "TypeError") {
          serverSetStatus("Server sync: no backend available (port 8089)", "warning");
        } else {
          serverSetStatus("Server sync: " + err.message, "error");
          console.error("Server sync fetch failed", err);
        }
      }
      throw err;
    });
  }

/**
 * Apply a server snapshot that was fetched asynchronously.
   */
  function applyPendingServerSnapshot() {
    var snapshot = serverSync.pendingSnapshot;
    if (!snapshot) {
      return false;
    }

    var remoteGeneration = Number(snapshot.generation || 0);
    if (generationState && remoteGeneration <= Number(generationState.counter || 0)) {
      serverSync.pendingSnapshot = null;
      return false;
    }

    serverSync.pendingSnapshot = null;
    if (applyProgressSnapshot(snapshot, { start: true })) {
      serverSetStatus("Server sync: loaded generation " + remoteGeneration, "running");
      return true;
    }
    return false;
  }

/**
   * Queue a progress snapshot for upload to the server.
   * @param {string} reason - Save reason
   */
  function queueServerSave(reason) {
    if (!serverSync.enabled || !serverSync.isRunner) {
      return;
    }

    serverSync.pendingSave = true;
    if (serverSync.saveInFlight) {
      return;
    }

    serverSync.saveInFlight = true;
    serverSync.pendingSave = false;
    var snapshot = buildProgressSnapshot(reason, { includeGhost: false });

    fetch(serverSync.apiBase + "/api/state", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(snapshot)
    }).then(function (response) {
      if (!response.ok) {
        throw new Error("HTTP " + response.status);
      }
      return response.json();
    }).then(function () {
      serverSetStatus("Server runner: saved generation " + snapshot.generation, "running");
    }).catch(function (err) {
      serverSetStatus("Server runner: save failed - " + err.message, "error");
      console.error("Server save failed", err);
    }).finally(function () {
      serverSync.saveInFlight = false;
      if (serverSync.pendingSave) {
        setTimeout(function () { queueServerSave("pending"); }, 0);
      }
    });
  }

/**
   * Start periodic polling for server-side progress updates.
   */
  function startServerPolling() {
    if (!serverSync.enabled || serverSync.isRunner || serverSync.pollTimer) {
      return;
    }
    serverSetStatus("Server sync: watching autonomous runner", "running");
    serverSync.pollTimer = setInterval(function () {
      serverLoadLatest({ onlyIfNewer: true, quiet404: true, quiet: true, deferActive: true })
        .then(function () {
          serverSync.pollFailureCount = 0;
        })
        .catch(function () {
          serverSync.pollFailureCount++;
          if (serverSync.pollFailureCount >= serverSync.maxPollFailures) {
            clearInterval(serverSync.pollTimer);
            serverSync.pollTimer = null;
            serverSetStatus("Server sync: backend unavailable (port 8089) — polling stopped", "warning");
          } else {
            serverSetStatus("Server sync: backend unavailable (attempt " + serverSync.pollFailureCount + "/" + serverSync.maxPollFailures + ")", "warning");
          }
        });
    }, serverSync.pollMs);
  }

/**
   * Start autonomous simulation runner (auto-advances generations).
   */
  function startAutonomousRunner() {
    if (serverSync.runnerStarted) {
      return;
    }
    serverSync.runnerStarted = true;
    document.body.classList.add("runner-mode");
    queueServerSave("runner-start");
    serverSync.heartbeatTimer = setInterval(function () {
      queueServerSave("heartbeat");
    }, 30000);
    window.__boxcarRunnerReady = true;
    serverSetStatus("Server runner: evolving generation " + generationState.counter, "running");
    cw_paused = false;
    cw_startSimulation();
  }

/**
   * Initialize server synchronization subsystem.
   */
  function initServerSync() {
    if (!serverSync.enabled) {
      serverSetStatus("Server sync: disabled", "warning");
      cw_startSimulation();
      return;
    }

    serverSetStatus(serverSync.isRunner ? "Server runner: loading state" : "Server sync: loading state", "warning");
    serverLoadLatest({ quiet404: true }).catch(function (err) {
      if (err.message === "Failed to fetch" || err.message === "TypeError") {
        serverSetStatus("Server sync: no backend (port 8089) — running locally", "warning");
      } else {
        serverSetStatus("Server sync: " + err.message, "error");
        console.error("Server sync load failed", err);
      }
      return false;
    }).then(function (loaded) {
      if (serverSync.isRunner) {
        startAutonomousRunner();
      } else {
        if (!loaded) {
          cw_startSimulation();
        }
        startServerPolling();
      }
    });
  }



  /* === END Car ============================================================= */
  /* ========================================================================= */


  /* ========================================================================= */
  /* ==== Generation ========================================================= */

  function cw_generationZero() {

    generationState = genetics.manageRound.generationZero(genetics.generationConfig());
  }

  function resetCarUI() {
    cw_deadCars = 0;
    leaderPosition = {
      x: 0, y: 0
    };
    document.getElementById("generation").innerHTML = generationState.counter.toString();
    document.getElementById("cars").innerHTML = "";
    document.getElementById("population").innerHTML = genetics.generationConfig.constants.generationSize.toString();
  }

  /* ==== END Genration ====================================================== */
  /* ========================================================================= */

  /* ========================================================================= */
  /* ==== Drawing ============================================================ */

  /**
   * Apply camera transform to canvas context: clear, save, translate, scale.
   * Caller is responsible for {@code ctx.restore()}.
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
   * @param {number} posX - World X position
   * @param {number} posY - World Y position
   * @param {number} zoom - Zoom level
   */
  function applyCameraTransform(ctx, posX, posY, zoom) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(200 - (posX * zoom), 200 + (posY * zoom));
    ctx.scale(zoom, -zoom);
  }

  /**
   * Render the main simulation screen: cars, floor, ghost replay, minimap.
   */


  function cw_drawScreen() {
    var floorTiles = currentRunner.scene.floorTiles;
    cw_setCameraPosition();
    applyCameraTransform(ctx, camera.pos.x, camera.pos.y, camera.zoom);
    cw_drawFloor(ctx, camera, floorTiles);
    ghost_draw_frame(ctx, ghost, camera);
    cw_drawCars();
    ctx.restore();
  }

/**
   * Calculate minimap camera viewport transformation.
   * @returns {Object} Camera transform data
   */
  function cw_minimapCamera() {
    var camera_x = camera.pos.x
    var camera_y = camera.pos.y
    minimapcamera.left = Math.round((2 + camera_x) * minimapscale) + "px";
    minimapcamera.top = Math.round((31 - camera_y) * minimapscale) + "px";
  }

/**
   * Set camera follow target (leader car index).
   * @param {number} k - Car index to follow
   */
  function cw_setCameraTarget(k) {
    if (k === -1) {
      camera.target = -1;
      return;
    }
    // k can be a numeric index from the HTML onclick or a car info object
    if (typeof k === 'number' && currentRunner) {
      var carInfo = currentRunner.cars[k];
      if (carInfo && carMap.has(carInfo)) {
        camera.target = carInfo;
      } else {
        camera.target = -1;
      }
    } else {
      camera.target = k;
    }
  }

/**
   * Update camera position to follow the target car.
   */
  function cw_setCameraPosition() {
    var cameraTargetPosition
    if (camera.target !== -1 && carMap.has(camera.target)) {
      cameraTargetPosition = carMap.get(camera.target).getPosition();
    } else {
      camera.target = -1;
      cameraTargetPosition = leaderPosition;
    }
    var diff_y = camera.pos.y - cameraTargetPosition.y;
    var diff_x = camera.pos.x - cameraTargetPosition.x;
    camera.pos.y -= camera.speed * diff_y;
    camera.pos.x -= camera.speed * diff_x;
    cw_minimapCamera();
  }

/**
   * Draw the ghost replay overlay on the main canvas.
   */
  function cw_drawGhostReplay() {
    var floorTiles = currentRunner.scene.floorTiles;
    var carPosition = ghost_get_position(ghost);
    if (!carPosition) {
      cw_setCameraPosition();
      applyCameraTransform(ctx, camera.pos.x, camera.pos.y, camera.zoom);
      cw_drawFloor(ctx, camera, floorTiles);
      ctx.restore();
      return;
    }
    camera.pos.x = carPosition.x;
    camera.pos.y = carPosition.y;
    cw_minimapCamera();
    showDistance(
      Math.round(carPosition.x * 100) / 100,
      Math.round(carPosition.y * 100) / 100
    );
    applyCameraTransform(ctx, carPosition.x, carPosition.y, camera.zoom);
    ghost_draw_frame(ctx, ghost, camera);
    ghost_move_frame(ghost);
    cw_drawFloor(ctx, camera, floorTiles);
    ctx.restore();
  }


/**
   * Draw all active cars on the main canvas.
   */
  function cw_drawCars() {
    var cw_carArray = Array.from(carMap.values());
    for (var k = (cw_carArray.length - 1); k >= 0; k--) {
      var myCar = cw_carArray[k];
      drawCar(carConstants, myCar, camera, ctx)
    }
  }

/**
   * Toggle individual car visibility on/off.
   * @param {number} carIndex - Car index to toggle
   */
  function toggleDisplay() {
    canvas.width = canvas.width;
    if (doDraw) {
      doDraw = false;
      cw_stopSimulation();
      cw_runningInterval = setInterval(function () {
        var time = performance.now() + (1000 / screenfps);
        while (time > performance.now()) {
          simulationStep();
        }
      }, 1);
    } else {
      doDraw = true;
      clearInterval(cw_runningInterval);
      cw_runningInterval = null;
      cw_startSimulation();
    }
  }

/**
   * Update minimap fog-of-war bar based on floor change state.
   * Called whenever floor seed changes to reveal the full terrain.
   */
  function cw_updateMiniMapFog() {
    var floorChanged = (lastFloorSeed !== world_def.floorseed);
    lastFloorSeed = world_def.floorseed;
    if (floorChanged) {
      minimapfogdistance = 0;
      fogdistance.width = "800px";
    }
  }

/**
   * Draw the minimap terrain floor outline.
   */
  function cw_drawMiniMapFloor() {
    var floorTiles = currentRunner.scene.floorTiles;
    var last_tile = null;
    var tile_position = new b2Vec2(-5, 0);

    minimapcanvas.width = minimapcanvas.width;
    minimapctx.strokeStyle = "#3F72AF";
    minimapctx.beginPath();
    minimapctx.moveTo(0, 35 * minimapscale);
    for (var k = 0; k < floorTiles.length; k++) {
      last_tile = floorTiles[k];
      var last_fixture = last_tile.GetFixtureList();
      var last_world_coords = last_tile.GetWorldPoint(last_fixture.GetShape().m_vertices[3]);
      tile_position = last_world_coords;
      minimapctx.lineTo((tile_position.x + 5) * minimapscale, (-tile_position.y + 35) * minimapscale);
    }
    minimapctx.stroke();
  }

/**
   * Draw the minimap overview showing car positions and terrain.
   */
  function cw_drawMiniMap() {
    cw_updateMiniMapFog();
    cw_drawMiniMapFloor();
  }

  /* ==== END Drawing ======================================================== */
  /* ========================================================================= */
  var uiListeners = {
    preCarStep: function () {
      ghost_move_frame(ghost);
    },
    carStep(car) {
      updateCarUI(car);
    },
    carDeath(carInfo) {

      var k = carInfo.index;

      var car = carInfo.car, score = carInfo.score;
      var cwCar = carMap.get(carInfo);
      cwCar.kill(currentRunner, world_def);

      // refocus camera to leader on death
      if (camera.target == carInfo) {
        cw_setCameraTarget(-1);
      }

      ghost_compare_to_replay(cwCar.replay, ghost, score.v);
      carMap.delete(carInfo);

      score.i = generationState.counter;

      cw_deadCars++;
      var generationSize = genetics.generationConfig.constants.generationSize;
      document.getElementById("population").innerHTML = (generationSize - cw_deadCars).toString();

      if (leaderPosition.leader == k) {
        // leader is dead, find new leader
        cw_findLeader();
      }
    },
    generationEnd(results) {
      cleanupRound(results);
      if (!serverSync.isRunner && applyPendingServerSnapshot()) {
        return;
      }
      return cw_newRound(results);
    }
  }

/**
   * Execute a single simulation step (physics update + status check).
   */
  function simulationStep() {
    currentRunner.step();
    showDistance(
      Math.round(leaderPosition.x * 100) / 100,
      Math.round(leaderPosition.y * 100) / 100
    );
  }

  /**
   * Main animation loop: render frame, advance simulation step.
   * Called via requestAnimationFrame.
   */


  function gameLoop() {
    loops = 0;
    while (!cw_paused && (new Date).getTime() > nextGameTick && loops < maxFrameSkip) {
      nextGameTick += skipTicks;
      loops++;
    }
    simulationStep();
    cw_drawScreen();

    if (!cw_paused) cw_animationFrameId = window.requestAnimationFrame(gameLoop);
  }

/**
   * Update the car information panel with current car data.
   * @param {Object} carInfo - Car state information
   */
  function updateCarUI(carInfo) {
    var k = carInfo.index;
    var car = carMap.get(carInfo);
    var position = car.getPosition();

    ghost_add_replay_frame(car.replay, car.car.car);
    car.minimapmarker.style.left = Math.round((position.x + 5) * minimapscale) + "px";
    car.healthBar.width = Math.round((car.car.state.health / max_car_health) * 100) + "%";
    if (position.x > leaderPosition.x) {
      leaderPosition = position;
      leaderPosition.leader = k;
    }
  }

/**
   * Find the leading car (highest score in current generation).
   * @returns {Object} Leader car data
   */
  function cw_findLeader() {
    var lead = 0;
    carMap.forEach(function(cwCar, carInfo) {
      if (!cwCar.alive) {
        return;
      }
      var position = cwCar.getPosition();
      if (position.x > lead) {
        lead = position.x;
        leaderPosition = position;
        leaderPosition.leader = carInfo.index;
      }
    });
  }

/**
   * Toggle fast-forward mode (multiple physics steps per frame).
   */
  function fastForward() {
    var gen = generationState.counter;
    while (gen === generationState.counter) {
      currentRunner.step();
    }
  }

/**
   * Clean up resources after a simulation round completes.
   * @param {Object} results - Round results
   */
  function cleanupRound(results) {

    results.sort(function (a, b) {
      if (a.score.v > b.score.v) {
        return -1
      } else {
        return 1
      }
    })
    graphState = plot_graphs(
      document.getElementById("graphcanvas"),
      document.getElementById("topscores"),
      null,
      graphState,
      results
    );
  }

/**
   * Reset camera to origin and deselect follow target.
   */
  function cw_resetCameraForRound() {
    camera.pos.x = camera.pos.y = 0;
    cw_setCameraTarget(-1);
  }

/**
   * Compute the next generation from results and current generation config.
   * @param {Object} results - Previous round results
   */
  function cw_generateNextGeneration(results) {
    // Reset Math.random seed to true randomness before mutating.
    // If we don't do this, the mutations will use the exact same deterministic
    // pseudorandom sequence that the physics engine used for the floor,
    // resulting in exact identical clones every generation if the parents
    // happen to have the same scores.
    Math.seedrandom();
    generationState = genetics.manageRound.nextGeneration(
      generationState, results, genetics.generationConfig()
    );
  }

/**
   * Set up ghost for the next round (mutable floor → reset, fixed → rewind).
   */
  function cw_setupGhostForRound() {
    if (world_def.mutable_floor) {
      ghost = null;
      world_def.floorseed = btoa(Math.seedrandom());
    } else {
      ghost_reset_ghost(ghost);
    }
  }

/**
   * Notify server about a new generation.
   */
  function cw_notifyServerOfGeneration() {
    queueServerSave("generation");
  }

/**
   * Start a new simulation round (new generation or restart).
   * @param {Object} results - Previous round results
   */
  function cw_newRound(results) {
    cw_resetCameraForRound();
    cw_generateNextGeneration(results);
    cw_setupGhostForRound();
    currentRunner = worldRun(world_def, generationState.generation, uiListeners);
    setupCarUI();
    cw_drawMiniMap();
    resetCarUI();
    cw_notifyServerOfGeneration();
  }

  /**
   * Start the simulation: initialize state, begin game loop, start server sync.
   */


  function cw_startSimulation() {
    cw_paused = false;
    cw_animationFrameId = window.requestAnimationFrame(gameLoop);
  }

  function cw_stopSimulation() {
    cw_paused = true;
    if (cw_animationFrameId) {
      window.cancelAnimationFrame(cw_animationFrameId);
      cw_animationFrameId = null;
    }
  }

/**
   * Remove all car bodies and fixtures from the Box2D world.
   */
  function cw_clearPopulationWorld() {
    carMap.forEach(function (car) {
      car.kill(currentRunner, world_def);
    });
  }

/**
   * Reset population-related UI elements to initial state.
   */
  function cw_resetPopulationUI() {
    document.getElementById("generation").innerHTML = "";
    document.getElementById("cars").innerHTML = "";
    document.getElementById("topscores").innerHTML = "";
    var _gc = document.getElementById("graphcanvas");
    cw_clearGraphics(_gc, _gc.getContext("2d"), 400, 250);
    resetGraphState();
  }

/**
   * Reset the entire world (physics, UI, population).
   */
  function cw_resetWorld() {
    doDraw = true;
    cw_stopSimulation();
    world_def.floorseed = document.getElementById("newseed").value;
    cw_clearPopulationWorld();
    cw_resetPopulationUI();

    Math.seedrandom();
    cw_generationZero();
    currentRunner = worldRun(
      world_def, generationState.generation, uiListeners
    );

    ghost = ghost_create_ghost();
    resetCarUI();
    setupCarUI()
    cw_drawMiniMap();

    cw_startSimulation();
  }

/**
   * Set up the car information panel UI with click handlers.
   */
  function setupCarUI() {
    currentRunner.cars.map(function (carInfo) {
      var car = new cw_Car(carInfo, carMap);
      carMap.set(carInfo, car);
      car.replay = ghost_create_replay();
      ghost_add_replay_frame(car.replay, car.car.car);
    })
  }


  document.querySelector("#fast-forward").addEventListener("click", function () {
    fastForward()
  });

  document.querySelector("#save-progress").addEventListener("click", function () {
    saveProgress()
  });

  document.querySelector("#restore-progress").addEventListener("click", function () {
    restoreProgress()
  });

  document.querySelector("#toggle-display").addEventListener("click", function () {
    toggleDisplay()
  })

  document.querySelector("#new-population").addEventListener("click", function () {
    cw_stopSimulation();
    cw_clearPopulationWorld();
    cw_resetPopulationUI();
    Math.seedrandom();
    cw_generationZero();
    ghost = ghost_create_ghost();
    currentRunner = worldRun(world_def, generationState.generation, uiListeners);
    setupCarUI();
    cw_drawMiniMap();
    resetCarUI();
    cw_startSimulation();
  })

/**
   * Trigger manual save of current progress to localStorage.
   */
  function saveProgress() {
    saveProgressToLocal(buildProgressSnapshot("manual", { includeGhost: true }));
  }

/**
   * Restore simulation from the last saved progress.
   */
  function restoreProgress() {
    var snapshot = loadProgressFromLocal();
    if (!snapshot) {
      alert("No saved progress found");
      return;
    }
    applyProgressSnapshot(snapshot, { start: true });
  }

  document.querySelector("#confirm-reset").addEventListener("click", function () {
    cw_confirmResetWorld()
  })

/**
   * Confirm and execute world reset after user click.
   */
  function cw_confirmResetWorld() {
    if (confirm('Really reset world?')) {
      cw_resetWorld();
    } else {
      return false;
    }
  }

  // ghost replay stuff


/**
   * Pause the simulation (stop game loop).
   */
  function cw_pauseSimulation() {
    cw_stopSimulation();
    ghost_pause(ghost);
  }

/**
   * Resume a paused simulation.
   */
  function cw_resumeSimulation() {
    ghost_resume(ghost);
    cw_startSimulation();
  }

/**
   * Start ghost replay mode (show best car replay).
   */
  function cw_startGhostReplay() {
    if (!doDraw) {
      toggleDisplay();
    }
    cw_pauseSimulation();
    cw_ghostReplayInterval = setInterval(cw_drawGhostReplay, Math.round(1000 / screenfps));
  }

/**
   * Stop ghost replay mode and resume simulation.
   */
  function cw_stopGhostReplay() {
    clearInterval(cw_ghostReplayInterval);
    cw_ghostReplayInterval = null;
    cw_findLeader();
    camera.pos.x = leaderPosition.x;
    camera.pos.y = leaderPosition.y;
    cw_resumeSimulation();
  }

  document.querySelector("#toggle-ghost").addEventListener("click", function (e) {
    cw_toggleGhostReplay(e.target)
  })

/**
   * Toggle ghost replay on/off via button click.
   * @param {HTMLButtonElement} button - Clicked button element
   */
  function cw_toggleGhostReplay(button) {
    if (cw_ghostReplayInterval == null) {
      cw_startGhostReplay();
      button.value = "Resume simulation";
    } else {
      cw_stopGhostReplay();
      button.value = "View top replay";
    }
  }
  // ghost replay stuff END

  // initial stuff, only called once (hopefully)
  /**
   * Application entry point: initialize all systems and start the first simulation.
   */


  function cw_init() {
    // clone silver dot and health bar
    var mmm = document.getElementsByName('minimapmarker')[0];
    var hbar = document.getElementsByName('healthbar')[0];
    var generationSize = genetics.generationConfig.constants.generationSize;

    for (var k = 0; k < generationSize; k++) {

      // minimap markers
      var newbar = mmm.cloneNode(true);
      newbar.id = "bar" + k;
      newbar.style.paddingTop = k * 9 + "px";
      minimapholder.appendChild(newbar);

      // health bars
      var newhealth = hbar.cloneNode(true);
      newhealth.getElementsByTagName("DIV")[0].id = "health" + k;
      newhealth.car_index = k;
      document.getElementById("health").appendChild(newhealth);
    }
    mmm.parentNode.removeChild(mmm);
    hbar.parentNode.removeChild(hbar);
    world_def.floorseed = btoa(Math.seedrandom());
    cw_generationZero();
    ghost = ghost_create_ghost();
    resetCarUI();
    currentRunner = worldRun(world_def, generationState.generation, uiListeners);
    setupCarUI();
    cw_drawMiniMap();
    initServerSync();

  }

/**
   * Calculate mouse coordinates relative to canvas element.
   * @param {MouseEvent} event - Mouse event
   * @param {HTMLCanvasElement} element - Target canvas
   * @returns {{x: number, y: number}} Relative coordinates
   */
  function relMouseCoords(event, element) {
    var totalOffsetX = 0;
    var totalOffsetY = 0;
    var canvasX = 0;
    var canvasY = 0;
    var currentElement = element;

    do {
      totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
      totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
      currentElement = currentElement.offsetParent
    }
    while (currentElement);

    canvasX = event.pageX - totalOffsetX;
    canvasY = event.pageY - totalOffsetY;

    return { x: canvasX, y: canvasY }
  }
  minimapholder.onclick = function (event) {
    var coords = relMouseCoords(event, minimapholder);
    var cw_carArray = Array.from(carMap.values());
    var closest = {
      value: cw_carArray[0].car,
      dist: Math.abs(((cw_carArray[0].getPosition().x + 6) * minimapscale) - coords.x),
      x: cw_carArray[0].getPosition().x
    }

    var maxX = 0;
    for (var i = 0; i < cw_carArray.length; i++) {
      var pos = cw_carArray[i].getPosition();
      var dist = Math.abs(((pos.x + 6) * minimapscale) - coords.x);
      if (dist < closest.dist) {
        closest.value = cw_carArray[i].car;
        closest.dist = dist;
        closest.x = pos.x;
      }
      maxX = Math.max(pos.x, maxX);
    }

    if (closest.x == maxX) { // focus on leader again
      cw_setCameraTarget(-1);
    } else {
      cw_setCameraTarget(closest.value);
    }
  }


  /**
   * Bind a select element's change event to a setter function.
   * Eliminates repetitive addEventListener boilerplate for dropdown controls.
   * @param {string} selector - CSS selector for the select element
   * @param {Function} setterFn - Function to call with the selected value
   */
  function bindSelectToSetter(selector, setterFn) {
    document.querySelector(selector).addEventListener("change", function (e) {
      setterFn(e.target.options[e.target.selectedIndex].value)
    })
  }

  bindSelectToSetter("#mutationrate", cw_setMutation);
  bindSelectToSetter("#mutationsize", cw_setMutationRange);
  bindSelectToSetter("#floor", cw_setMutableFloor);
  bindSelectToSetter("#gravity", cw_setGravity);
  bindSelectToSetter("#elitesize", cw_setEliteSize);

/**
   * Set the mutation rate for the genetic algorithm.
   * @param {number} mutation - Mutation rate percentage
   */
  function cw_setMutation(mutation) {
    genetics.generationConfig.constants.gen_mutation = parseFloat(mutation);
  }

/**
   * Set the mutation size/range for gene mutation.
   * @param {number} range - Mutation range percentage
   */
  function cw_setMutationRange(range) {
    genetics.generationConfig.constants.mutation_range = parseFloat(range);
  }

/**
   * Set floor mutation mode (fixed vs mutable terrain).
   * @param {string} choice - 'fixed' or 'mutable'
   */
  function cw_setMutableFloor(choice) {
    world_def.mutable_floor = (choice == 1);
  }

/**
   * Set gravity value for the physics simulation.
   * @param {string} choice - Gravity preset name
   */
  function cw_setGravity(choice) {
    world_def.gravity = new b2Vec2(0.0, -parseFloat(choice));
    var world = currentRunner.scene.world
    // CHECK GRAVITY CHANGES
    if (world.GetGravity().y != world_def.gravity.y) {
      world.SetGravity(world_def.gravity);
    }
  }

/**
   * Set the number of elite clones carried to the next generation.
   * @param {number} clones - Number of elite clones
   */
  function cw_setEliteSize(clones) {
    genetics.generationConfig.constants.championLength = parseInt(clones, 10);
  }

// Expose to global scope for inline onclick handlers in index.html
  window.cw_setCameraTarget = cw_setCameraTarget;

  cw_init();


})();
