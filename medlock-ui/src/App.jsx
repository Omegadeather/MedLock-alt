import { useEffect, useState } from 'react'
import { PROTOCOL } from './protocol.js'
import { logEvent } from './api.js'
import { useStation } from './station.js'
import Start from './screens/Start.jsx'
import Supplies from './screens/Supplies.jsx'
import PrepStep from './screens/PrepStep.jsx'
import SyringeCheck from './screens/SyringeCheck.jsx'
import Result from './screens/Result.jsx'
import Done from './screens/Done.jsx'
import HelpOverlay from './components/HelpOverlay.jsx'
import DevPanel from './components/DevPanel.jsx'

// The whole patient flow, in order. Each entry is one screen.
// Result is not in this list: it is reached only from SyringeCheck.
const FLOW = [
  { kind: 'start' },
  { kind: 'supplies' },
  ...PROTOCOL.prepSteps.map((step) => ({ kind: 'prep', step })),
  { kind: 'check' },
  { kind: 'done' },
]
const TOTAL_STEPS = FLOW.length - 1 // "Start" is not counted as a step
const CHECK_INDEX = FLOW.findIndex((s) => s.kind === 'check')

const UNABLE = {
  verdict: 'unable',
  reason: 'The station could not complete the check',
  action: 'Try again. If it keeps happening, contact your clinic.',
}

export default function App() {
  const [index, setIndex] = useState(0)
  const [result, setResult] = useState(null) // last syringe check result
  const [helpOpen, setHelpOpen] = useState(false)

  const station = useStation()
  const live = station.enabled
  const machine = station.snap?.state // IDLE | SEATED | MEASURING | RESULT | ERROR

  const screen = FLOW[index]

  // The state machine drives the check phase in real time. If a measurement starts
  // or finishes (button on the UI, API call, or a future physical button), make sure
  // the patient is looking at the check screen.
  useEffect(() => {
    if (live && ['MEASURING', 'RESULT', 'ERROR'].includes(machine)) {
      setIndex((i) => (i < CHECK_INDEX ? CHECK_INDEX : i))
    }
  }, [live, machine])

  // Live result comes from the station, never from local state. A leftover result
  // is not shown once the syringe is removed, because the machine returns to IDLE.
  const liveResult =
    live && screen.kind === 'check' && (machine === 'RESULT' || machine === 'ERROR')
      ? station.snap.result ?? UNABLE
      : null
  const shownResult = live ? liveResult : result

  const liveRevision = liveResult ? station.snap.revision : null
  useEffect(() => {
    if (liveResult) logEvent(`check_${liveResult.verdict}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveRevision])
  const next = () => setIndex((i) => Math.min(i + 1, FLOW.length - 1))
  const back = () => {
    setResult(null)
    setIndex((i) => Math.max(i - 1, 0))
  }
  const restart = () => {
    setResult(null)
    setIndex(0)
  }

  const frameProps = {
    step: index,
    totalSteps: TOTAL_STEPS,
    onBack: index > 0 ? back : null,
    onHelp: () => setHelpOpen(true),
  }

  let content
  if (shownResult) {
    content = (
      <Result
        {...frameProps}
        result={shownResult}
        onContinue={() => {
          logEvent('check_passed')
          if (live) station.acknowledge()
          setResult(null)
          next()
        }}
        onRetry={() => {
          if (live) station.acknowledge() // machine goes back to SEATED/IDLE; check screen returns
          setResult(null) // mock mode: back to the syringe check screen
        }}
      />
    )
  } else if (screen.kind === 'start') {
    content = <Start {...frameProps} onBegin={() => { logEvent('session_started'); next() }} />
  } else if (screen.kind === 'supplies') {
    content = <Supplies {...frameProps} onContinue={next} />
  } else if (screen.kind === 'prep') {
    content = <PrepStep {...frameProps} step={index} prep={screen.step} onNext={next} />
  } else if (screen.kind === 'check') {
    content = <SyringeCheck
        {...frameProps}
        onResult={(r) => { logEvent(`check_${r.verdict}`); setResult(r) }}
        live={live ? {
          connected: station.connected,
          state: machine,
          simSeat: station.snap?.sim_seat,
          onCheck: station.measure,
          onSeat: station.setSeat,
        } : null}
      />
  } else if (screen.kind === 'done') {
    content = <Done {...frameProps} onFinish={restart} />
  }

  return (
    <div className="stage">
      <div className="device">
        {content}
        {helpOpen && <HelpOverlay onClose={() => setHelpOpen(false)} />}
      </div>
      {!import.meta.env.VITE_API_URL && !live && (
        <DevPanel screenIndex={index} flow={FLOW} onJump={(i) => { setResult(null); setIndex(i) }} />
      )}
    </div>
  )
}
