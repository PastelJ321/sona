/**
 * Damped harmonic spring physics & velocity-aware pointer dynamics.
 * Enables layered physical inertia where heavy frames, articulated blades,
 * and light optical glass settle at distinct, natural physical rhythms.
 */
export class SpringValue {
  public value: number;
  public target: number;
  public velocity = 0;

  private readonly stiffness: number;
  private readonly damping: number;
  private readonly mass: number;
  private readonly min: number;
  private readonly max: number;

  constructor(
    initial: number,
    options?: {
      stiffness?: number;
      damping?: number;
      mass?: number;
      min?: number;
      max?: number;
    },
  ) {
    this.value = initial;
    this.target = initial;
    this.stiffness = options?.stiffness ?? 120;
    this.damping = options?.damping ?? 18;
    this.mass = options?.mass ?? 1;
    this.min = options?.min ?? -Infinity;
    this.max = options?.max ?? Infinity;
  }

  public setTarget(next: number): void {
    this.target = Math.max(this.min, Math.min(this.max, next));
  }

  public impulse(deltaVel: number): void {
    this.velocity += deltaVel / this.mass;
  }

  public snap(val: number): void {
    const clamped = Math.max(this.min, Math.min(this.max, val));
    this.value = clamped;
    this.target = clamped;
    this.velocity = 0;
  }

  public step(dt: number): number {
    const safeDt = Math.min(0.04, Math.max(0.001, dt));
    const force = -this.stiffness * (this.value - this.target);
    const damper = -this.damping * this.velocity;
    const accel = (force + damper) / this.mass;

    this.velocity += accel * safeDt;
    this.value += this.velocity * safeDt;

    if (this.value < this.min) {
      this.value = this.min;
      this.velocity *= -0.2;
    } else if (this.value > this.max) {
      this.value = this.max;
      this.velocity *= -0.2;
    }

    // Settle cleanly to prevent endless micro-jitter
    if (Math.abs(this.velocity) < 0.0001 && Math.abs(this.target - this.value) < 0.0001) {
      this.value = this.target;
      this.velocity = 0;
    }
    return this.value;
  }
}

export class PointerDynamics {
  public rawX = 0;
  public rawY = 0;
  public velX = 0;
  public velY = 0;
  public speed = 0;
  public active = false;

  // Three physical mass tiers for layered 3D response
  public readonly lightX = new SpringValue(0, { stiffness: 185, damping: 18, mass: 0.65, min: -1.1, max: 1.1 });
  public readonly lightY = new SpringValue(0, { stiffness: 185, damping: 18, mass: 0.65, min: -1.1, max: 1.1 });

  public readonly midX = new SpringValue(0, { stiffness: 110, damping: 17, mass: 1.0, min: -1.0, max: 1.0 });
  public readonly midY = new SpringValue(0, { stiffness: 110, damping: 17, mass: 1.0, min: -1.0, max: 1.0 });

  public readonly heavyX = new SpringValue(0, { stiffness: 52, damping: 15, mass: 1.65, min: -0.9, max: 0.9 });
  public readonly heavyY = new SpringValue(0, { stiffness: 52, damping: 15, mass: 1.65, min: -0.9, max: 0.9 });

  public readonly energy = new SpringValue(0, { stiffness: 70, damping: 14, mass: 1.0, min: 0, max: 1.4 });

  private prevRawX = 0;
  private prevRawY = 0;

  public setNormalized(nx: number, ny: number): void {
    // Map [0..1] to [-1..1]
    const cx = Math.max(-1, Math.min(1, (nx - 0.5) * 2));
    const cy = Math.max(-1, Math.min(1, (ny - 0.5) * 2));
    this.rawX = cx;
    this.rawY = cy;
    this.active = true;

    this.lightX.setTarget(cx);
    this.lightY.setTarget(cy);
    this.midX.setTarget(cx);
    this.midY.setTarget(cy);
    this.heavyX.setTarget(cx);
    this.heavyY.setTarget(cy);
  }

  public release(): void {
    this.active = false;
    this.lightX.setTarget(0);
    this.lightY.setTarget(0);
    this.midX.setTarget(0);
    this.midY.setTarget(0);
    this.heavyX.setTarget(0);
    this.heavyY.setTarget(0);
  }

  public triggerClickImpulse(strength = 0.85): void {
    this.energy.impulse(strength * 6.5);
  }

  public update(dt: number): void {
    const safeDt = Math.max(0.008, Math.min(0.05, dt));
    const dx = this.rawX - this.prevRawX;
    const dy = this.rawY - this.prevRawY;
    this.prevRawX = this.rawX;
    this.prevRawY = this.rawY;

    const instVx = Math.max(-12, Math.min(12, dx / safeDt));
    const instVy = Math.max(-12, Math.min(12, dy / safeDt));
    this.velX = this.velX * 0.82 + instVx * 0.18;
    this.velY = this.velY * 0.82 + instVy * 0.18;
    this.speed = Math.min(1.5, Math.hypot(this.velX, this.velY) * 0.24);

    // Feed velocity into spring energy (decays back to 0 when mouse stops)
    this.energy.setTarget(this.speed * 0.72);

    this.lightX.step(safeDt);
    this.lightY.step(safeDt);
    this.midX.step(safeDt);
    this.midY.step(safeDt);
    this.heavyX.step(safeDt);
    this.heavyY.step(safeDt);
    this.energy.step(safeDt);
  }
}
