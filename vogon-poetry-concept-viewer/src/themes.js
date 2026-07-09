// Theme tokens. Each theme sets the page background, panel, text, hub color, an accent,
// per edge-type colors, and an 8-family color map keyed A..H.

const CANON = { A: '#1f4e79', B: '#2a9d8f', C: '#6a4c93', D: '#e76f51', E: '#386641', F: '#9b2226', G: '#b08900', H: '#b5179e' }

export const THEMES = {
  light: {
    name: 'Light',
    bg: '#ffffff', panel: '#f7f7f7', text: '#222222', mut: '#777777',
    hub: '#2b2b2b', hubText: '#ffffff', nodeBorder: '#cfcfcf', accent: '#1f4e79',
    edge: { contains: '#dcdcdc', related: '#9aa0a6', crossFamily: '#3a3a3a', dependsOn: '#b5179e' },
    familyColors: { ...CANON },
  },
  dark: {
    name: 'Dark',
    bg: '#0f1115', panel: '#171a21', text: '#e7e7e7', mut: '#8b93a1',
    hub: '#e7e7e7', hubText: '#0f1115', nodeBorder: '#0f1115', accent: '#7fd0ff',
    edge: { contains: '#2a2f3a', related: '#5b6472', crossFamily: '#cfd6e4', dependsOn: '#ff5bd0' },
    familyColors: { A: '#4f9fe0', B: '#3fd0bd', C: '#a98be0', D: '#ff9b7a', E: '#5fb37a', F: '#e0555b', G: '#e0b020', H: '#e85bd0' },
  },
  print: {
    name: 'Print',
    bg: '#ffffff', panel: '#ffffff', text: '#000000', mut: '#555555',
    hub: '#000000', hubText: '#ffffff', nodeBorder: '#000000', accent: '#b5179e',
    edge: { contains: '#bfbfbf', related: '#777777', crossFamily: '#000000', dependsOn: '#b5179e' },
    familyColors: { ...CANON },
  },
  neon: {
    name: 'Neon',
    bg: '#0b0b12', panel: '#11111c', text: '#e6e6f0', mut: '#7d7da0',
    hub: '#d8d8ff', hubText: '#0b0b12', nodeBorder: '#0b0b12', accent: '#00ffc6',
    edge: { contains: '#20203a', related: '#4a4a6a', crossFamily: '#ffffff', dependsOn: '#ff3df0' },
    familyColors: { A: '#00b3ff', B: '#00ffc6', C: '#b388ff', D: '#ff6b3d', E: '#51e36b', F: '#ff2d55', G: '#ffd000', H: '#ff3df0' },
  },
  pastel: {
    name: 'Pastel',
    bg: '#faf7f2', panel: '#f1ece3', text: '#3a3a3a', mut: '#8a8276',
    hub: '#8a8276', hubText: '#ffffff', nodeBorder: '#e6ddd0', accent: '#c08552',
    edge: { contains: '#e3dccf', related: '#b7ad9c', crossFamily: '#6b6256', dependsOn: '#c879b0' },
    familyColors: { A: '#9db8d6', B: '#a6ddd4', C: '#c3b3e0', D: '#f4b9a6', E: '#a9c9b3', F: '#e0a3a6', G: '#e6d199', H: '#e3a9d8' },
  },
  solar: {
    name: 'Solar',
    bg: '#fdf6e3', panel: '#eee8d5', text: '#586e75', mut: '#93a1a1',
    hub: '#586e75', hubText: '#fdf6e3', nodeBorder: '#e3dcc4', accent: '#cb4b16',
    edge: { contains: '#e6dfca', related: '#93a1a1', crossFamily: '#073642', dependsOn: '#d33682' },
    familyColors: { A: '#268bd2', B: '#2aa198', C: '#6c71c4', D: '#cb4b16', E: '#859900', F: '#dc322f', G: '#b58900', H: '#d33682' },
  },
  vogonsDark: {
    name: 'VOGONS Dark',
    bg: '#05080a', panel: '#0b1410', text: '#cfe7cf', mut: '#6f8f6f',
    hub: '#9bdb3a', hubText: '#05080a', nodeBorder: '#05080a', accent: '#a4ff2e',
    edge: { contains: '#1a2a14', related: '#3f5a2a', crossFamily: '#c7f24a', dependsOn: '#7dffb0' },
    familyColors: { A: '#5ad1c8', B: '#9bdb3a', C: '#b07cff', D: '#ff9b3a', E: '#7ad14a', F: '#ff5a6a', G: '#e0d020', H: '#c7f24a' },
  },
  vogonsLight: {
    name: 'VOGONS Light',
    bg: '#eef2e6', panel: '#e2e8d2', text: '#2b3a1e', mut: '#6b7a53',
    hub: '#4b6b1f', hubText: '#eef2e6', nodeBorder: '#cdd7b6', accent: '#6b8e23',
    edge: { contains: '#cdd7b6', related: '#8a9a6b', crossFamily: '#3a4a1e', dependsOn: '#4b6b1f' },
    familyColors: { A: '#4a8a80', B: '#6b8e23', C: '#7a5aa0', D: '#c07a2a', E: '#5a8a3a', F: '#b0433a', G: '#a08a20', H: '#7a9a3a' },
  },
  dontPanicDark: {
    name: "DON'T PANIC Dark",
    bg: '#04120a', panel: '#06210f', text: '#f7ff00', mut: '#8fbf6a',
    hub: '#ff00d4', hubText: '#04120a', nodeBorder: '#00ffe0', accent: '#f7ff00', glow: true,
    edge: { contains: '#1a5a2a', related: '#00e5ff', crossFamily: '#ff2d00', dependsOn: '#ff00d4' },
    familyColors: { A: '#00e5ff', B: '#39ff14', C: '#c800ff', D: '#ff6a00', E: '#00ff87', F: '#ff003c', G: '#ffe600', H: '#ff00d4' },
  },
  dontPanicLight: {
    name: "DON'T PANIC Light",
    bg: '#fff200', panel: '#ffe100', text: '#000000', mut: '#5a5200',
    hub: '#ff0090', hubText: '#ffffff', nodeBorder: '#00e5ff', accent: '#ff2d00', glow: true,
    edge: { contains: '#c9a800', related: '#0066ff', crossFamily: '#ff2d00', dependsOn: '#c800ff' },
    familyColors: { A: '#0066ff', B: '#00b83c', C: '#8c00ff', D: '#ff6a00', E: '#00a86b', F: '#e5002d', G: '#b58900', H: '#e5008c' },
  },
}

export const THEME_KEYS = ['light', 'dark', 'print', 'neon', 'pastel', 'solar', 'vogonsDark', 'vogonsLight', 'dontPanicDark', 'dontPanicLight']
