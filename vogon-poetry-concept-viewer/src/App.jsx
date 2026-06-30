import React, { useEffect, useMemo, useRef, useState } from 'react'
import * as d3 from 'd3'
import { buildGraph, dfsOrder, META, FAMILIES, INSTINCTS, EDGE_TYPES, ROOT, id } from './graph.js'
import { THEMES, THEME_KEYS } from './themes.js'

const FORCE0 = { charge: -300, linkDist: 55, linkStr: 0.5, gravity: 0.06, collide: 10, decay: 0.4, spread: 160 }
const STYLE0 = { rConcept: 5, rHub: 8, rRoot: 12, border: 1, nodeOpacity: 1, wContains: 1.4, wRelated: 0.7, wCross: 0.9, wDepends: 1.1, edgeOpacity: 0.55, curve: 'curved', curveAmt: 0.35, arrow: true, crossDashed: false, dependsDashed: true }
const FONT0 = { showLabels: true, size: 9, family: 'sans', weight: 'normal', halo: true }
const FF = { sans: 'ui-sans-serif, system-ui, Segoe UI, Roboto, Helvetica, Arial, sans-serif', serif: 'Georgia, Cambria, Times New Roman, serif', mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }
const LAYOUTS = [ 'free', 'radial', 'breadthfirst', 'tree', 'depthfirst', 'grid' ]
const TREEISH = ( l ) => l === 'radial' || l === 'breadthfirst' || l === 'tree' || l === 'depthfirst'

function Range ( { label, value, min, max, step, onChange, fmt } ) { return <label className="ctl"><span>{ label }<b>{ fmt ? fmt( value ) : value }</b></span><input type="range" min={ min } max={ max } step={ step } value={ value } onChange={ ( e ) => onChange( Number( e.target.value ) ) } /></label> }
function Pick ( { label, value, options, onChange } ) { return <label className="ctl"><span>{ label }</span><select value={ value } onChange={ ( e ) => onChange( e.target.value ) }>{ options.map( ( o ) => <option key={ o } value={ o }>{ o }</option> ) }</select></label> }
function Toggle ( { label, checked, onChange } ) { return <label className="row"><input type="checkbox" checked={ checked } onChange={ ( e ) => onChange( e.target.checked ) } /> { label }</label> }
function wrap ( s, n ) { const w = String( s ).split( ' ' ), out = []; let line = ''; w.forEach( ( t ) => { if ( ( line + ' ' + t ).trim().length > n && line ) { out.push( line.trim() ); line = t } else line += ' ' + t } ); if ( line.trim() ) out.push( line.trim() ); return out.slice( 0, 3 ) }
function hashStr ( s ) { let h = 0; for ( let i = 0; i < s.length; i++ ) h = ( h * 31 + s.charCodeAt( i ) ) | 0; return Math.abs( h ) }

