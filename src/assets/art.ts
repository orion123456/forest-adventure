import forest from './forest.svg?raw'

const svg = (width: number, height: number, content: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${content}</svg>`

export const heroPoses = ['idle', 'runA', 'runB', 'runC', 'jump', 'fall', 'shoot', 'hurt', 'death'] as const
export type HeroPose = typeof heroPoses[number]

function hero(pose: HeroPose) {
  const legs: Record<HeroPose, [number, number, number, number]> = {
    idle: [32, 68, 53, 68], runA: [21, 59, 64, 67], runB: [37, 66, 45, 58], runC: [64, 62, 21, 66],
    jump: [26, 55, 60, 58], fall: [26, 68, 59, 67], shoot: [32, 68, 53, 68],
    hurt: [25, 59, 58, 62], death: [28, 65, 56, 68],
  }
  const [left, ly, right, ry] = legs[pose]
  const arm = pose === 'shoot' ? [68, 41] : pose === 'jump' || pose === 'fall' ? [60, 32] : [55, 53]
  return svg(84, 80, `
  <g stroke-linecap="round" stroke-linejoin="round">
  <path d="M37 51L${left} ${ly}M47 51L${right} ${ry}" fill="none" stroke="#263b49" stroke-width="13"/>
  <path d="M${left - 4} ${ly}h11M${right - 4} ${ry}h11" stroke="#4c3030" stroke-width="10"/>
  <path d="M${left - 5} ${ly + 3}h13M${right - 5} ${ry + 3}h13" stroke="#d99e68" stroke-width="3"/>
  <path d="M30 31Q12 28 16 52q2 8 17 4z" fill="#996044" stroke="#4e3930" stroke-width="3"/>
  <path d="M22 36l-3 12 8 2" fill="none" stroke="#eab47c" stroke-width="3"/>
  <path d="M30 32q9-6 23 0l3 19q-11 9-28 1z" fill="#218bae" stroke="#244454" stroke-width="3"/>
  <path d="m33 35 3 17" stroke="#e7b46c" stroke-width="4"/>
  <path d="M46 39L${arm[0]} ${arm[1]}" stroke="#233e51" stroke-width="12"/>
  <path d="M46 39L${arm[0]} ${arm[1]}" stroke="#45a7be" stroke-width="8"/>
  <circle cx="${arm[0]}" cy="${arm[1]}" r="5" fill="#efaa77"/>
  ${pose === 'shoot' ? '<path d="M64 34h15v9H65z" fill="#3b3332"/><path d="M68 35h10" stroke="#f9bd63" stroke-width="3"/>' : ''}
  <path d="M31 33q13 9 24-2l3 6q-16 9-29 2z" fill="#ef7452"/>
  <path d="m33 37-12 3-5-3 12-4z" fill="#f28054"/>
  <path d="M31 15q12-12 26 2l2 8q3 3-1 6l-4 1q-7 8-19 2-8-5-4-19z" fill="#f5b985" stroke="#5a3931" stroke-width="2.5"/>
  <path d="M31 26q-6-1-2-10l9-5 5 5-5 10-4-3z" fill="#673c32"/>
  <path d="M26 17q-1-5 6-7l5-7q9-3 17 3l3 8 8 2q-6 7-39 4z" fill="#d46a40" stroke="#61392d" stroke-width="2.5"/>
  <path d="M35 12q10-4 22 2" fill="none" stroke="#ffc677" stroke-width="3"/>
  <path d="${pose === 'hurt' || pose === 'death' ? 'm50 23 4 2-4 2' : 'M52 22v3'}" stroke="#412d31" stroke-width="2.7" fill="none"/>
  <path d="M47 31q4 1 7-1" stroke="#9c5349" stroke-width="1.7" fill="none"/>
  </g>`)
}

const slime = (step: number) => svg(70, 48, `
  <ellipse cx="35" cy="42" rx="30" ry="5" fill="#254635" opacity=".35"/>
  <path d="M5 37Q4 ${26 - step} 15 22 20 ${4 - step} 36 ${5 - step} 56 ${6 - step} 60 26q12 17-9 17H18Q8 43 5 37z" fill="#82c44f" stroke="#285444" stroke-width="3"/>
  <path d="M15 35q17 8 42-2-2 9-22 9T15 35" fill="#4c9c49"/>
  <path d="M22 18q3-6 10-7" stroke="#d4e97b" stroke-width="4" fill="none" stroke-linecap="round"/>
  <ellipse cx="38" cy="24" rx="5" ry="7" fill="#fff5c9"/><ellipse cx="53" cy="24" rx="5" ry="7" fill="#fff5c9"/>
  <path d="M40 24v2m15-2v2m-13 8q4 2 8-1" fill="none" stroke="#243c36" stroke-width="3" stroke-linecap="round"/>
`)

const bat = (wing: number) => svg(88, 58, `
  <path d="M44 27Q32 ${wing} 5 ${wing}l2 18 9-4 7 12 12-2 9 9 9-9 12 2 7-12 9 4 2-18Q56 ${wing} 44 27z" fill="#8467ad" stroke="#3e2d58" stroke-width="3"/>
  <path d="M41 30Q29 ${wing + 6} 11 ${wing + 4}m36 26Q59 ${wing + 6} 77 ${wing + 4}" stroke="#b093ce" stroke-width="2" fill="none"/>
  <path d="M30 29l3-15 9 9h5l10-9 2 17q0 16-15 16T30 29z" fill="#5d447f" stroke="#3e2d58" stroke-width="3"/>
  <path d="M36 33h4m8 0h4" stroke="#ffe5a0" stroke-width="4" stroke-linecap="round"/>
  <path d="m40 39 3 5 2-4 2 4 3-5z" fill="#fff0de"/>
`)

export const artwork: Record<string, string> = {
  forest,
  ...Object.fromEntries(heroPoses.map(pose => [`hero-${pose}`, hero(pose)])),
  'slime-0': slime(0), 'slime-1': slime(4), 'bat-0': bat(5), 'bat-1': bat(23),
  coin: svg(36, 40, '<ellipse cx="18" cy="20" rx="15" ry="17" fill="#f9b342" stroke="#9e572e" stroke-width="3"/><ellipse cx="18" cy="19" rx="10" ry="12" fill="#ffdd70" stroke="#e78b37" stroke-width="2"/><path d="m18 10 2 6 6 3-6 3-2 6-2-6-6-3 6-3z" fill="#fff5b2"/>'),
  shot: svg(30, 12, '<path d="M0 6 18 1q13-2 11 6t-12 4z" fill="#ef8e3a"/><path d="M8 6 23 3q5 2 0 5z" fill="#fff3a8"/>'),
  spark: svg(14, 14, '<path d="m7 0 2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#fff"/>'),
  pine: svg(240, 470, `
    <path d="M100 465q18-96 14-285h19q-2 196 21 285z" fill="#465e43"/>
    <path d="M124 14q24 79 66 125l-27-6q19 42 55 77l-35-6q23 52 49 77-32 6-54-4l48 63q-48 18-100 5-45 14-108-1l41-57q-21 10-48 3 40-47 51-86l-29 7q38-40 51-76l-28 8Q102 82 124 14z" fill="#226851"/>
    <path d="M124 14q24 79 66 125l-27-6q19 42 55 77l-35-6q23 52 49 77-32 6-54-4l48 63q-48 18-100 5z" fill="#195944"/>
    <path d="M78 175q20-10 28-31M55 255q35-6 56-21m-48 79q27 2 49-13" fill="none" stroke="#4a9770" stroke-width="6" stroke-linecap="round"/>
  `),
  shrub: svg(112, 60, '<path d="M2 57Q0 32 25 35 22 11 45 17 55-6 73 13 90 10 93 33q20-3 18 24z" fill="#246b4d"/><path d="M14 52q8-11 22-5m3-17q12-7 20 4m15-11 7 9m-9 16q8-8 18-3" stroke="#5ca46a" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="47" cy="42" r="3" fill="#e8a757"/><circle cx="69" cy="30" r="2.5" fill="#f4cb76"/>'),
  flag: svg(99, 150, '<path d="M12 144V10" stroke="#563b35" stroke-width="10" stroke-linecap="round"/><path d="M12 143V10" stroke="#dfb079" stroke-width="4" stroke-linecap="round"/><path d="M16 15q32-13 79 3L74 42l20 18Q56 44 16 60z" fill="#ef7850" stroke="#843c34" stroke-width="3"/><path d="m49 24 4 8 9 2-7 6 1 9-8-5-8 4 2-9-6-7 9-1z" fill="#ffdf80"/><circle cx="12" cy="9" r="7" fill="#ffd578" stroke="#7f5340" stroke-width="3"/>'),
  grass: svg(60, 31, '<path d="M8 30 2 16q12 2 16 14L16 7q13 7 16 23l5-29 5 22 12-11-4 18z" fill="#62a74d"/><path d="M20 30 17 13m17 17 4-24" stroke="#a3c660" stroke-width="2"/>'),
  rock: svg(68, 36, '<path d="M3 32 15 11 42 3 61 16l5 16z" fill="#68847a" stroke="#375c53" stroke-width="3"/><path d="m15 11 27-8-7 13-20 9z" fill="#a0b1a0"/>'),
}

export const menuHero = `data:image/svg+xml,${encodeURIComponent(artwork['hero-idle'])}`
