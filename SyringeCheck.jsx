import { useState } from 'react'
import Frame from '../components/Frame.jsx'
import { checkSyringe } from '../api.js'

// Two modes:
//  * mock (no `live` prop): the patient taps Check and the mock answers.
//  * live: the station's state machine drives this screen in real time.
//      IDLE      -> waiting for the syringe to be docked
//      SEATED    -> syringe detected, ready to check
//      MEASURING -> camera + air classifier running
//    RESULT / ERROR are shown by Result.jsx (App.jsx switches to it).

export default function SyringeCheck({ onResult, live, ...frame }) {
  const [mockChecking, setMockChecking] = useState(false)

  const runMock = async () => {
    setMockChecking(true)
    try {
      onResult(await checkSyringe())
    } catch {
      // Network or backend failure is never a pass.
      onResult({ verdict: 'unable', reason: 'The station could not complete the check', action: 'Try again. If it keeps happening, contact your clinic.' })
    } finally {
      setMockChecking(false)
    }
  }

  let phase = 'waiting' // 'offline' | 'waiting' | 'ready' | 'checking'
  if (live) {
    if (!live.connected) phase = 'offline'
    else if (live.state === 'MEASURING') phase = 'checking'
    else if (live.state === 'SEATED') phase = 'ready'
  } else if (mockChecking) {
    phase = 'checking'
  } else {
    phase = 'ready'
  }

  const checking = phase === 'checking'
  const titles = {
    offline: 'Connecting to the station…',
    waiting: 'Dock the syringe',
    ready: live ? 'Syringe detected' : 'Place the syringe in the dock',
    checking: 'Checking your syringe…',
  }
  const bodies = {
    offline: 'Please wait a moment.',
    waiting: 'Press it in until it clicks.',
    ready: live ? 'Keep it still, then tap Check syringe.' : 'Press it in until it clicks. Keep the needle cap on.',
  }
  const canCheck = phase === 'ready'

  return (
    <Frame
      {...frame}
      onBack={checking ? null : frame.onBack}
      title={titles[phase]}
      primary={
        <button className="btn btn-primary" onClick={live ? live.onCheck : runMock} disabled={!canCheck}>
          {checking ? 'Checking…' : phase === 'waiting' ? 'Waiting…' : 'Check syringe'}
        </button>
      }
    >
      {checking ? (
        <div className="checking">
          <div className="spinner" aria-hidden />
          <p className="body-text">Keep the syringe still. This takes a few seconds.</p>
        </div>
      ) : (
        <>
          <p className="body-text">{bodies[phase]}</p>
          {live?.simSeat && live.connected && (
            // Only shown when the station has no seat sensor wired (demo/simulation).
            <button className="btn btn-ghost" onClick={() => live.onSeat(live.state === 'IDLE')}>
              {live.state === 'IDLE' ? 'Seat (demo)' : 'Unseat (demo)'}
            </button>
          )}
        </>
      )}
    </Frame>
  )
}