export default function App ()
{
  const G = useMemo( buildGraph, [] )
  const dfs = useMemo( () => dfsOrder( G.nodes, G.links ), [ G ] )
  const byId = useMemo( () => { const m = {}; G.nodes.forEach( ( n ) => ( m[ n.id ] = n ) ); return m }, [ G ] )
  const famName = useMemo( () => { const m = {}; FAMILIES.forEach( ( f ) => ( m[ f.id ] = f.name ) ); return m }, [] )
  const ordIns = useMemo( () => { const m = {}; INSTINCTS.forEach( ( s, i ) => ( m[ s.id ] = i ) ); return m }, [] )
  const bfs = useMemo( () =>
  {
    const kids = {}; G.links.filter( ( l ) => l.type === 'contains' ).forEach( ( l ) => { ( kids[ id( l.source ) ] = kids[ id( l.source ) ] || [] ).push( id( l.target ) ) } )
    const order = [], q = [ ROOT ], seen = new Set( [ ROOT ] )
    while ( q.length ) { const x = q.shift(); order.push( x ); ( kids[ x ] || [] ).forEach( ( c ) => { if ( !seen.has( c ) ) { seen.add( c ); q.push( c ) } } ) }
    const slot = {}, per = {}
    order.forEach( ( k ) => { const d = byId[ k ].depth; per[ d ] = per[ d ] || 0; slot[ k ] = per[ d ]++; } )
    return { slot, per }
  }, [ G, byId ] )

  const svgRef = useRef( null ), simRef = useRef( null ), zoomRef = useRef( null )
  const gViewRef = useRef( null ), gLinkRef = useRef( null ), gNodeRef = useRef( null ), gCardRef = useRef( null )
  const visRef = useRef( { ns: [], ls: [] } ), cardRef = useRef( null ), sizeRef = useRef( { w: 900, h: 700 } ), fnRef = useRef( {} )

  const [ themeKey, setThemeKey ] = useState( 'light' )
  const [ layout, setLayout ] = useState( 'radial' )
  const [ F, setF ] = useState( { ...FORCE0 } )
  const [ S, setS ] = useState( { ...STYLE0 } )
  const [ Fn, setFn ] = useState( { ...FONT0 } )
  const [ families, setFamilies ] = useState( new Set( FAMILIES.map( ( f ) => f.id ) ) )
  const [ edges, setEdges ] = useState( new Set( EDGE_TYPES ) )
  const [ showHubs, setShowHubs ] = useState( true )
  const [ mode, setMode ] = useState( 'full' )
  const [ query, setQuery ] = useState( '' )
  const [ selected, setSelected ] = useState( null )
  const [ insCollapsed, setInsCollapsed ] = useState( false )
  const [ cardsOn, setCardsOn ] = useState( false )
  const [ hiEdge, setHiEdge ] = useState( null )
  const [ scale, setScale ] = useState( 2 )

  const theme = THEMES[ themeKey ]
  const setFv = ( k, v ) => setF( ( p ) => ( { ...p, [ k ]: v } ) )
  const setSv = ( k, v ) => setS( ( p ) => ( { ...p, [ k ]: v } ) )
  const setFnv = ( k, v ) => setFn( ( p ) => ( { ...p, [ k ]: v } ) )
  const edgeColor = ( t ) => ( { contains: theme.edge.contains, related: theme.edge.related, 'cross-family': theme.edge.crossFamily, 'depends-on': theme.edge.dependsOn }[ t ] )
  const ewidth = ( t ) => ( { contains: S.wContains, related: S.wRelated, 'cross-family': S.wCross, 'depends-on': S.wDepends }[ t ] )
  const nodeR = ( d ) => ( d.kind === 'root' ? S.rRoot : d.kind === 'instinct' ? S.rHub : S.rConcept )
  const nodeFill = ( d ) => ( d.kind === 'root' ? theme.accent : d.kind === 'instinct' ? theme.hub : theme.familyColors[ d.family ] )
  const labelLines = ( d ) => ( d.kind === 'concept' ? wrap( d.label, 16 ) : [ d.label ] )
  function collideR ( d )
  {
    const base = nodeR( d ) + 3
    if ( !Fn.showLabels && d.kind === 'concept' ) return Math.max( F.collide, base )
    const ls = labelLines( d ), w = Math.max( ...ls.map( ( l ) => l.length ) ) * Fn.size * 0.55, h = ( ls.length + 1 ) * ( Fn.size + 1 )
    return Math.max( F.collide, base, w / 2, h / 2 )
  }

  useEffect( () =>
  {
    const svg = d3.select( svgRef.current )
    sizeRef.current = { w: svgRef.current.clientWidth || 900, h: svgRef.current.clientHeight || 700 }
    const defs = svg.append( 'defs' )
    defs.append( 'marker' ).attr( 'id', 'arr' ).attr( 'viewBox', '0 -5 10 10' ).attr( 'refX', 9 ).attr( 'refY', 0 ).attr( 'markerWidth', 6 ).attr( 'markerHeight', 6 ).attr( 'orient', 'auto' ).append( 'path' ).attr( 'd', 'M0,-4L8,0L0,4' ).attr( 'class', 'arrhead' )
    const gv = svg.append( 'g' ); gViewRef.current = gv.node()
    gLinkRef.current = gv.append( 'g' ).node(); gNodeRef.current = gv.append( 'g' ).node(); gCardRef.current = gv.append( 'g' ).node()
    const zoom = d3.zoom().scaleExtent( [ 0.05, 6 ] ).on( 'zoom', ( e ) => gv.attr( 'transform', e.transform ) ); svg.call( zoom ); zoomRef.current = zoom
    const sim = d3.forceSimulation().force( 'link', d3.forceLink().id( ( d ) => d.id ) ).force( 'charge', d3.forceManyBody() ).force( 'collide', d3.forceCollide() ).force( 'x', d3.forceX() ).force( 'y', d3.forceY() ).on( 'tick', () => fnRef.current.tick() )
    simRef.current = sim
    applyData(); applyForces(); applyStyles(); sim.alpha( 1 ).restart()
    const t = setTimeout( fit, 1000 )
    const ro = new ResizeObserver( () => { const w = svgRef.current.clientWidth, h = svgRef.current.clientHeight; if ( w && h ) { sizeRef.current = { w, h }; applyForces(); sim.alpha( 0.2 ).restart() } } ); ro.observe( svgRef.current )
    return () => { clearTimeout( t ); ro.disconnect(); sim.stop() }
  }, [] )

  function drag ()
  {
    const sim = simRef.current
    return d3.drag().on( 'start', ( e, d ) => { if ( !e.active ) sim.alphaTarget( 0.2 ).restart(); d.fx = d.x; d.fy = d.y } ).on( 'drag', ( e, d ) => { d.fx = e.x; d.fy = e.y } ).on( 'end', ( e ) => { if ( !e.active ) sim.alphaTarget( 0 ) } )
  }

  function visible ()
  {
    let keepIds = null
    if ( mode === 'aizoom' )
    {
      const H = new Set( G.nodes.filter( ( n ) => n.kind === 'concept' && n.family === 'H' ).map( ( n ) => n.id ) )
      const keep = new Set( H )
      G.links.forEach( ( l ) => { const s = id( l.source ), t = id( l.target ); if ( H.has( s ) ) keep.add( t ); if ( H.has( t ) ) keep.add( s ) } )
      keepIds = keep
    }
    const ns = G.nodes.filter( ( n ) =>
    {
      if ( n.kind === 'root' ) return mode === 'full' && TREEISH( layout )
      if ( mode === 'aizoom' ) return keepIds.has( n.id ) && ( n.kind !== 'instinct' || showHubs )
      if ( n.kind === 'instinct' ) return showHubs && families.has( n.family )
      return families.has( n.family )
    } )
    const ids = new Set( ns.map( ( n ) => n.id ) )
    const ls = G.links.filter( ( l ) => edges.has( l.type ) && ids.has( id( l.source ) ) && ids.has( id( l.target ) ) )
    return { ns, ls }
  }

  function applyData ()
  {
    const { ns, ls } = visible(); visRef.current = { ns, ls }
    d3.select( gLinkRef.current ).selectAll( 'path.link' ).data( ls, ( d ) => d.id ).join( 'path' ).attr( 'class', 'link' ).attr( 'fill', 'none' )
    d3.select( gNodeRef.current ).selectAll( 'g.node' ).data( ns, ( d ) => d.id ).join(
      ( en ) => { const g = en.append( 'g' ).attr( 'class', 'node' ); g.append( 'rect' ).attr( 'class', 'box' ).attr( 'rx', 4 ); g.append( 'circle' ).attr( 'class', 'dot' ); g.append( 'text' ).attr( 'class', 'lbl' ).attr( 'text-anchor', 'middle' ); g.on( 'click', ( e, d ) => fnRef.current.clickNode( d ) ).call( drag() ); return g },
      ( up ) => up, ( ex ) => ex.remove() )
    const sim = simRef.current; sim.nodes( ns ); sim.force( 'link' ).links( ls )
  }

  function clearGridPins () { G.nodes.forEach( ( n ) => { if ( n._gpin ) { n.fx = null; n.fy = null; n._gpin = false } } ) }

  function applyForces ()
  {
    const sim = simRef.current, { w, h } = sizeRef.current, cx = w / 2, cy = h / 2
    clearGridPins()
    sim.velocityDecay( F.decay )
    sim.force( 'charge' ).strength( F.charge )
    sim.force( 'collide' ).radius( collideR ).strength( 0.9 )
    sim.force( 'link' ).distance( ( d ) => F.linkDist * ( d.type === 'contains' ? 0.7 : 1.5 ) ).strength( ( d ) => ( d.type === 'contains' ? F.linkStr : F.linkStr * 0.4 ) )
    sim.force( 'radial', null )
    if ( layout === 'radial' )
    {
      const N = INSTINCTS.length, ang = ( d ) => ( 2 * Math.PI * ordIns[ d.id ] ) / N - Math.PI / 2
      sim.force( 'radial', d3.forceRadial( ( d ) => d.depth * F.spread, cx, cy ).strength( 0.9 ) )
      sim.force( 'x', d3.forceX( ( d ) => ( d.kind === 'instinct' ? cx + Math.cos( ang( d ) ) * F.spread : cx ) ).strength( ( d ) => ( d.kind === 'instinct' ? 0.6 : 0.02 ) ) )
      sim.force( 'y', d3.forceY( ( d ) => ( d.kind === 'instinct' ? cy + Math.sin( ang( d ) ) * F.spread : cy ) ).strength( ( d ) => ( d.kind === 'instinct' ? 0.6 : 0.02 ) ) )
    }
    else if ( layout === 'breadthfirst' ) { const g = F.spread / 8; sim.force( 'x', d3.forceX( ( d ) => cx + ( bfs.slot[ d.id ] - ( bfs.per[ d.depth ] - 1 ) / 2 ) * g ).strength( 0.7 ) ); sim.force( 'y', d3.forceY( ( d ) => cy + ( d.depth - 1 ) * F.spread ).strength( 0.95 ) ) }
    else if ( layout === 'tree' ) { const N = INSTINCTS.length, g = F.spread / 1.5; sim.force( 'x', d3.forceX( ( d ) => ( d.kind === 'instinct' ? cx + ( ordIns[ d.id ] - ( N - 1 ) / 2 ) * g : cx ) ).strength( ( d ) => ( d.kind === 'instinct' ? 0.5 : 0.05 ) ) ); sim.force( 'y', d3.forceY( ( d ) => cy + ( d.depth - 1 ) * F.spread ).strength( 0.9 ) ) }
    else if ( layout === 'depthfirst' ) { const n = G.nodes.length; sim.force( 'x', d3.forceX( ( d ) => cx + ( dfs[ d.id ] - n / 2 ) * ( F.spread / 14 ) ).strength( 0.6 ) ); sim.force( 'y', d3.forceY( ( d ) => cy + d.depth * F.spread ).strength( 0.9 ) ) }
    else if ( layout === 'grid' ) { gridPin( cx, cy ); sim.force( 'x', d3.forceX( cx ).strength( 0 ) ); sim.force( 'y', d3.forceY( cy ).strength( 0 ) ) }
    else { sim.force( 'x', d3.forceX( cx ).strength( F.gravity ) ); sim.force( 'y', d3.forceY( cy ).strength( F.gravity ) ) }
  }

  function gridPin ( cx, cy )
  {
    const ns = visRef.current.ns, cols = Math.ceil( Math.sqrt( ns.length ) ), rows = Math.ceil( ns.length / cols ), g = Math.max( F.spread / 2, ( Fn.showLabels ? Fn.size * 9 : 30 ) )
    // ns.slice().sort( ( a, b ) => ( a.family || '' ).localeCompare( b.family || '' ) || a.depth - b.depth ).forEach( ( nd, i ) => { nd.fx = cx + ( ( i % cols ) - ( cols - 1 ) / 2 ) * g; nd.fy = cy + ( Math.floor( i / cols ) - ( rows - 1 ) / 2 ) * g; nd._gpin = true } )
    const rank = ( n ) => ( n.kind === 'root' ? 0 : n.kind === 'instinct' ? 1 : 2 )
    ns.slice().sort( ( a, b ) => rank( a ) - rank( b ) || ( a.family || '' ).localeCompare( b.family || '' ) || ( a.num || 0 ) - ( b.num || 0 ) || a.label.localeCompare( b.label ) ).forEach( ( nd, i ) => { nd.fx = cx + ( ( i % cols ) - ( cols - 1 ) / 2 ) * g; nd.fy = cy + ( Math.floor( i / cols ) - ( rows - 1 ) / 2 ) * g; nd._gpin = true } )
  }

  function pathFor ( d )
  {
    const x1 = d.source.x, y1 = d.source.y, x2 = d.target.x, y2 = d.target.y
    if ( S.curve === 'straight' ) return `M${ x1 },${ y1 }L${ x2 },${ y2 }`
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot( dx, dy ) || 1
    if ( d._cs === undefined ) d._cs = hashStr( d.id ) % 2 ? 1 : -1
    const k = S.curveAmt * Math.min( L * 0.35, 70 ) * d._cs
    const nx = -dy / L, ny = dx / L
    const c1x = x1 + dx / 3 + nx * k, c1y = y1 + dy / 3 + ny * k
    const c2x = x1 + ( dx * 2 ) / 3 + nx * k, c2y = y1 + ( dy * 2 ) / 3 + ny * k
    return `M${ x1 },${ y1 }C${ c1x },${ c1y } ${ c2x },${ c2y } ${ x2 },${ y2 }`
  }

  function applyStyles ()
  {
    d3.select( svgRef.current ).style( 'background', theme.bg )
    d3.select( gLinkRef.current ).selectAll( 'path.link' )
      .attr( 'stroke', ( d ) => ( d.type === 'contains' ? ( theme.familyColors[ ( byId[ id( d.target ) ] || {} ).family ] || theme.edge.contains ) : edgeColor( d.type ) ) )
      .attr( 'stroke-width', ( d ) => ewidth( d.type ) ).attr( 'stroke-opacity', ( d ) => ( d.type === 'cross-family' ? S.edgeOpacity * 0.7 : S.edgeOpacity ) )
      .attr( 'stroke-dasharray', ( d ) => ( ( d.type === 'cross-family' && S.crossDashed ) || ( d.type === 'depends-on' && S.dependsDashed ) ? '4 3' : null ) )
      .attr( 'marker-end', ( d ) => ( S.arrow && d.type === 'depends-on' ? 'url(#arr)' : null ) )
    d3.select( svgRef.current ).selectAll( '.arrhead' ).attr( 'fill', theme.edge.dependsOn )
    const node = d3.select( gNodeRef.current ).selectAll( 'g.node' )
    node.style( 'cursor', ( d ) => ( d.kind === 'root' ? 'default' : 'pointer' ) )
    // leaf concepts: circle plus wrapped label below with halo (unchanged, looks good)
    node.select( 'circle.dot' ).attr( 'display', ( d ) => ( d.kind === 'concept' ? null : 'none' ) ).attr( 'r', nodeR ).attr( 'fill', nodeFill ).attr( 'fill-opacity', S.nodeOpacity ).attr( 'stroke', theme.nodeBorder ).attr( 'stroke-width', S.border )
    node.select( 'text.lbl' )
      .attr( 'display', ( d ) => ( d.kind === 'concept' && !Fn.showLabels ? 'none' : null ) )
      .attr( 'fill', ( d ) => ( d.kind === 'instinct' ? theme.hubText : d.kind === 'root' ? theme.bg : theme.text ) )
      .attr( 'font-family', FF[ Fn.family ] ).attr( 'font-size', ( d ) => ( d.kind === 'concept' ? Fn.size : d.kind === 'root' ? S.rRoot : S.rHub ) ).attr( 'font-weight', ( d ) => ( d.kind === 'concept' ? Fn.weight : 'bold' ) )
      .attr( 'stroke', ( d ) => ( d.kind === 'concept' && Fn.halo ? theme.bg : null ) ).attr( 'stroke-width', ( d ) => ( d.kind === 'concept' && Fn.halo ? 3.5 : 0 ) ).attr( 'stroke-linejoin', 'round' ).attr( 'paint-order', 'stroke' )
      .each( function ( d )
      {
        const t = d3.select( this ); t.selectAll( 'tspan' ).remove()
        if ( d.kind === 'concept' ) { const ls = labelLines( d ), y0 = nodeR( d ) + Fn.size; ls.forEach( ( ln, i ) => t.append( 'tspan' ).attr( 'x', 0 ).attr( 'y', y0 + i * ( Fn.size + 1 ) ).text( ln ) ) }
        else t.append( 'tspan' ).attr( 'x', 0 ).attr( 'dy', '0.34em' ).text( d.label )
      } )
    // root and instinct hubs: a label-fitted rounded box (v02/v03 styling), no halo
    node.each( function ( d )
    {
      const box = d3.select( this ).select( 'rect.box' )
      if ( d.kind === 'concept' ) { box.attr( 'display', 'none' ); return }
      const bb = d3.select( this ).select( 'text.lbl' ).node().getBBox(), px = 9, py = 5
      box.attr( 'display', null ).attr( 'x', bb.x - px ).attr( 'y', bb.y - py ).attr( 'width', bb.width + px * 2 ).attr( 'height', bb.height + py * 2 )
        .attr( 'fill', d.kind === 'root' ? theme.accent : theme.hub ).attr( 'stroke', theme.nodeBorder ).attr( 'stroke-width', S.border )
    } )
  }

  function tick ()
  {
    d3.select( gLinkRef.current ).selectAll( 'path.link' ).attr( 'd', pathFor )
    d3.select( gNodeRef.current ).selectAll( 'g.node' ).attr( 'transform', ( d ) => `translate(${ d.x },${ d.y })` )
    if ( cardRef.current ) positionCards()
  }

  useEffect( () => { if ( simRef.current ) { applyData(); applyForces(); applyStyles(); simRef.current.alpha( 0.7 ).restart() } }, [ families, edges, showHubs, mode ] )
  useEffect( () => { if ( simRef.current ) { applyForces(); simRef.current.alpha( 0.85 ).restart() } }, [ layout, F ] )
  useEffect( () => { if ( simRef.current ) { applyStyles(); fnRef.current.tick(); simRef.current.force( 'collide' ).radius( collideR ); simRef.current.alpha( 0.3 ).restart() } }, [ themeKey, S, Fn ] )
  // reset transient state when the layout changes so nothing stays frozen
  useEffect( () =>
  {
    if ( !simRef.current ) return
    removeCards(); setCardsOn( false ); setSelected( null ); clearFade()
    G.nodes.forEach( ( n ) => { if ( !n._gpin ) { n.fx = null; n.fy = null } } )
    const t = setTimeout( fit, 700 ); return () => clearTimeout( t )
  }, [ layout ] )

  function setFade ( keepNode, keepLink )
  {
    d3.select( gNodeRef.current ).selectAll( 'g.node' ).style( 'opacity', ( d ) => ( keepNode( d ) ? 1 : 0.07 ) )
    d3.select( gLinkRef.current ).selectAll( 'path.link' ).style( 'opacity', ( d ) => ( keepLink( d ) ? 1 : 0.05 ) )
  }
  function clearFade () { d3.select( gNodeRef.current ).selectAll( 'g.node' ).style( 'opacity', 1 ); d3.select( gLinkRef.current ).selectAll( 'path.link' ).style( 'opacity', 1 ) }
  function instinctSet ( insId ) { const keep = new Set( [ insId ] ); G.links.forEach( ( l ) => { if ( l.type === 'contains' && id( l.source ) === insId ) keep.add( id( l.target ) ); if ( l.type === 'depends-on' && id( l.target ) === insId ) keep.add( id( l.source ) ) } ); return keep }
  function highlightInstinct ( insId ) { const k = instinctSet( insId ); setFade( ( d ) => k.has( d.id ), ( d ) => k.has( id( d.source ) ) && k.has( id( d.target ) ) ) }
  function highlightEdgeType ( t ) { const lit = new Set(); G.links.forEach( ( l ) => { if ( l.type === t ) { lit.add( id( l.source ) ); lit.add( id( l.target ) ) } } ); setFade( ( d ) => lit.has( d.id ), ( d ) => d.type === t ) }
  function restoreHighlight () { if ( hiEdge ) return highlightEdgeType( hiEdge ); if ( selected && selected.kind === 'instinct' ) return highlightInstinct( selected.id ); clearFade() }
  function seeAll () { setHiEdge( null ); setSelected( null ); removeCards(); setCardsOn( false ); clearFade(); fit() }

  // function clickNode(d) {
  //   if (d.kind === 'root') return
  //   setSelected(d.kind === 'concept' ? { kind: 'concept', ...d.meta } : { kind: 'instinct', id: d.id, label: d.label, family: d.family, title: d.title, framing: d.framing })
  //   if (cardsOn && d.kind === 'instinct') showCardsFor(d.id); else highlightInstinct(d.kind === 'instinct' ? d.id : d.instinct)
  // }
  function clickNode ( d )
  {
    if ( d.kind === 'root' ) return
    const insId = d.kind === 'instinct' ? d.id : d.instinct
    if ( cardsOn ) { focusInstinct( insId ); return }
    setSelected( d.kind === 'concept' ? { kind: 'concept', ...d.meta } : { kind: 'instinct', id: d.id, label: d.label, family: d.family, title: d.title, framing: d.framing } )
    highlightInstinct( insId )
  }
  function focusInstinct ( insId )
  {
    const s = INSTINCTS.find( ( x ) => x.id === insId )
    setSelected( { kind: 'instinct', id: insId, label: 'I' + s.num, family: s.family, title: s.title, framing: s.framing } )
    if ( cardsOn ) showCardsFor( insId ); else { highlightInstinct( insId ); zoomToSet( instinctSet( insId ) ) }
  }

  function showCardsFor ( insId )
  {
    removeCards()
    const hub = byId[ insId ], concepts = G.nodes.filter( ( n ) => n.kind === 'concept' && n.instinct === insId ), k = concepts.length || 1
    const cardW = 150, lh = 9, off = 80
    const Rcard = Math.max( 190, ( k * ( cardW + 26 ) ) / ( 2 * Math.PI ) ), Rcon = Math.max( 120, Rcard - off )
    const cx = hub.x, cy = hub.y
    hub.fx = cx; hub.fy = cy
    concepts.forEach( ( n, j ) => { const a = ( 2 * Math.PI * j ) / k - Math.PI / 2; n.fx = cx + Rcon * Math.cos( a ); n.fy = cy + Rcon * Math.sin( a ) } )
    const data = concepts.map( ( n ) => ( { id: n.id, lines: wrap( n.label + ': ' + ( n.meta.what || '' ), 26 ) } ) )
    cardRef.current = { insId, off, cardW, lh }
    const sel = d3.select( gCardRef.current ).selectAll( 'g.card' ).data( data, ( d ) => d.id ).join( ( en ) => { const c = en.append( 'g' ).attr( 'class', 'card' ); c.append( 'line' ).attr( 'class', 'cl' ); c.append( 'rect' ).attr( 'rx', 4 ).attr( 'x', -cardW / 2 ).attr( 'width', cardW ); c.append( 'text' ).attr( 'class', 'ct' ).attr( 'text-anchor', 'middle' ); return c } )
    sel.select( 'rect' ).attr( 'y', -8 ).attr( 'height', ( d ) => d.lines.length * lh + 8 ).attr( 'fill', theme.panel ).attr( 'stroke', theme.accent ).attr( 'stroke-width', 1 )
    sel.select( 'text.ct' ).attr( 'fill', theme.text ).attr( 'font-family', FF[ Fn.family ] ).attr( 'font-size', 7 ).each( function ( d ) { const t = d3.select( this ); t.selectAll( 'tspan' ).remove(); d.lines.forEach( ( ln, i ) => t.append( 'tspan' ).attr( 'x', 0 ).attr( 'y', i * lh ).text( ln ) ) } )
    sel.select( 'line.cl' ).attr( 'stroke', theme.accent ).attr( 'stroke-width', 0.8 )
    highlightInstinct( insId ); simRef.current.alpha( 0.5 ).restart(); positionCards()
    setTimeout( () => { const R = Rcard + 110; zoomBox( hub.x - R, hub.y - R, hub.x + R, hub.y + R ) }, 380 )
  }
  function positionCards ()
  {
    const info = cardRef.current; if ( !info ) return; const hub = byId[ info.insId ]
    d3.select( gCardRef.current ).selectAll( 'g.card' )
      .attr( 'transform', ( d ) => { const c = byId[ d.id ], dx = c.x - hub.x, dy = c.y - hub.y, L = Math.hypot( dx, dy ) || 1; return `translate(${ c.x + ( dx / L ) * info.off },${ c.y + ( dy / L ) * info.off })` } )
      .select( 'line.cl' )
      .attr( 'x1', ( d ) => { const c = byId[ d.id ], dx = c.x - hub.x, dy = c.y - hub.y, L = Math.hypot( dx, dy ) || 1; return -( dx / L ) * info.off } ).attr( 'y1', ( d ) => { const c = byId[ d.id ], dx = c.x - hub.x, dy = c.y - hub.y, L = Math.hypot( dx, dy ) || 1; return -( dy / L ) * info.off } ).attr( 'x2', 0 ).attr( 'y2', 0 )
  }
  function removeCards ()
  {
    const info = cardRef.current
    if ( info ) { const hub = byId[ info.insId ]; if ( hub ) { hub.fx = null; hub.fy = null } G.nodes.forEach( ( n ) => { if ( n.kind === 'concept' && n.instinct === info.insId ) { n.fx = null; n.fy = null } } ) }
    cardRef.current = null; d3.select( gCardRef.current ).selectAll( 'g.card' ).remove()
  }
  function toggleCards ()
  {
    if ( cardsOn ) { removeCards(); setCardsOn( false ); clearFade(); simRef.current.alpha( 0.5 ).restart(); return }
    if ( !selected || selected.kind !== 'instinct' ) return
    showCardsFor( selected.id ); setCardsOn( true )
  }

  function toggleFamily ( fid ) { setMode( 'full' ); setFamilies( ( p ) => { const n = new Set( p ); n.has( fid ) ? n.delete( fid ) : n.add( fid ); return n } ) }
  function toggleEdge ( t ) { setEdges( ( p ) => { const n = new Set( p ); n.has( t ) ? n.delete( t ) : n.add( t ); return n } ) }
  function preset ( which ) { if ( which === 'full' ) { setMode( 'full' ); setFamilies( new Set( FAMILIES.map( ( f ) => f.id ) ) ); setEdges( new Set( EDGE_TYPES ) ) } else setMode( 'aizoom' ) }
  function doSearch ( e ) { e.preventDefault(); const q = query.trim().toLowerCase(); if ( !q ) return; const hit = visRef.current.ns.find( ( n ) => n.kind === 'concept' && n.label.toLowerCase().includes( q ) ); if ( hit ) { clickNode( hit ); zoomToSet( new Set( [ hit.id ] ), 2 ) } }

  function bboxOf ( idset ) { const ns = visRef.current.ns.filter( ( n ) => !idset || idset.has( n.id ) ); if ( !ns.length ) return null; const xs = ns.map( ( n ) => n.x ), ys = ns.map( ( n ) => n.y ); return [ Math.min( ...xs ), Math.min( ...ys ), Math.max( ...xs ), Math.max( ...ys ) ] }
  function zoomBox ( x0, y0, x1, y1, k ) { const { w, h } = sizeRef.current, sp = Math.max( ( x1 - x0 ) / w, ( y1 - y0 ) / h ) || 1; let s = k || 0.9 / sp; if ( !isFinite( s ) || s <= 0 ) s = 1; s = Math.min( 6, s ); const tx = w / 2 - s * ( x0 + x1 ) / 2, ty = h / 2 - s * ( y0 + y1 ) / 2; d3.select( svgRef.current ).transition().duration( 400 ).call( zoomRef.current.transform, d3.zoomIdentity.translate( tx, ty ).scale( s ) ) }
  function zoomToSet ( idset, k ) { const b = bboxOf( idset ); if ( b ) zoomBox( b[ 0 ] - 40, b[ 1 ] - 40, b[ 2 ] + 40, b[ 3 ] + 40, k ) }
  function fit () { zoomToSet( null ) }

  function exportString ()
  {
    const b = bboxOf( null ); if ( !b ) return ''; const pad = 50, W = b[ 2 ] - b[ 0 ] + pad * 2, H = b[ 3 ] - b[ 1 ] + pad * 2, ns = 'http://www.w3.org/2000/svg'
    const out = document.createElementNS( ns, 'svg' ); out.setAttribute( 'xmlns', ns ); out.setAttribute( 'width', W * scale ); out.setAttribute( 'height', H * scale ); out.setAttribute( 'viewBox', `${ b[ 0 ] - pad } ${ b[ 1 ] - pad } ${ W } ${ H }` )
    const bg = document.createElementNS( ns, 'rect' ); bg.setAttribute( 'x', b[ 0 ] - pad ); bg.setAttribute( 'y', b[ 1 ] - pad ); bg.setAttribute( 'width', W ); bg.setAttribute( 'height', H ); bg.setAttribute( 'fill', theme.bg ); out.appendChild( bg )
    const defs = svgRef.current.querySelector( 'defs' ); if ( defs ) out.appendChild( defs.cloneNode( true ) )
    const clone = gViewRef.current.cloneNode( true ); clone.removeAttribute( 'transform' ); out.appendChild( clone )
    return new XMLSerializer().serializeToString( out )
  }
  function dl ( blob, name ) { const u = URL.createObjectURL( blob ); const a = document.createElement( 'a' ); a.href = u; a.download = name; a.click(); URL.revokeObjectURL( u ) }
  function exportSVG () { dl( new Blob( [ exportString() ], { type: 'image/svg+xml' } ), `vogon-poetry-${ themeKey }.svg` ) }
  function exportPNG () { const u = URL.createObjectURL( new Blob( [ exportString() ], { type: 'image/svg+xml' } ) ), img = new Image(); img.onload = () => { const c = document.createElement( 'canvas' ); c.width = img.width; c.height = img.height; const g = c.getContext( '2d' ); g.fillStyle = theme.bg; g.fillRect( 0, 0, c.width, c.height ); g.drawImage( img, 0, 0 ); c.toBlob( ( bl ) => { dl( bl, `vogon-poetry-${ themeKey }.png` ); URL.revokeObjectURL( u ) } ) }; img.src = u }
  function reheat () { simRef.current.alpha( 0.9 ).restart() }
  function unpin () { G.nodes.forEach( ( n ) => { n.fx = null; n.fy = null; n._gpin = false } ); reheat() }
  function resetAll () { setF( { ...FORCE0 } ); setS( { ...STYLE0 } ); setFn( { ...FONT0 } ) }

  fnRef.current.tick = tick; fnRef.current.clickNode = clickNode

  return (
    <div className="app" style={ { '--bg': theme.bg, '--panel': theme.panel, '--text': theme.text, '--mut': theme.mut, '--accent': theme.accent, '--border': theme.nodeBorder } }>
      <aside className="rail">
        <div className="brand"><div className="kicker">data engineering concepts with an eye for AI</div><div className="title">VOGON POETRY</div><div className="sub">{ META.node_count } nodes, { META.instinct_count } instincts, { META.edge_count } edges</div></div>
        <section><label className="lab">Theme</label><div className="seg">{ THEME_KEYS.map( ( k ) => <button key={ k } className={ themeKey === k ? 'on' : '' } onClick={ () => setThemeKey( k ) }>{ THEMES[ k ].name }</button> ) }</div></section>
        <section>
          <label className="lab">Layout suggestion</label>
          <div className="seg">{ LAYOUTS.map( ( k ) => <button key={ k } className={ layout === k ? 'on' : '' } onClick={ () => setLayout( k ) }>{ k }</button> ) }</div>
          <div className="seg" style={ { marginTop: 6 } }><button onClick={ reheat }>reheat</button><button onClick={ () => simRef.current.stop() }>freeze</button><button onClick={ unpin }>unpin</button><button onClick={ fit }>fit</button></div>
          <div className="hint">Drag pins a node for hand-tuning; unpin releases all. Switching layout resets selection and pins. hhgttg (root) shows in radial / breadth-first / tree / depth-first.</div>
        </section>
        <section>
          <label className="lab">Forces</label>
          <Range label="repulsion (charge)" value={ F.charge } min={ -2000 } max={ -10 } step={ 10 } onChange={ ( v ) => setFv( 'charge', v ) } />
          <Range label="link distance" value={ F.linkDist } min={ 10 } max={ 220 } step={ 2 } onChange={ ( v ) => setFv( 'linkDist', v ) } />
          <Range label="link strength" value={ F.linkStr } min={ 0 } max={ 1 } step={ 0.05 } onChange={ ( v ) => setFv( 'linkStr', v ) } />
          <Range label="gravity (center)" value={ F.gravity } min={ 0 } max={ 0.4 } step={ 0.01 } onChange={ ( v ) => setFv( 'gravity', v ) } />
          <Range label="collision radius" value={ F.collide } min={ 0 } max={ 40 } step={ 1 } onChange={ ( v ) => setFv( 'collide', v ) } />
          <Range label="velocity decay" value={ F.decay } min={ 0.1 } max={ 0.9 } step={ 0.05 } onChange={ ( v ) => setFv( 'decay', v ) } />
          <Range label="ring / level spread" value={ F.spread } min={ 50 } max={ 400 } step={ 10 } onChange={ ( v ) => setFv( 'spread', v ) } />
        </section>
        <section>
          <label className="lab">Nodes</label>
          <Range label="concept size" value={ S.rConcept } min={ 1 } max={ 16 } step={ 0.5 } onChange={ ( v ) => setSv( 'rConcept', v ) } />
          <Range label="hub size" value={ S.rHub } min={ 3 } max={ 22 } step={ 0.5 } onChange={ ( v ) => setSv( 'rHub', v ) } />
          <Range label="root size" value={ S.rRoot } min={ 4 } max={ 26 } step={ 0.5 } onChange={ ( v ) => setSv( 'rRoot', v ) } />
          <Range label="border" value={ S.border } min={ 0 } max={ 4 } step={ 0.5 } onChange={ ( v ) => setSv( 'border', v ) } />
          <Range label="opacity" value={ S.nodeOpacity } min={ 0.2 } max={ 1 } step={ 0.05 } onChange={ ( v ) => setSv( 'nodeOpacity', v ) } />
        </section>
        <section>
          <label className="lab">Connections</label>
          <Pick label="curve" value={ S.curve } options={ [ 'curved', 'straight' ] } onChange={ ( v ) => setSv( 'curve', v ) } />
          <Range label="curve amount" value={ S.curveAmt } min={ 0 } max={ 1 } step={ 0.05 } onChange={ ( v ) => setSv( 'curveAmt', v ) } />
          <Range label="opacity" value={ S.edgeOpacity } min={ 0.05 } max={ 1 } step={ 0.05 } onChange={ ( v ) => setSv( 'edgeOpacity', v ) } />
          <Range label="contains width" value={ S.wContains } min={ 0.2 } max={ 5 } step={ 0.1 } onChange={ ( v ) => setSv( 'wContains', v ) } />
          <Range label="related width" value={ S.wRelated } min={ 0.2 } max={ 5 } step={ 0.1 } onChange={ ( v ) => setSv( 'wRelated', v ) } />
          <Range label="cross-family width" value={ S.wCross } min={ 0.2 } max={ 5 } step={ 0.1 } onChange={ ( v ) => setSv( 'wCross', v ) } />
          <Range label="depends-on width" value={ S.wDepends } min={ 0.2 } max={ 5 } step={ 0.1 } onChange={ ( v ) => setSv( 'wDepends', v ) } />
          <Toggle label="arrowheads on depends-on" checked={ S.arrow } onChange={ ( v ) => setSv( 'arrow', v ) } />
          <Toggle label="cross-family dashed" checked={ S.crossDashed } onChange={ ( v ) => setSv( 'crossDashed', v ) } />
          <Toggle label="depends-on dashed" checked={ S.dependsDashed } onChange={ ( v ) => setSv( 'dependsDashed', v ) } />
        </section>
        <section>
          <label className="lab">Fonts</label>
          <Toggle label="show concept labels" checked={ Fn.showLabels } onChange={ ( v ) => setFnv( 'showLabels', v ) } />
          <Pick label="family" value={ Fn.family } options={ [ 'sans', 'serif', 'mono' ] } onChange={ ( v ) => setFnv( 'family', v ) } />
          <Pick label="weight" value={ Fn.weight } options={ [ 'normal', 'bold' ] } onChange={ ( v ) => setFnv( 'weight', v ) } />
          <Range label="label size" value={ Fn.size } min={ 4 } max={ 20 } step={ 0.5 } onChange={ ( v ) => setFnv( 'size', v ) } />
          <Toggle label="label halo" checked={ Fn.halo } onChange={ ( v ) => setFnv( 'halo', v ) } />
        </section>
        <section><label className="lab">Views</label><div className="seg"><button className={ mode === 'full' ? 'on' : '' } onClick={ () => preset( 'full' ) }>Full graph</button><button className={ mode === 'aizoom' ? 'on' : '' } onClick={ () => preset( 'aizoom' ) }>AI-for-data zoom</button></div></section>
        <section><label className="lab">Families</label><div className="fams">{ FAMILIES.map( ( f ) => <button key={ f.id } className={ 'chip' + ( families.has( f.id ) && mode === 'full' ? ' on' : '' ) } onClick={ () => toggleFamily( f.id ) } title={ f.name }><span className="sw" style={ { background: theme.familyColors[ f.id ] } } /> { f.id } { f.name }</button> ) }</div></section>
        <section><label className="lab">Edge types</label><div className="fams">{ EDGE_TYPES.map( ( t ) => <button key={ t } className={ 'chip' + ( edges.has( t ) ? ' on' : '' ) } onClick={ () => toggleEdge( t ) }>{ t }</button> ) }</div><Toggle label="show instinct hubs" checked={ showHubs } onChange={ setShowHubs } /></section>
        <section><label className="lab">Search</label><form onSubmit={ doSearch } className="searchrow"><input value={ query } onChange={ ( e ) => setQuery( e.target.value ) } placeholder="node name" /><button type="submit" className="seg">Find</button></form></section>
        <section>
          <label className="lab">Export</label>
          <div className="seg">{ [ 1, 2, 3, 4 ].map( ( s ) => <button key={ s } className={ scale === s ? 'on' : '' } onClick={ () => setScale( s ) }>{ s }x</button> ) }</div>
          <div className="seg" style={ { marginTop: 6 } }><button onClick={ exportPNG }>PNG</button><button onClick={ exportSVG }>SVG</button></div>
          <button onClick={ resetAll } style={ { marginTop: 8 } } className="seg">Reset styling</button>
        </section>
      </aside>

      <main className="stage">
        <svg ref={ svgRef } className="cy" style={ { background: theme.bg } } />
        <div className={ 'ipanel' + ( insCollapsed ? ' col' : '' ) }>
          <div className="ihead" onClick={ () => setInsCollapsed( !insCollapsed ) }><span>INSTINCTS</span><button>{ insCollapsed ? 'show' : 'hide' }</button></div>
          { !insCollapsed && (
            <>
              <div className="ibar"><button onClick={ seeAll }>see all</button><button onClick={ toggleCards } disabled={ !( selected && selected.kind === 'instinct' ) }>{ cardsOn ? 'hide cards' : 'toggle cards' }</button></div>
              <div className="ileg" onMouseLeave={ restoreHighlight }>{ EDGE_TYPES.map( ( t ) => <button key={ t } className={ 'lrow' + ( hiEdge === t ? ' on' : '' ) } onMouseEnter={ () => highlightEdgeType( t ) } onClick={ () => { const nx = hiEdge === t ? null : t; setHiEdge( nx ); nx ? highlightEdgeType( nx ) : clearFade() } }><span className="ln" style={ { background: edgeColor( t ) } } />{ t }</button> ) }</div>
              <div className="ilist" onMouseLeave={ restoreHighlight }>{ INSTINCTS.map( ( s ) => <button key={ s.id } className="irow" onMouseEnter={ () => highlightInstinct( s.id ) } onClick={ () => focusInstinct( s.id ) }><span className="sw" style={ { background: theme.familyColors[ s.family ] } } /><b>{ s.num }</b><span className="it">{ s.title }</span></button> ) }</div>
            </>
          ) }
        </div>
        { selected && (
          <div className="panel">
            <button className="close" onClick={ () => { setSelected( null ); clearFade() } }>close</button>
            { selected.kind === 'concept'
              ? <div><div className="ptag" style={ { background: theme.familyColors[ selected.family ] } }>{ selected.family } { famName[ selected.family ] } - Instinct { selected.instinct_num }</div><h2>{ selected.name }</h2><div className="field"><span>What</span><p>{ selected.what }</p></div><div className="field"><span>Analogy</span><p>{ selected.analogy }</p></div><div className="field"><span>Code ({ selected.code.lang })</span><pre>{ selected.code.text }</pre></div>{ selected.related.length ? <div className="field"><span>Related</span><div className="tags">{ selected.related.map( ( r, i ) => <em key={ i }>{ r }</em> ) }</div></div> : null }</div>
              : <div><div className="ptag" style={ { background: theme.familyColors[ selected.family ] } }>{ selected.label } hub - { famName[ selected.family ] }</div><h2>{ selected.title }</h2><p className="framing">{ selected.framing }</p></div> }
          </div>
        ) }
      </main>
    </div>
  )
}
