import Frame from '../components/Frame.jsx'
import { PROTOCOL } from '../protocol.js'

// One preparation step from PROTOCOL.prepSteps.
// App.jsx passes `step` as the flow index (Start = 0, Supplies = 1, first prep = 2),
// so the prep number shown to the patient is step - 1.

export default function PrepStep({ prep, step, onNext, ...frame }) {
  const number = step - 1
  const total = PROTOCOL.prepSteps.length

  return (
    <Frame
      {...frame}
      step={step}
      title={prep.title}
      primary={
        <button className="btn btn-primary" onClick={onNext}>
          Next
        </button>
      }
    >
      <p className="eyebrow">Prep {number} of {total}</p>
      <p className="body-text">{prep.detail}</p>
      {prep.warning && <div className="callout callout-warn" role="alert">{prep.warning}</div>}
    </Frame>
  )
}
