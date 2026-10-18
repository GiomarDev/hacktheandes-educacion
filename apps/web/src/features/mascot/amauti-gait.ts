import { gsap } from 'gsap';
export const gaitSpeed = (running = false) =>
  running ? 200 : (2 * 19) / (0.96 * 0.6);
/** Heel contact, weight bearing, toe off, swing. Units are SVG coordinates. */
export function gaitPose(phase: number, running = false) {
  const duty = running ? 0.5 : 0.6,
    stride = running ? 28 : 19;
  const f = ((phase % 1) + 1) % 1,
    swing = f >= duty,
    u = swing ? (f - duty) / (1 - duty) : f / duty;
  const x = swing
    ? -stride + 2 * stride * (u * u * (3 - 2 * u))
    : stride - 2 * stride * u;
  const lift = swing ? (running ? 21 : 13) * Math.sin(Math.PI * u) : 0;
  const heelRise = !swing ? Math.max(0, (u - 0.78) / 0.22) * 5 : 0;
  const toeRise = !swing
    ? Math.max(0, 1 - u / 0.18) * 4
    : 2 * Math.sin(Math.PI * u);
  return { x, lift, heelRise, toeRise, swing };
}
export function addGait(
  t: gsap.core.Timeline,
  svg: SVGSVGElement,
  running: boolean,
) {
  const part = (name: string) => svg.querySelector(`[data-part="${name}"]`)!;
  const legs = ['left', 'right'].map((side) => ({
    path: part(`leg-${side}`).querySelector('path')!,
    arm: part(`arm-${side}`).querySelector('path')!,
    hand: part(`arm-${side}`).querySelector('circle')!,
  }));
  const phase = { value: 0 },
    duration = running ? 0.56 : 0.96;
  let entered = false;
  legs.forEach(({ path }) => {
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('stroke-linecap', 'round');
  });
  const render = () => {
    if (phase.value >= 0.24) entered = true;
    const progress = entered ? 1 : Math.min(1, phase.value / 0.24),
      mix = progress * progress * (3 - 2 * progress);
    const blend = (from: number, to: number) => from + (to - from) * mix;
    const a = phase.value * Math.PI * 2,
      bob = -1.8 * (1 - Math.cos(a * 2)) * mix;
    gsap.set(part('rig'), { y: bob });
    gsap.set(part('pencil'), {
      rotation: 1.2 * Math.sin(a) * mix,
      x: 1.1 * Math.sin(a) * mix,
      svgOrigin: '120 265',
    });
    for (let index = 0; index < 2; index++) {
      const pose = gaitPose(phase.value + index * 0.5, running),
        hipX = index ? 137 : 103,
        hipY = 277;
      const footX = hipX + pose.x,
        ground = 311 - bob,
        ankleY = ground - pose.lift - pose.heelRise;
      const dx = footX - hipX,
        dy = ankleY - hipY,
        distance = Math.max(0.01, Math.hypot(dx, dy));
      const along = distance / 2,
        bend = Math.sqrt(Math.max(0, 23 * 23 - along * along));
      const kneeX = hipX + (dx / distance) * along + (dy / distance) * bend;
      const kneeY = hipY + (dy / distance) * along - (dx / distance) * bend;
      const toeY = ground - pose.lift - pose.toeRise;
      legs[index].path.setAttribute(
        'd',
        `M${hipX} ${hipY} L${blend(index ? 140 : 101, kneeX)} ${blend(294, kneeY)} L${blend(index ? 143 : 99, footX)} ${blend(311, ankleY)} L${blend(index ? 156 : 85, footX + 10)} ${blend(311, toeY)}`,
      );
      const shoulderX = index ? 167 : 73,
        side = index ? 1 : -1,
        angle = 0.32 * Math.sin(a + index * Math.PI - 0.18);
      const elbowX = shoulderX + side * 13 + 17 * Math.sin(angle),
        elbowY = 183;
      const handX = elbowX + side * 9 + 12 * Math.sin(angle + 0.18),
        handY = elbowY + 18 * Math.cos(angle);
      const hx = blend(index ? 204 : 36, handX),
        hy = blend(207, handY);
      legs[index].arm.setAttribute(
        'd',
        `M${shoulderX} 165 Q${blend(index ? 194 : 46, elbowX)} ${blend(177, elbowY)} ${hx} ${hy}`,
      );
      legs[index].hand.setAttribute('cx', String(hx));
      legs[index].hand.setAttribute('cy', String(hy));
    }
    gsap.set(part('shadow'), { scaleX: 0.98, opacity: 0.08 });
  };
  render();
  t.to(phase, { value: 1, duration, ease: 'none', onUpdate: render });
}
