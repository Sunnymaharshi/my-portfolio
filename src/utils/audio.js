// Procedural space audio via the Web Audio API — no asset files.
//   • Ambient drone: detuned low oscillators + filtered noise bed, slow LFO
//   • Reactive whoosh: noise through a bandpass whose gain tracks fly speed
//   • Arrival chime: bell-like additive tones with exponential decay
//
// Browsers block audio until a user gesture, so call `audioEngine.init()` from
// the first click / wheel / touch. All public methods are no-ops until then.

class AudioEngine {
  constructor() {
    this.ctx = null
    this.started = false
    this.muted = true   // start silent — sound is opt-in via the HUD toggle
    this.master = null
    this.droneGain = null
    this.whooshGain = null
    this._whooshTarget = 0
  }

  init() {
    if (this.started) {
      // Resume if the context was auto-suspended
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume()
      return
    }
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return
    this.ctx = new AC()
    this.started = true

    const ctx = this.ctx
    this.master = ctx.createGain()
    this.master.gain.value = this.muted ? 0 : 0.85
    this.master.connect(ctx.destination)

    this._buildDrone()
    this._buildWhoosh()

    // Browsers may create the context in a 'suspended' state even when this runs
    // inside a user gesture — resume it or the drone is scheduled but never
    // heard (the toggle would read ON with no sound). resume() is a harmless
    // no-op on an already-running context.
    this.ctx.resume?.()
  }

  // ── Ambient drone bed ──────────────────────────────────────────────
  _buildDrone() {
    const ctx = this.ctx
    const drone = ctx.createGain()
    drone.gain.value = 0.0
    drone.connect(this.master)
    this.droneGain = drone

    // Low detuned oscillators → cavernous pad
    const freqs = [55, 55.4, 82.5, 110]
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 320
    lp.Q.value = 0.7
    lp.connect(drone)

    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator()
      osc.type = i % 2 ? 'sine' : 'triangle'
      osc.frequency.value = f
      const g = ctx.createGain()
      g.gain.value = 0.18 / freqs.length
      osc.connect(g); g.connect(lp)
      osc.start()
    })

    // Filtered noise "solar wind" bed
    const noise = this._noiseSource()
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 220
    bp.Q.value = 0.4
    const ng = ctx.createGain()
    ng.gain.value = 0.05
    noise.connect(bp); bp.connect(ng); ng.connect(drone)
    noise.start()

    // Slow LFO breathing the whole drone
    const lfo = ctx.createOscillator()
    lfo.frequency.value = 0.05
    const lfoGain = ctx.createGain()
    lfoGain.gain.value = 0.06
    lfo.connect(lfoGain); lfoGain.connect(drone.gain)
    lfo.start()

    // Fade in
    drone.gain.setValueAtTime(0.0, ctx.currentTime)
    drone.gain.linearRampToValueAtTime(0.16, ctx.currentTime + 4.0)
  }

  // ── Reactive flight whoosh ─────────────────────────────────────────
  _buildWhoosh() {
    const ctx = this.ctx
    const g = ctx.createGain()
    g.gain.value = 0.0
    g.connect(this.master)
    this.whooshGain = g

    const noise = this._noiseSource()
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 600
    bp.Q.value = 0.8
    noise.connect(bp); bp.connect(g)
    noise.start()
    this._whooshBp = bp
  }

  _noiseSource() {
    const ctx = this.ctx
    const len = ctx.sampleRate * 2
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
    const src = ctx.createBufferSource()
    src.buffer = buffer
    src.loop = true
    return src
  }

  // Called every frame with normalized fly speed (0..1)
  setFlySpeed(speed01) {
    if (!this.started || this.muted) return
    const s = Math.min(Math.max(speed01, 0), 1)
    const g = this.whooshGain
    const now = this.ctx.currentTime
    // Smooth toward target to avoid clicks
    g.gain.setTargetAtTime(s * 0.22, now, 0.12)
    if (this._whooshBp) this._whooshBp.frequency.setTargetAtTime(500 + s * 1400, now, 0.15)
  }

  // ── Arrival chime — pitched per section ────────────────────────────
  chime(sectionIndex) {
    if (!this.started || this.muted) return
    const ctx = this.ctx
    const base = [0, 261.6, 329.6, 392.0, 523.3][sectionIndex] || 329.6
    const partials = [1, 2, 3, 4.2]
    const t0 = ctx.currentTime
    const bus = ctx.createGain()
    bus.gain.value = 0.0001
    bus.connect(this.master)
    bus.gain.exponentialRampToValueAtTime(0.18, t0 + 0.02)
    bus.gain.exponentialRampToValueAtTime(0.0001, t0 + 2.4)

    partials.forEach((p, i) => {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = base * p
      const g = ctx.createGain()
      g.gain.value = 0.5 / (i + 1)
      osc.connect(g); g.connect(bus)
      osc.start(t0)
      osc.stop(t0 + 2.5)
    })
  }

  toggleMute() {
    this.muted = !this.muted
    if (this.master && this.ctx) {
      // Unmuting while the context is suspended would stay silent — resume it.
      if (!this.muted && this.ctx.state === 'suspended') this.ctx.resume?.()
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.85, this.ctx.currentTime, 0.2)
    }
    return this.muted
  }
}

export const audioEngine = new AudioEngine()
