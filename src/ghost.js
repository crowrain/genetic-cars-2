/* ==========================================================================
 * ghost/car-to-ghost.js — replay frame extraction helpers
 * ========================================================================== */

/**
 * Extract a single replay frame from a live car (Box2D bodies).
 * @param {{chassis: *, wheels: *[]}} car - Live car with physics bodies
 * @returns {{chassis: *, wheels: *[], pos: {x: number, y: number}}} Frame snapshot
 */
function ghost_get_frame(car) {
  var out = {
    chassis: ghost_get_chassis(car.chassis),
    wheels: [],
    pos: {x: car.chassis.GetPosition().x, y: car.chassis.GetPosition().y}
  };

  for (var i = 0; i < car.wheels.length; i++) {
    out.wheels[i] = ghost_get_wheel(car.wheels[i]);
  }

  return out;
}

/**
 * Extract chassis polygon data from a Box2D body.
 * @param {*} c - Box2D chassis body
 * @returns {Array} Array of polygon vertex data
 */
function ghost_get_chassis(c) {
  var gc = [];

  for (var f = c.GetFixtureList(); f; f = f.m_next) {
    var s = f.GetShape();
    var p = {vtx: [], num: 0};
    p.num = s.m_vertexCount;
    for (var i = 0; i < s.m_vertexCount; i++) {
      p.vtx.push(c.GetWorldPoint(s.m_vertices[i]));
    }
    gc.push(p);
  }

  return gc;
}

/**
 * Extract wheel circle data from a Box2D body.
 * @param {*} w - Box2D wheel body
 * @returns {Array} Array of wheel circle snapshots
 */
function ghost_get_wheel(w) {
  var gw = [];

  for (var f = w.GetFixtureList(); f; f = f.m_next) {
    var s = f.GetShape();
    gw.push({
      pos: w.GetWorldPoint(s.m_p),
      rad: s.m_radius,
      ang: w.m_sweep.a
    });
  }

  return gw;
}

/* ==========================================================================
 * ghost/index.js — ghost replay manager
 * ========================================================================== */

/**
 * Ghost replay module — records and replays car state for visual comparison.
 *
 * All "guard" functions (create, reset, pause, resume, getPosition, compare,
 * move, add frame, draw) short-circuit when {@code enable_ghost === false}
 * or when {@code ghost === null}.
 */
