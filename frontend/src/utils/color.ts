const palette = ['#38bdf8', '#a855f7', '#f97316', '#f43f5e', '#22c55e', '#eab308', '#0ea5e9', '#ec4899'];

const hashString = (input: string) => {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

export const getUserColor = (userId: string) => {
  const index = hashString(userId) % palette.length;
  return palette[index];
};

export const buildGradient = (colors: string[]) => {
  if (colors.length === 1) {
    return colors[0];
  }
  const stops = colors.map((color, idx) => {
    const start = (idx / colors.length) * 100;
    const end = ((idx + 1) / colors.length) * 100;
    return `${color} ${start.toFixed(1)}% ${end.toFixed(1)}%`;
  });
  return `linear-gradient(135deg, ${stops.join(', ')})`;
};
