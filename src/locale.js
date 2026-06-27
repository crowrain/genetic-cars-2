(function () {
  /* =========================================================================
   * Internationalization — English / Русский
   * ========================================================================= */

  var LANG_KEY = 'cw_lang';
  var FALLBACK = 'en';

  var currentLang = localStorage.getItem(LANG_KEY) || FALLBACK;

  var translations = {
    en: {
      // === Page title ===
      'page.title': 'HTML5 Genetic Algorithm 2D Car Thingy — Chrome recommended',

      // === Buttons ===
      'btn.save': '💾 Save Population',
      'btn.restore': '📂 Load Population',
      'btn.toggle_display': 'Hide Cars',
      'btn.toggle_display_show': 'Show Cars',
      'btn.new_population': '🔄 New Population',
      'btn.fast_forward': '⏩ Speed Up',
      'btn.fast_forward_active': '⏩ Speeding Up...',
      'btn.reset': 'Go!',
      'btn.watch_leader': '👁 Watch Leader',
      'btn.best_result': '▶ Best Result',
      'btn.continue': '▶ Resume Simulation',

      // === Server status ===
      'status.start': 'Sync: starting',
      'status.no_state': 'Sync: no saved state yet',
      'status.watching': 'Sync: watching generation {gen}',
      'status.ready': 'Sync: generation {gen} ready; waiting for current round',
      'status.loaded': 'Sync: loaded generation {gen}',
      'status.backend_offline': 'Sync: backend unavailable (port 8089)',
      'status.runner': 'Server runner: generation {gen}',
      'status.runner_saved': 'Server runner: saved generation {gen}',
      'status.runner_sync': 'Server runner: synced with generation {gen}',
      'status.error': 'Sync: {msg}',
      'status.save_error': 'Server save failed: {msg}',
      'status.heartbeat': 'Server runner: heartbeat gen {gen}',
      'status.saving': 'Saving to server...',
      'status.autonomous': 'Sync: autonomous evolution',
      'status.disabled': 'Sync: disabled',
      'status.loading': 'Sync: loading state',
      'status.evolution_loading': 'Evolution: loading state',
      'status.backend_local': 'Sync: backend unavailable (port 8089) — running locally',
      'status.backend_stopped': 'Sync: backend unavailable (port 8089) — polling stopped',
      'status.backend_attempt': 'Sync: backend unavailable (attempt {n}/{max})',

      // === Labels ===
      'label.seed': 'Create new world from seed',
      'label.seed_placeholder': 'Type any string',
      'label.generation': 'Generation',
      'label.population': 'Living Cars',
      'label.distance': 'Distance',
      'label.height': 'Height',
      'label.mutation_rate': 'Mutation rate:',
      'label.mutation_size': 'Mutation size:',
      'label.floor': 'Terrain:',
      'label.floor_fixed': 'fixed',
      'label.floor_mutable': 'mutable',
      'label.gravity': 'Gravity:',
      'label.elite_size': 'Elite clones:',
      'unit.meters': 'm',

      // === Gravity presets ===
      'grav.jupiter': 'Jupiter (24.8)',
      'grav.neptune': 'Neptune (11.2)',
      'grav.saturn': 'Saturn (10.4)',
      'grav.earth': 'Earth (9.81)',
      'grav.venus': 'Venus (8.9)',
      'grav.uranus': 'Uranus (8.7)',
      'grav.mars': 'Mars/Mercury (3.7)',
      'grav.moon': 'Moon (1.6)',

      // === Top scores ===
      'top_scores': '<b>Top Scores:</b><br />',
      'top_scores_header': '<b>Лучшие результаты:</b><br />',

      // === Alerts / Confirm ===
      'alert.no_save': 'No saved progress found',
      'confirm.reset': 'Really reset the world?',

      // === Explanation section ===
      'explanation.what_title': 'What is this?',
      'explanation.what': 'This program uses a simple genetic algorithm to evolve random two-wheeled shapes into cars over generations. ' +
        'Based on <a href="http://boxcar2d.com/">BoxCar2D</a>, but written from scratch using the same physics engine (<a href="http://box2d.org/">box2d</a>).<br />' +
        'seedrandom.js by <a href="http://davidbau.com/">David Bau</a>. (thanks!)',

      'explanation.controls_title': 'Controls',
      'explanation.save_pop': 'Save Population',
      'explanation.save_pop_desc': 'Saves the current population to your browser.',
      'explanation.load_pop': 'Load Population',
      'explanation.load_pop_desc': 'Restores a previously saved population.',
      'explanation.hide_cars': 'Hide Cars',
      'explanation.hide_cars_desc': 'Toggles car rendering — simulation runs faster without drawing.',
      'explanation.new_pop': 'New Population',
      'explanation.new_pop_desc': 'Keeps the generated track and respawns all cars from scratch.',
      'explanation.seed_world': 'Create New World From Seed',
      'explanation.seed_world_desc': 'The same seed always generates the same track — agree on a seed with friends ' +
        'and compete! :)',
      'explanation.mutation_rate': 'Mutation Rate',
      'explanation.mutation_rate_desc': 'The chance that each gene of each organism will change to a random value when ' +
        'a new generation is created.',
      'explanation.mutation_size': 'Mutation Size',
      'explanation.mutation_size_desc': 'The range by which a gene can mutate. Smaller values mean the gene will stay ' +
        'closer to its original value.',
      'explanation.elite_clones': 'Elite Clones',
      'explanation.elite_clones_desc': 'Number of the best cars that will be copied unchanged into the next generation.',
      'explanation.best_result': '▶ Best Result',
      'explanation.best_result_desc': 'Stops the current simulation and replays the best car. Click again to resume.',

      'explanation.graph_title': 'Graph',
      'explanation.graph.red': '🔴 Red',
      'explanation.graph.red_desc': 'Best score in each generation',
      'explanation.graph.green': '🟢 Green',
      'explanation.graph.green_desc': 'Average of top 10 cars in each generation',
      'explanation.graph.blue': '🔵 Blue',
      'explanation.graph.blue_desc': 'Average of the entire population',

      'explanation.genome_title': 'Genome',
      'explanation.genome_intro': 'The genome consists of:',
      'explanation.genome.wheel_count': 'Wheel count (1 gene, range 1–8)',
      'explanation.genome.chassis': 'Chassis shape (8 genes, 1 per vertex)',
      'explanation.genome.wheel_radius': 'Wheel size (8 genes, 1 per wheel)',
      'explanation.genome.wheel_pos': 'Wheel position (8 genes, 1 per wheel)',
      'explanation.genome.wheel_density': 'Wheel density (8 genes, 1 per wheel) — darker = denser',
      'explanation.genome.chassis_density': 'Chassis density (1 gene) — darker = denser',

      'explanation.notes_title': 'Notes',
      'explanation.notes': 'The simulation is not fully deterministic, so your best car may perform slightly differently on a replay. ' +
        'Terrain gets harder with distance.<br />If something looks wrong — refresh the page.',

      'explanation.github_title': 'GitHub',
      'explanation.github': 'Code is available in the <a href="https://github.com/crowrain/genetic-cars-2">GitHub repository</a>. Contributions welcome!',
      'explanation.credits': 'Originally written by <a href="http://rednuht.org">this guy</a>, now maintained by patient people on GitHub.',

      'explanation.language_title': 'Language',

      // === Lang switcher ===
      'lang.en': '🇬🇧 EN',
      'lang.ru': '🇷🇺 RU',
    },

    ru: {
      // === Page title ===
      'page.title': 'Генетический алгоритм 2D-автомобилей — рекомендуется Chrome',

      // === Buttons ===
      'btn.save': '💾 Сохранить популяцию',
      'btn.restore': '📂 Загрузить популяцию',
      'btn.toggle_display': 'Скрывать машины',
      'btn.toggle_display_show': 'Показывать машины',
      'btn.new_population': '🔄 Новая популяция',
      'btn.fast_forward': '⏩ Ускорить',
      'btn.fast_forward_active': '⏩ Ускоряю...',
      'btn.reset': 'Погнали!',
      'btn.watch_leader': '👁 Смотреть лидера',
      'btn.best_result': '▶ Лучший результат',
      'btn.continue': '▶ Продолжить симуляцию',

      // === Server status ===
      'status.start': 'Синхронизация: начало',
      'status.no_state': 'Синхронизация: сохранённого состояния ещё нет',
      'status.watching': 'Синхронизация: наблюдаю поколение {gen}',
      'status.ready': 'Синхронизация: поколение {gen} готово; ожидаю текущий раунд',
      'status.loaded': 'Синхронизация: загружено поколение {gen}',
      'status.backend_offline': 'Синхронизация: бэкенд недоступен (порт 8089)',
      'status.runner': 'Сервер: поколение {gen}',
      'status.runner_saved': 'Сервер: сохранено поколение {gen}',
      'status.runner_sync': 'Сервер: синхронизировано с поколением {gen}',
      'status.error': 'Синхронизация: {msg}',
      'status.save_error': 'Ошибка сохранения: {msg}',
      'status.heartbeat': 'Сервер: heartbeat gen {gen}',
      'status.saving': 'Сохранение на сервер...',
      'status.autonomous': 'Синхронизация: наблюдаю автономную эволюцию',
      'status.disabled': 'Синхронизация: отключена',
      'status.loading': 'Синхронизация: загрузка состояния',
      'status.evolution_loading': 'Эволюция: загрузка состояния',
      'status.backend_local': 'Синхронизация: бэкенд недоступен (порт 8089) — работаю локально',
      'status.backend_stopped': 'Синхронизация: бэкенд недоступен (порт 8089) — опрос остановлен',
      'status.backend_attempt': 'Синхронизация: бэкенд недоступен (попытка {n}/{max})',

      // === Labels ===
      'label.seed': 'Создать новый мир по сид',
      'label.seed_placeholder': 'Введите любую строку',
      'label.generation': 'Поколение',
      'label.population': 'Живых машин',
      'label.distance': 'Дистанция',
      'label.height': 'Высота',
      'label.mutation_rate': 'Частота мутаций:',
      'label.mutation_size': 'Размер мутаций:',
      'label.floor': 'Поверхность:',
      'label.floor_fixed': 'фиксированная',
      'label.floor_mutable': 'мутирующая',
      'label.gravity': 'Гравитация:',
      'label.elite_size': 'Элитные клоны:',
      'unit.meters': 'м',

      // === Gravity presets ===
      'grav.jupiter': 'Юпитер (24.8)',
      'grav.neptune': 'Нептун (11.2)',
      'grav.saturn': 'Сатурн (10.4)',
      'grav.earth': 'Земля (9.81)',
      'grav.venus': 'Венера (8.9)',
      'grav.uranus': 'Уран (8.7)',
      'grav.mars': 'Марс/Меркурий (3.7)',
      'grav.moon': 'Луна (1.6)',

      // === Top scores ===
      'top_scores': '<b>Лучшие результаты:</b><br />',

      // === Alerts / Confirm ===
      'alert.no_save': 'Сохранённый прогресс не найден',
      'confirm.reset': 'Действительно сбросить мир?',

      // === Explanation section ===
      'explanation.what_title': 'Что это такое?',
      'explanation.what': 'Программа использует простой генетический алгоритм для эволюции случайных двухколёсных фигур в автомобили на протяжении поколений. ' +
        'Основано на <a href="http://boxcar2d.com/">BoxCar2D</a>, но ' +
        'написано с нуля, используя тот же движок физики (<a href="http://box2d.org/">box2d</a>).<br />' +
        'seedrandom.js написан <a href="http://davidbau.com/">David Bau</a>. (спасибо!)',

      'explanation.controls_title': 'Управление',
      'explanation.save_pop': 'Сохранить популяцию',
      'explanation.save_pop_desc': 'Сохраняет текущую популяцию локально.',
      'explanation.load_pop': 'Загрузить популяцию',
      'explanation.load_pop_desc': 'Восстанавливает ранее сохранённую популяцию.',
      'explanation.hide_cars': 'Скрывать машины',
      'explanation.hide_cars_desc': 'Переключает отрисовку машин — симуляция становится быстрее.',
      'explanation.new_pop': 'Новая популяция',
      'explanation.new_pop_desc': 'Оставляет сгенерированную трассу и перезапускает всю популяцию машин.',
      'explanation.seed_world': 'Создать новый мир по сид',
      'explanation.seed_world_desc': 'Один и тот же сид всегда создаёт одну и ту же трассу — договоритесь с друзьями о сиде ' +
        'и соревнуйтесь! :)',
      'explanation.mutation_rate': 'Частота мутаций',
      'explanation.mutation_rate_desc': 'Вероятность того, что каждый ген у каждой особи изменится на случайное значение при появлении ' +
        'нового поколения.',
      'explanation.mutation_size': 'Размер мутаций',
      'explanation.mutation_size_desc': 'Диапазон, в котором ген может мутировать. Меньшие значения означают, что ген будет ближе к ' +
        'исходному.',
      'explanation.elite_clones': 'Элитные клоны',
      'explanation.elite_clones_desc': 'Количество лучших машин, которые будут скопированы в следующее поколение без изменений.',
      'explanation.best_result': '▶ Лучший результат',
      'explanation.best_result_desc': 'Останавливает текущую симуляцию и показывает лучшую машину. Нажмите повторно, чтобы ' +
        'возобновить.',

      'explanation.graph_title': 'График',
      'explanation.graph.red': '🔴 Красный',
      'explanation.graph.red_desc': 'Лучший результат в каждом поколении',
      'explanation.graph.green': '🟢 Зелёный',
      'explanation.graph.green_desc': 'Среднее лучших 10 машин в каждом поколении',
      'explanation.graph.blue': '🔵 Синий',
      'explanation.graph.blue_desc': 'Среднее по всей популяции',

      'explanation.genome_title': 'Геном',
      'explanation.genome_intro': 'Геном состоит из:',
      'explanation.genome.wheel_count': 'Количество колёс (1 ген, диапазон 1–8)',
      'explanation.genome.chassis': 'Форма шасси (8 генов, 1 на вершину)',
      'explanation.genome.wheel_radius': 'Размер колёс (8 генов, 1 на колесо)',
      'explanation.genome.wheel_pos': 'Позиция колёс (8 генов, 1 на колесо)',
      'explanation.genome.wheel_density': 'Плотность колёс (8 генов, 1 на колесо) — более тёмные = плотнее',
      'explanation.genome.chassis_density': 'Плотность шасси (1 ген) — более тёмное = плотнее',

      'explanation.notes_title': 'Примечания',
      'explanation.notes': 'Симуляция не полностью детерминирована, поэтому ваша лучшая машина может показать немного другой результат при повторном запуске. ' +
        'Террейн усложняется с расстоянием.<br />Если что-то выглядит не так — обновите страницу.',

      'explanation.github_title': 'GitHub',
      'explanation.github': 'Код доступен в <a href="https://github.com/crowrain/genetic-cars-2">репозитории GitHub</a>. Вклад приветствуется!',
      'explanation.credits': 'Изначально написано <a href="http://rednuht.org">этим парнем</a>, сейчас развивается благодаря терпеливым людям на GitHub.',

      'explanation.language_title': 'Язык',

      // === Lang switcher ===
      'lang.en': '🇬🇧 EN',
      'lang.ru': '🇷🇺 RU',
    }
  };

  /*
   * Translate a key. Supports simple {placeholder} interpolation.
   * Example: t('status.watching', {gen: 42}) → "Sync: watching generation 42"
   */
  function t(key, params) {
    var dict = translations[currentLang] || translations[FALLBACK];
    var str = dict[key] || translations[FALLBACK][key] || key;
    if (params) {
      Object.keys(params).forEach(function (k) {
        str = str.replace('{' + k + '}', params[k]);
      });
    }
    return str;
  }

  /**
   * Switch language and update the entire page.
   */
  function setLang(lang) {
    if (!translations[lang]) lang = FALLBACK;
    currentLang = lang;
    localStorage.setItem(LANG_KEY, lang);

    // Update lang switcher button text
    var btn = document.getElementById('lang-toggle');
    if (btn) {
      if (lang === 'en') {
        btn.value = t('lang.ru');
      } else {
        btn.value = t('lang.en');
      }
    }

    // Title
    document.title = t('page.title');

    // Buttons
    var btnMap = {
      'save-progress': 'btn.save',
      'restore-progress': 'btn.restore',
      'new-population': 'btn.new_population',
      'fast-forward': 'btn.fast_forward',
      'confirm-reset': 'btn.reset',
    };
    Object.keys(btnMap).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.value = t(btnMap[id]);
    });

    // Toggle display button — depends on current state
    var toggleBtn = document.getElementById('toggle-display');
    if (toggleBtn) {
      toggleBtn.value = (typeof doDraw !== 'undefined' && doDraw) ? t('btn.toggle_display') : t('btn.toggle_display_show');
    }

    // Ghost button
    var ghostBtn = document.getElementById('toggle-ghost');
    if (ghostBtn) {
      // We don't know ghost state here, set default
      ghostBtn.value = t('btn.best_result');
    }

    // Watch leader button (inlined in HTML)
    var watchLeaderBtn = document.querySelector('[onclick="cw_setCameraTarget(-1)"]');
    if (watchLeaderBtn) watchLeaderBtn.value = t('btn.watch_leader');

    // Seed label & placeholder
    var seedLabel = document.querySelector('#data label');
    if (seedLabel) seedLabel.textContent = t('label.seed');
    var seedInput = document.getElementById('newseed');
    if (seedInput) seedInput.placeholder = t('label.seed_placeholder');

    // Table labels
    var table = document.querySelector('#data table');
    if (table) {
      var rows = table.querySelectorAll('tr td:first-child');
      var labels = [
        'label.generation',
        'label.population',
        'label.distance',
        'label.height',
        'label.mutation_rate',
        'label.mutation_size',
        'label.floor',
        'label.gravity',
        'label.elite_size',
      ];
      rows.forEach(function (cell, i) {
        if (labels[i]) cell.textContent = t(labels[i]);
      });
    }

    // Floor select options
    var floorSelect = document.getElementById('floor');
    if (floorSelect) {
      floorSelect.options[0].text = t('label.floor_fixed');
      floorSelect.options[1].text = t('label.floor_mutable');
    }

    // Gravity select options
    var gravSelect = document.getElementById('gravity');
    if (gravSelect) {
      var gravKeys = ['grav.jupiter', 'grav.neptune', 'grav.saturn', 'grav.earth',
        'grav.venus', 'grav.uranus', 'grav.mars', 'grav.moon'];
      var opts = gravSelect.options;
      for (var g = 0; g < gravKeys.length && g < opts.length; g++) {
        opts[g].text = t(gravKeys[g]);
      }
    }

    // Explanation section
    var explMap = {
      'explanation.what_title': ['h3', 0],
      'explanation.what': ['p', 0],
      'explanation.controls_title': ['h3', 1],
      'explanation.graph_title': ['h3', 2],
      'explanation.genome_title': ['h3', 3],
      'explanation.notes_title': ['h3', 4],
      'explanation.github_title': ['h3', 5],
    };
    var explDiv = document.getElementById('explanation');
    if (explDiv) {
      var allH3 = explDiv.querySelectorAll('h3');
      var allP = explDiv.querySelectorAll('p');
      var allTables = explDiv.querySelectorAll('table');
      var allUl = explDiv.querySelectorAll('ul');

      // Headers
      if (allH3.length >= 6) {
        allH3[0].textContent = t('explanation.what_title');
        allH3[1].textContent = t('explanation.controls_title');
        allH3[2].textContent = t('explanation.graph_title');
        allH3[3].textContent = t('explanation.genome_title');
        allH3[4].textContent = t('explanation.notes_title');
        allH3[5].textContent = t('explanation.github_title');
      }

      // What is this paragraph
      if (allP.length >= 1) {
        allP[0].innerHTML = t('explanation.what');
      }

      // Controls table
      if (allTables.length >= 1) {
        var ctrlTable = allTables[0];
        var ctrlRows = ctrlTable.querySelectorAll('tr');
        var ctrlData = [
          [t('explanation.save_pop'), t('explanation.save_pop_desc')],
          [t('explanation.load_pop'), t('explanation.load_pop_desc')],
          [t('explanation.hide_cars'), t('explanation.hide_cars_desc')],
          [t('explanation.new_pop'), t('explanation.new_pop_desc')],
          [t('explanation.seed_world'), t('explanation.seed_world_desc')],
          [t('explanation.mutation_rate'), t('explanation.mutation_rate_desc')],
          [t('explanation.mutation_size'), t('explanation.mutation_size_desc')],
          [t('explanation.elite_clones'), t('explanation.elite_clones_desc')],
          [t('explanation.best_result'), t('explanation.best_result_desc')],
        ];
        ctrlRows.forEach(function (row, i) {
          if (i < ctrlData.length) {
            var cells = row.querySelectorAll('th, td');
            if (cells.length >= 2) {
              cells[0].textContent = ctrlData[i][0];
              cells[1].textContent = ctrlData[i][1];
            }
          }
        });
      }

      // Graph table
      if (allTables.length >= 2) {
        var graphTable = allTables[1];
        var graphRows = graphTable.querySelectorAll('tr');
        var graphData = [
          [t('explanation.graph.red'), t('explanation.graph.red_desc')],
          [t('explanation.graph.green'), t('explanation.graph.green_desc')],
          [t('explanation.graph.blue'), t('explanation.graph.blue_desc')],
        ];
        graphRows.forEach(function (row, i) {
          if (i < graphData.length) {
            var cells = row.querySelectorAll('th, td');
            if (cells.length >= 2) {
              cells[0].textContent = graphData[i][0];
              cells[1].textContent = graphData[i][1];
            }
          }
        });
      }

      // Genome list
      if (allUl.length >= 1) {
        var genomeUl = allUl[0];
        var genomeLi = genomeUl.querySelectorAll('li');
        var genomeItems = [
          t('explanation.genome.wheel_count'),
          t('explanation.genome.chassis'),
          t('explanation.genome.wheel_radius'),
          t('explanation.genome.wheel_pos'),
          t('explanation.genome.wheel_density'),
          t('explanation.genome.chassis_density'),
        ];
        genomeLi.forEach(function (li, i) {
          if (i < genomeItems.length) li.textContent = genomeItems[i];
        });
      }

      // Notes paragraph (last p before github)
      if (allP.length >= 2) {
        allP[1].innerHTML = t('explanation.notes');
      }

      // GitHub paragraph
      if (allP.length >= 3) {
        allP[2].innerHTML = t('explanation.github');
      }

      // Credits paragraph
      if (allP.length >= 4) {
        allP[3].textContent = t('explanation.credits');
      }
    }
  }

  /* Expose to global scope */
  window.cw_t = t;
  window.cw_setLang = setLang;
  window.cw_currentLang = function () { return currentLang; };
  window.cw_translations = translations;

  /* On load, apply saved language */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setLang(currentLang);
    });
  } else {
    setLang(currentLang);
  }

})();
