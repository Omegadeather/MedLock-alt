import Frame from '../components/Frame.jsx'

// Final screen. Finish returns to the start of the flow.

export default function Done({ onFinish, ...frame }) {
  return (
    <Frame
      {...frame}
      onBack={null}
      title="All done"
      primary={
        <button className="btn btn-primary" onClick={onFinish}>
          Finish
        </button>
      }
    >
      <p className="confirm">
        <span className="confirm-symbol" aria-hidden>✓</span>
        Check complete
      </p>
      <p className="body-text">You can now give your injection as directed by your clinic.</p>
    </Frame>
  )
}
