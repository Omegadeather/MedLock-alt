import Frame from '../components/Frame.jsx'
import { PROTOCOL } from '../protocol.js'

// First screen of the patient flow. Shows what is due and a single Begin button.
// `frame` carries the shared props from App.jsx (step, totalSteps, onBack, onHelp).

export default function Start({ onBegin, ...frame }) {
  return (
    <Frame
      {...frame}
      primary={
        <button className="btn btn-primary" onClick={onBegin}>
          Begin
        </button>
      }
    >
      <p className="eyebrow">Today's injection</p>
      <h1 className="title title-lg">{PROTOCOL.medication}</h1>
      <div className="dose-card">
        <div className="dose-time">
          <span className="info-label">Dose</span>
          <span className="info-value">{PROTOCOL.targetVolumeMl} mL</span>
        </div>
        <span className="pill">Ready when you are</span>
      </div>
    </Frame>
  )
}
