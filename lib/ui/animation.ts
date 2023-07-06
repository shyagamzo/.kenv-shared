export const animate = (text: string, animation: string) => `<span class="inline-block animate-${ animation }">${ text }</span>`;

export const pulse = (text: string) => animate(text, 'pulse');
export const pulseGlow = (text: string) => animate(text, 'pulse-green-glow');
export const spin = (text: string) => animate(text, 'spin');
export const ping = (text: string) => animate(text, 'ping');
export const bounce = (text: string) => animate(text, 'bounce');
export const fadeIn = (text: string) => animate(text, 'fade-in');
