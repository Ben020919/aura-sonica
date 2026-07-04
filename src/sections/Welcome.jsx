import Reveal from '../components/Reveal.jsx'

export default function Welcome() {
  return (
    <section className="section welcome" id="welcome">
      <div className="section-inner">
        <Reveal>
          <div className="eyebrow" style={{ marginBottom: '1.4rem' }}>
            Welcome to Sonica
          </div>
        </Reveal>
        <Reveal delay={0.15}>
          <h2>歡迎來到 Sonica 忘聲海</h2>
        </Reveal>
        <Reveal delay={0.35}>
          <p>
            你今天的聲音,
            <br />
            也會被收進 Aura 的貝殼裡。
          </p>
        </Reveal>
        <Reveal delay={0.6}>
          <div className="divider-shell" style={{ marginTop: '2.4rem' }}>
            🐚
          </div>
        </Reveal>
      </div>
    </section>
  )
}
