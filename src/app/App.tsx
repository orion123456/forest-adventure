import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { menuHero } from '../assets/art'
import { level1 } from '../game/level'
import { Session } from '../game/session'
import type { Snapshot } from '../game/session'
import styles from './App.module.css'

const controls = [
  { keys: ['←', '→'], label: 'Движение' },
  { keys: ['↑'], label: 'Прыжок' },
  { keys: ['Пробел'], label: 'Выстрел' },
  { keys: ['Esc'], label: 'Пауза' },
]
const totalCoins = level1.coins.length

function Leaf() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 4c1 9-2 15-10 15-4 0-6-2-6-5C4 7 13 8 20 4ZM5 21l9-9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
}

function Heart({ filled }: { filled: boolean }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21 3.6 12.8a5.2 5.2 0 0 1 7.3-7.4L12 6.5l1.1-1.1a5.2 5.2 0 0 1 7.3 7.4Z" fill={filled ? '#ff8e72' : '#285049'} stroke={filled ? '#ffd2ac' : '#739188'} strokeWidth="1.3" strokeLinejoin="round"/></svg>
}

function PlayIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7z" fill="currentColor"/></svg>
}

function MainMenu({ start }: { start: () => void }) {
  return <div className={styles.menu}>
    <div className={styles.menuShade}/>
    <div className={styles.chapter}><Leaf /> <span>ГЛАВА 01</span><span className={styles.chapterDot}/> ЛЕС ПАПОРОТНИКОВ</div>
    <div className={styles.intro}>
      <p className={styles.kicker}>ТРОПА ЗОВЁТ</p>
      <h1>Forest<span>Adventure</span></h1>
      <p className={styles.description}>Перепрыгивай овраги, собирай монеты<br className={styles.desktopBreak}/> и доберись до флага на солнечной опушке.</p>
      <button className={styles.primary} onClick={start}><PlayIcon /> Играть</button>
    </div>
    <div className={styles.heroStage} aria-hidden="true">
      <div className={styles.heroGlow}/>
      <div className={styles.heroGround}/>
      <img src={menuHero} alt=""/>
      <i className={styles.firefly}/><i className={styles.firefly}/><i className={styles.firefly}/>
    </div>
    <div className={styles.keys} aria-label="Управление">
      {controls.map(({ keys, label }) => <div className={styles.keyPair} key={label}>
        <span>{keys.map(key => <kbd key={key}>{key}</kbd>)}</span>{label}
      </div>)}
    </div>
  </div>
}

function Hud({ hearts, coins, toggle }: { hearts: number; coins: number; toggle: () => void }) {
  return <div className={styles.hud}>
    <div className={styles.hearts} role="img" aria-label={`Здоровье: ${hearts} из 3`}>
      {[0, 1, 2].map(index => <Heart key={index} filled={index < hearts}/>)}
    </div>
    <div className={styles.hudRight}>
      <div className={styles.coinBadge}><span className={styles.coinIcon} aria-hidden="true">✦</span>Монеты: {coins} / {totalCoins}</div>
      <button className={styles.pause} aria-label="Пауза" onClick={toggle}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6v12m6-12v12" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg></button>
    </div>
  </div>
}

function Results({ snapshot, session }: { snapshot: Snapshot; session: Session }) {
  const { phase, elapsed, coins } = snapshot
  const paused = phase === 'PAUSED'
  const victory = phase === 'VICTORY'
  const seconds = Math.floor(elapsed / 1000)
  const time = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
  return <div className={styles.overlay}>
    <section className={styles.panel} role="dialog" aria-modal="true" aria-labelledby="result-title">
      <div className={styles.panelIcon}><Leaf /></div>
      <p className={styles.kicker}>ЛЕС ПАПОРОТНИКОВ</p>
      <h2 id="result-title">{paused ? 'Пауза' : victory ? 'Победа!' : 'Игра окончена'}</h2>
      {victory && <dl className={styles.stats}><div><dt>Монеты</dt><dd>{coins} / {totalCoins}</dd></div><div><dt>Время</dt><dd>{time}</dd></div></dl>}
      <button className={styles.primary} autoFocus onClick={paused ? session.togglePause : () => session.start()}>
        <PlayIcon /> {paused ? 'Продолжить' : victory ? 'Играть снова' : 'Повторить'}
      </button>
      {paused && <button className={styles.secondary} onClick={() => session.start()}>Начать заново</button>}
      <button className={styles.secondary} onClick={() => session.menu()}>Главное меню</button>
    </section>
  </div>
}

function GameView({ session }: { session: Session }) {
  const parent = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let cancelled = false
    let destroy: (() => void) | undefined
    import('../game/LevelScene').then(({ mountGame }) => {
      if (!cancelled && parent.current) destroy = mountGame(parent.current, session, level1)
    }).catch(() => { if (!cancelled) setFailed(true) })
    return () => { cancelled = true; destroy?.() }
  }, [session])
  return <div className={styles.canvas} ref={parent}>
    {failed && <div className={styles.overlay}><button className={styles.primary} onClick={() => session.menu()}>Не удалось загрузить игру. В меню</button></div>}
  </div>
}

export function App() {
  const [session] = useState(() => new Session())
  const snapshot = useSyncExternalStore(session.subscribe, session.read)
  const { phase, hearts, coins } = snapshot
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (session.read().phase === 'MENU') return
      if (event.code === 'Escape') {
        event.preventDefault()
        if (!event.repeat) session.togglePause()
      }
    }
    window.addEventListener('keydown', keydown)
    return () => window.removeEventListener('keydown', keydown)
  }, [session])

  return <main className={styles.page}>
    <div className={styles.shell}>
      <header className={styles.header}><span className={styles.brand}><Leaf /> WILD TRAILS</span><span className={styles.edition}>ПОЛЕВОЙ ЖУРНАЛ <b>01</b></span></header>
      <div className={styles.stage}>
        {phase === 'MENU' ? <MainMenu start={() => session.start()}/> : <>
          <GameView session={session}/>
          {(phase === 'PLAYING' || phase === 'PAUSED') && <Hud hearts={hearts} coins={coins} toggle={session.togglePause}/>}
          {phase !== 'PLAYING' && <Results key={phase} session={session} snapshot={snapshot}/>}
        </>}
      </div>
      <footer className={styles.footer}><span>FOREST ADVENTURE</span><span><i/> ГЛАВА 01 / ЛЕС ПАПОРОТНИКОВ</span></footer>
    </div>
  </main>
}