var ghost_fns = (function () {
  var enable_ghost = true;

  /**
   * Guard: return early if ghost is disabled or null.
   * @param {*} ghost - Ghost object (may be null)
   * @returns {boolean} True if guard passed (ghost is enabled and non-null)
   */
  function ghostGuard(ghost) {
    if (!enable_ghost) return false;
    if (ghost == null) return false;
    return true;
  }

  /**
   * Create an empty replay buffer.
   * @returns {{num_frames: number, frames: []}|null}
   */
  function ghost_create_replay() {
    if (!enable_ghost) return null;
    return {num_frames: 0, frames: []};
  }

  /**
   * Create a ghost object for replay visualization.
   * @returns {{replay: *, frame: number, dist: number}|null}
   */
  function ghost_create_ghost() {
    if (!enable_ghost) return null;
    return {replay: null, frame: 0, dist: -100};
  }

  /**
   * Reset ghost playback to frame 0.
   * @param {*} ghost - Ghost object
   */
  function ghost_reset_ghost(ghost) {
    if (!enable_ghost) return;
    if (ghost == null) return;
    ghost.frame = 0;
  }

  /**
   * Pause ghost replay playback (saves current frame).
   * @param {*} ghost - Ghost object
   */
  function ghost_pause(ghost) {
    if (ghost != null) ghost.old_frame = ghost.frame;
    ghost_reset_ghost(ghost);
  }

  /**
   * Resume ghost replay playback (restores saved frame).
   * @param {*} ghost - Ghost object
   */
  function ghost_resume(ghost) {
    if (ghost != null) ghost.frame = ghost.old_frame;
  }

  /**
   * Get current ghost position from replay.
   * @param {*} ghost - Ghost object
   * @returns {{x: number, y: number}|undefined}
   */
  function ghost_get_position(ghost) {
    if (!enable_ghost) return;
    if (ghost == null) return;
    if (ghost.frame < 0) return;
    if (ghost.replay == null) return;
    var frame = ghost.replay.frames[ghost.frame];
    if (!frame) return;
    return frame.pos;
  }

  /**
   * Compare current car position to replay position for synchronization.
   * @param {*} replay - Replay data
   * @param {*} ghost - Ghost object
   * @param {number} max - Maximum distance threshold
   */
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

  /**
   * Advance ghost by one replay frame.
   * @param {*} ghost - Ghost object
   * @returns {boolean} Whether advancement succeeded
   */
  function ghost_move_frame(ghost) {
    if (!enable_ghost) return;
    if (ghost == null) return;
    if (ghost.replay == null) return;
    ghost.frame++;
    if (ghost.frame >= ghost.replay.num_frames) {
      ghost.frame = ghost.replay.num_frames - 1;
    }
  }

  /**
   * Record a frame to the replay buffer.
   * @param {*} car - Car state to record
   * @param {*} replay - Replay buffer
   */
  function ghost_add_replay_frame(replay, car) {
    if (!enable_ghost) return;
    if (replay == null) return;

    var frame = ghost_get_frame(car);
    replay.frames.push(frame);
    replay.num_frames++;
  }

  /**
   * Draw the current ghost replay frame on canvas.
   * @param {*} ctx - Canvas context
   * @param {*} ghost - Ghost object
   * @param {*} camera - Camera with zoom level
   */
  function ghost_draw_frame(ctx, ghost, camera) {
    if (!enable_ghost) return;
    if (ghost == null) return;
    if (ghost.frame < 0) return;
    if (ghost.replay == null) return;

    var zoom = camera.zoom;
    var frame = ghost.replay.frames[ghost.frame];
    if (!frame) return;

    // Wheel style
    ctx.fillStyle = "#eee";
    ctx.strokeStyle = "#aaa";
    ctx.lineWidth = 1 / zoom;

    for (var i = 0; i < frame.wheels.length; i++) {
      for (var w in frame.wheels[i]) {
        ghost_draw_circle(ctx, frame.wheels[i][w].pos, frame.wheels[i][w].rad, frame.wheels[i][w].ang);
      }
    }

    // Chassis style
    ctx.strokeStyle = "#aaa";
    ctx.fillStyle = "#eee";
    ctx.lineWidth = 1 / zoom;
    ctx.beginPath();
    for (var c in frame.chassis)
      ghost_draw_poly(ctx, frame.chassis[c].vtx, frame.chassis[c].num);
    ctx.fill();
    ctx.stroke();
  }

  /* ----- Drawing helpers (pure, no guard needed) ----- */

  /**
   * Draw a polygon for ghost rendering.
   * @param {*} ctx - Canvas context
   * @param {Array} vtx - Polygon vertices
   * @param {number} n_vtx - Vertex count
   */
  function ghost_draw_poly(ctx, vtx, n_vtx) {
    ctx.moveTo(vtx[0].x, vtx[0].y);
    for (var i = 1; i < n_vtx; i++) {
      ctx.lineTo(vtx[i].x, vtx[i].y);
    }
    ctx.lineTo(vtx[0].x, vtx[0].y);
  }

  /**
   * Draw a circle for ghost wheel rendering.
   * @param {*} ctx - Canvas context
   * @param {{x: number, y: number}} center - Center position
   * @param {number} radius - Circle radius
   * @param {number} angle - Rotation angle
   */
  function ghost_draw_circle(ctx, center, radius, angle) {
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI, true);
    ctx.moveTo(center.x, center.y);
    ctx.lineTo(
      center.x + radius * Math.cos(angle),
      center.y + radius * Math.sin(angle)
    );
    ctx.fill();
    ctx.stroke();
  }

  /* ----- Public API ----- */
  return {
    ghostGuard: ghostGuard,
    ghost_create_replay: ghost_create_replay,
    ghost_create_ghost: ghost_create_ghost,
    ghost_reset_ghost: ghost_reset_ghost,
    ghost_pause: ghost_pause,
    ghost_resume: ghost_resume,
    ghost_get_position: ghost_get_position,
    ghost_compare_to_replay: ghost_compare_to_replay,
    ghost_move_frame: ghost_move_frame,
    ghost_add_replay_frame: ghost_add_replay_frame,
    ghost_draw_frame: ghost_draw_frame,
    // Drawing helpers exposed for tests
    ghost_draw_poly: ghost_draw_poly,
    ghost_draw_circle: ghost_draw_circle
  };
})();

/* -------------------------------------------------------------------------
 * Expose car-to-ghost helpers as globals (used by manageRound IIFE)
 * ------------------------------------------------------------------------- */
// These remain global since manageRound calls them directly.
// They are intentionally NOT inside the IIFE.
