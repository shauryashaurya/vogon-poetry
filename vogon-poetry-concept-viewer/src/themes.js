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
}

export const THEME_KEYS = ['light', 'dark', 'print', 'neon', 'pastel', 'solar']
