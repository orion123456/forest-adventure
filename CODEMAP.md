# Карта кода Forest Adventure

Для правил игры и требований к MVP см. [SPEC.md](SPEC.md). Команды запуска также собраны в [README.md](README.md).

## Точки входа и связи

```text
index.html
└── src/main.tsx → React App
    ├── Session ← useSyncExternalStore → меню, HUD и диалоги
    ├── App.module.css → оболочка и масштабирование интерфейса
    └── GameView → динамический импорт mountGame
        └── LevelScene(session, level1)
            ├── Player и Patrol → Arcade Physics
            ├── level1 → геометрия, монеты, патрули и финиш
            ├── artwork и scenery → текстуры и окружение
            └── Session → здоровье, счёт, время и фаза
```

`App` создаёт один экземпляр `Session` и использует его на протяжении жизни приложения. `GameView` существует вне главного меню и создаёт экземпляр Phaser после загрузки модуля. При выходе в меню React вызывает функцию очистки из `mountGame`. Повтор попытки увеличивает `Snapshot.attempt`, по которому `LevelScene.syncPhase` перезапускает сцену внутри текущего экземпляра Phaser.

## Исходники

| Файл | Ключевые символы | Что искать |
| --- | --- | --- |
| [index.html](index.html), [src/main.tsx](src/main.tsx) | `#root`, `createRoot` | HTML-оболочка и вход в React |
| [src/app/App.tsx](src/app/App.tsx) | `App`, `MainMenu`, `Hud`, `Results`, `GameView` | Выбор экрана по фазе, кнопки, Escape, форматирование времени и подключение движка |
| [src/app/App.module.css](src/app/App.module.css) | `.shell`, `.stage`, `.hud`, `.overlay`, `.panel` | Формат поля 16:9, оформление меню, HUD и диалогов |
| [src/game/session.ts](src/game/session.ts) | `Session`, `Phase`, `Snapshot`, `transitions` | Переходы, сброс, здоровье, неуязвимость, счёт, игровой таймер и интервал между выстрелами |
| [src/game/config.ts](src/game/config.ts) | `VIEW`, `MOTION`, `COMBAT` | Константы разрешения, движения, прыжка, урона и снарядов |
| [src/game/level.ts](src/game/level.ts) | `Level`, `Terrain`, `Enemy`, `level1` | Карта `fernwood`: границы, старт, пропасти, платформы, шипы, монеты, враги и финиш |
| [src/game/LevelScene.ts](src/game/LevelScene.ts) | `mountGame`, `LevelScene` | Конфигурация Phaser, создание объектов, коллайдеры, камера, игровой цикл и очистка |
| [src/game/entities.ts](src/game/entities.ts) | `Player.move`, `Player.hurt`, `Player.die`, `Patrol.move` | Разгон, торможение, буфер прыжка, разворот, позы героя, отбрасывание и траектории врагов |
| [src/game/scenery.ts](src/game/scenery.ts) | `buildScenery`, `paintTerrain`, `paintSpikes`, `trailMarkers` | Слои параллакса, декоративные объекты, таблички, вид земли и шипов |
| [src/assets/art.ts](src/assets/art.ts) | `heroPoses`, `artwork`, `menuHero` | Генерация SVG-кадров, ключи текстур и портрет для меню |
| [src/assets/forest.svg](src/assets/forest.svg), [src/assets/leaf.svg](src/assets/leaf.svg) | — | Лесной фон и иконка вкладки |

## Маршруты по коду

- **Клавиатура и прыжок.** `LevelScene.create` регистрирует игровые клавиши и запоминает короткие нажатия прыжка и выстрела. `LevelScene.update` передаёт направление и запрос прыжка в `Player.move`. Приземление определяется по телу Arcade Physics. Escape обрабатывается в `App` и вызывает `Session.togglePause`.
- **Выстрел и уничтожение врага.** `LevelScene.fire` проверяет вместимость пула и вызывает `Session.shoot` для проверки интервала. При пересечении с препятствием или врагом `impact` деактивирует снаряд. При попадании во врага обработчик также уничтожает его и запускает частицы.
- **Получение урона.** Обработчик пересечения с врагом или шипами вызывает `LevelScene.damage`. `Session.damage` решает, засчитывать ли контакт. При оставшихся сердцах применяется `Player.hurt`. При нуле сцена останавливает физику, запускает `Player.die` и вызывает `Session.lose` по завершении анимации.
- **Монеты и результаты.** Пересечение с монетой вызывает `Session.collect(id)`, после чего сцена скрывает монету и отключает её тело. Касание финишной зоны вызывает `Session.finish`. Падение ниже допустимой границы проверяется в `LevelScene.update` и вызывает `Session.lose`. `App` читает снимок состояния через `useSyncExternalStore`.
- **Карта и графика.** В `level.ts` последовательности длин участков и ширин пропастей определяют координаты земли. Платформы и объекты привязаны к получившимся участкам. `buildScenery` рисует окружение, а `LevelScene.create` создаёт отдельно физические тела. При изменении геометрии обновляйте данные карты, чтобы видимые препятствия совпадали с коллайдерами.
- **Очистка.** `LevelScene.detach` снимает подписку на состояние и обработчики клавиш при остановке или уничтожении сцены. Функция очистки из `mountGame` также вызывает `detach` перед уничтожением Phaser.

## Тесты и конфигурация

| Файл | Назначение |
| --- | --- |
| [tests/unit/session.test.ts](tests/unit/session.test.ts) | Правила отдельной попытки без браузера и Phaser |
| [tests/unit/level.test.ts](tests/unit/level.test.ts) | Количество и размещение монет, запас дальности прыжка, финиш и патрули |
| [tests/e2e/adventure.spec.ts](tests/e2e/adventure.spec.ts) | Реальный браузер: интерфейс, клавиатура, физика, перезапуск и прохождение до флага |
| [playwright.config.ts](playwright.config.ts) | Локальный Vite-сервер в режиме `e2e`, размер окна и выбор канала браузера |
| [tsconfig.json](tsconfig.json) | Строгая проверка TypeScript для исходников и тестов |
| [package.json](package.json), [package-lock.json](package-lock.json) | Команды, прямые зависимости и зафиксированные версии дерева зависимостей |

E2E читает координаты и состояние сцены через `window.forestObserve`. Наблюдатель доступен только в режиме `e2e`. Маршрут в браузерном тесте строится по `level1.gaps` и `level1.spikes`, а герой управляется через клавиатуру.

## С чего начать изменение

| Задача | Точка входа | Что проверить рядом |
| --- | --- | --- |
| Настроить скорость, высоту прыжка или урон | `config.ts` | Геометрия карты, расчёт дальности в unit-тесте и прохождение E2E |
| Переставить препятствия, врагов или монеты | `level.ts` | Опоры патрулей, зазоры для прыжков, безопасный старт и финиш |
| Изменить переходы или логику повтора | `session.ts` | `App`, `LevelScene.syncPhase` и тесты паузы и перезапуска |
| Изменить персонажа или окружение | `art.ts`, `forest.svg`, `scenery.ts` | Ключи текстур, размеры спрайтов и соответствие физическим телам |
| Подключить вторую главу | `level.ts`, `App.tsx` | Передать выбранный `Level` в `mountGame`, привязать HUD и подписи главы к выбранной карте, проверить оформление участков и E2E-маршрут |
