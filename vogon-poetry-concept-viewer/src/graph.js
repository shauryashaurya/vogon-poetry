import data from './data/concept_landscape_v01.json'

export const META = data.meta
export const FAMILIES = data.families
export const INSTINCTS = data.instincts
export const EDGE_TYPES = ['contains', 'related', 'cross-family', 'depends-on']
export const ROOT = 'hhgttg'
export const id = (x) => (typeof x === 'object' ? x.id : x)

// nodes: 1 root + 18 instincts + 80 concepts; links: contains tree + related + cross + depends
export function buildGraph() {
  const nodes = [{ id: ROOT, kind: 'root', label: 'hhgttg', depth: 0 }]
  INSTINCTS.forEach((s) => nodes.push({ id: s.id, kind: 'instinct', label: 'I' + s.num, family: s.family, title: s.title, framing: s.framing, num: s.num, depth: 1 }))
  data.nodes.forEach((n) => nodes.push({ id: n.id, kind: 'concept', label: n.name, family: n.family, instinct: n.instinct, meta: n, depth: 2 }))
  const links = INSTINCTS.map((s) => ({ id: 'r_' + s.id, source: ROOT, target: s.id, type: 'contains' }))
  data.edges.forEach((e) => links.push({ id: e.id, source: e.source, target: e.target, type: e.type }))
  return { nodes, links }
}

// dfs preorder index over the contains tree, for the depth-first layout
export function dfsOrder(nodes, links) {
  const kids = {}
  links.filter((l) => l.type === 'contains').forEach((l) => { (kids[id(l.source)] = kids[id(l.source)] || []).push(id(l.target)) })
  const order = {}
  let i = 0
  const visit = (k) => { order[k] = i++; (kids[k] || []).forEach(visit) }
  visit(ROOT)
  return order
}
