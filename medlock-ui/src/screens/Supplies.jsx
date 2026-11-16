import { useEffect, useState } from 'react'
import Frame from '../components/Frame.jsx'
import { PROTOCOL } from '../protocol.js'
import { getSupplies, mock } from '../api.js'

// Supply check. Holder status comes from getSupplies() (mock or real backend).
// Continue is only enabled when every supply is present and correct.

export default function Supplies({ onContinue, ...frame }) {
  const [holders, setHolders] = useState(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let alive = true
    const load = () =>
      getSupplies()
        .then((r) => { if (alive) { setHolders(r.holders); setFailed(false) } })
        .catch(() => { if (alive) setFailed(true) })
    load()
    mock.listeners.add(load) // the dev panel can change the mock while this screen is open
    return () => { alive = false; mock.listeners.delete(load) }
  }, [])

  const problems = holders
    ? PROTOCOL.supplies.filter((s) => !holders[s.id]?.present || !holders[s.id]?.correct)
    : []
  const ready = holders && problems.length === 0

  let title = 'Checking supplies…'
  let body = null
  if (failed) {
    title = "Couldn't check supplies"
    body = <p className="body-text">Please try again.</p>
  } else if (ready) {
    title = 'Supplies'
    body = (
      <p className="confirm">
        <span className="confirm-symbol" aria-hidden>✓</span>
        All supplies are here
      </p>
    )
  } else if (holders) {
    title = 'Supplies needed'
    body = (
      <p className="body-text">
        {problems.map((s) => (holders[s.id]?.present ? `${s.label} (wrong item)` : `${s.label} (missing)`)).join(', ')}
      </p>
    )
  }

  return (
    <Frame
      {...frame}
      title={title}
      primary={
        <button className="btn btn-primary" onClick={onContinue} disabled={!ready}>
          Continue
        </button>
      }
    >
      {body}
    </Frame>
  )
}
