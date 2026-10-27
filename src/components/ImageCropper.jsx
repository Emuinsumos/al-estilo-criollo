import { useEffect, useRef, useState } from 'react'

const OUT_W = 640
const OUT_H = 480

// Recorte 4:3: arrastrar para acomodar, deslizador para zoom. Exporta WebP liviano.
export default function ImageCropper({ file, onDone, onCancel }) {
  const frame = useRef(null)
  const [img, setImg] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [fw, setFw] = useState(320)
  const drag = useRef(null)

  useEffect(() => {
    const url = URL.createObjectURL(file)
    const im = new Image()
    im.onload = () => setImg(im)
    im.src = url
    return () => URL.revokeObjectURL(url)
  }, [file])

  useEffect(() => {
    if (frame.current) setFw(frame.current.clientWidth)
  }, [img])

  const fh = (fw * 3) / 4
  const base = img ? Math.max(fw / img.naturalWidth, fh / img.naturalHeight) : 1
  const scale = base * zoom
  const clamp = (x, y, s = scale) => {
    if (!img) return { x, y }
    const w = img.naturalWidth * s
    const h = img.naturalHeight * s
    return { x: Math.min(0, Math.max(fw - w, x)), y: Math.min(0, Math.max(fh - h, y)) }
  }

  // centrar al cargar
  useEffect(() => {
    if (!img) return
    const s = Math.max(fw / img.naturalWidth, fh / img.naturalHeight)
    setPos(clamp((fw - img.naturalWidth * s) / 2, (fh - img.naturalHeight * s) / 2, s))
    // eslint-disable-next-line
  }, [img, fw])

  const changeZoom = (z) => {
    // mantener el centro
    const cx = (fw / 2 - pos.x) / scale
    const cy = (fh / 2 - pos.y) / scale
    const s = base * z
    setZoom(z)
    setPos(clamp(fw / 2 - cx * s, fh / 2 - cy * s, s))
  }

  const down = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y }
  }
  const move = (e) => {
    if (!drag.current) return
    setPos(clamp(drag.current.ox + e.clientX - drag.current.sx, drag.current.oy + e.clientY - drag.current.sy))
  }
  const up = () => (drag.current = null)

  const confirm = () => {
    const c = document.createElement('canvas')
    c.width = OUT_W
    c.height = OUT_H
    const ctx = c.getContext('2d')
    ctx.fillStyle = '#120d0a'
    ctx.fillRect(0, 0, OUT_W, OUT_H)
    ctx.imageSmoothingQuality = 'high'
    const sx = -pos.x / scale
    const sy = -pos.y / scale
    ctx.drawImage(img, sx, sy, fw / scale, fh / scale, 0, 0, OUT_W, OUT_H)
    onDone(c.toDataURL('image/webp', 0.72))
  }

  return (
    <div className="overlay" style={{ zIndex: 110 }}>
      <div className="modal" style={{ padding: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-title)', marginBottom: 4 }}>Acomodar foto</h2>
        <p className="hint" style={{ marginBottom: 12 }}>Arrastrá la foto para encuadrarla y usá el zoom. Así se va a ver en la web.</p>
        <div className="crop-frame" ref={frame} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
          {img && (
            <img
              src={img.src}
              alt=""
              draggable={false}
              style={{ width: img.naturalWidth * scale, height: img.naturalHeight * scale, transform: `translate(${pos.x}px, ${pos.y}px)` }}
            />
          )}
          <div className="crop-grid" />
        </div>
        <div style={{ margin: '14px 0' }}>
          <label className="hint">Zoom</label>
          <input type="range" min="1" max="4" step="0.01" value={zoom} onChange={(e) => changeZoom(Number(e.target.value))} />
        </div>
        <div className="row">
          <button className="btn-ghost" onClick={onCancel}>Cancelar</button>
          <button className="btn-red" onClick={confirm} disabled={!img}>Usar esta foto</button>
        </div>
      </div>
    </div>
  )
}
