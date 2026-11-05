/* V15.1 — direct strip thickness and clear LED appearance.
   Styling never edits the traced contour, source binding, or timeline levels. */
(function (root, factory) {
  'use strict';
  const mxTr=(vi,en)=>typeof window!=='undefined'&&typeof window.tr==='function'?window.tr(vi,en):vi;
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.Matrix151Controls = api;
    if (root.STUDIO?.matrix143) api.install(root.STUDIO, { root });
  }
})(typeof window === 'undefined' ? null : window, function () {
  'use strict';
  const mxTr=(vi,en)=>typeof window!=='undefined'&&typeof window.tr==='function'?window.tr(vi,en):vi;
  const PROFILE = Object.freeze({ width: .06, pitch: .09, diffuser: false, glow: true });
  const mm = value => Math.round(value * 100000) / 100;
  const allowedScope = value => value === 'all' ? 'all' : 'selected';

  function createController(X, host = {}) {
    let scope = 'selected', edit = null, pendingPaint = false;
    const listeners = new Set();
    const notify = source => { for (const listener of listeners) listener(source); };
    const resolve = target => X.paths.filter(p => target === 'all' || p.id === X.selected);
    const editingPaths = () => edit ? X.paths.filter(p => edit.ids.includes(p.id)) : [];
    function status(target = scope) {
      target = allowedScope(target);
      const paths = edit && edit.scope === target ? editingPaths() : resolve(target);
      const widths = paths.map(p => p.width), min = widths.length ? Math.min(...widths) : 0;
      const max = widths.length ? Math.max(...widths) : 0;
      return { scope: target, count: paths.length, min: mm(min), max: mm(max),
        value: mm(widths.length ? widths.reduce((a,b) => a+b,0) / widths.length : .06),
        mixed: max-min > 1e-9, pixels: !!paths.length && paths.every(p => !p.diffuser),
        ribbon: !!paths.length && paths.every(p => p.diffuser),
        name: paths.length === 1 ? paths[0].name : paths.length + mxTr(' viền', ' outlines') };
    }
    function end() {
      const changed = !!edit?.changed, repaint = pendingPaint;
      edit = null; pendingPaint = false;
      if (changed || repaint) host.paint?.();
      notify(); return changed;
    }
    function begin(target = scope) {
      target = allowedScope(target);
      if (edit?.scope === target) return true;
      if (edit) end();
      const paths = resolve(target); if (!paths.length) return false;
      edit = { scope: target, ids: paths.map(p => p.id), changed: false, checkpointed: false };
      return true;
    }
    function changed(paths, changes, source, gesture) {
      const affected = paths.filter(p => Object.keys(changes).some(key => p[key] !== changes[key]));
      if (!affected.length) return false;
      if (!gesture || !edit?.checkpointed) {
        host.checkpoint?.(); if (gesture && edit) edit.checkpointed = true;
      }
      for (const p of affected) Object.assign(p, changes);
      X.revision = (X.revision || 0) + 1;
      X.geometryRevision = (X.geometryRevision || 0) + 1;
      if (gesture && edit) { edit.changed = true; pendingPaint = true; }
      else host.paint?.();
      notify(source); return true;
    }
    function setWidth(value, options = {}) {
      if (!Number.isFinite(value)) throw new TypeError(mxTr("Độ dày cần là một số hữu hạn.","Thickness must be a finite number."));
      const width = Math.min(500, Math.max(1, value)) / 1000;
      const target = allowedScope(options.scope ?? scope), gesture = !!options.gesture;
      if (gesture) {
        if (!edit && !begin(target)) return false;
        return changed(editingPaths(), { width }, options.source, true);
      }
      if (edit) end();
      return changed(resolve(target), { width }, options.source, false);
    }
    function applyProfile(target = scope) {
      end(); return changed(resolve(allowedScope(target)), PROFILE, null, false);
    }
    function setStyle(style, target = scope) {
      if (style !== 'pixels' && style !== 'ribbon') throw new TypeError(mxTr("Chọn Hạt LED hoặc Dải liền.","Choose LED pixels or Ribbon."));
      end(); return changed(resolve(allowedScope(target)), { diffuser: style === 'ribbon' }, null, false);
    }
    return { begin, end, setWidth, applyProfile, setStyle, status,
      get scope() { return scope; }, get editing() { return !!edit; },
      setScope(target) { end(); scope = allowedScope(target); notify(); return scope; },
      subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
      deferPaint() { if (!edit) return false; pendingPaint = true; return true; },
      onRestore() { edit = null; pendingPaint = false; notify(); } };
  }

  function install(S, options = {}) {
    const X = S?.matrix143; if (!X) return null;
    if (X.appearance151) return X.appearance151;
    const root = options.root || (typeof window === 'undefined' ? null : window);
    const document = options.document || root?.document;
    const C = createController(X, {
      checkpoint: options.checkpoint || (() => { if (typeof checkpoint === 'function') checkpoint(); else S.checkpoint?.(); }),
      paint: () => X.paint?.()
    });
    X.appearance151 = C; if (!document) return C;
    const view = document.createElement('section');
    view.id = 'mx151Appearance'; view.className = 'mx151-appearance';
    view.setAttribute('aria-label', mxTr("Độ dày và kiểu LED Matrix","LED Matrix thickness and style"));
    const markupview=()=>("<div class=\"mx151-heading\"><strong>"+mxTr("Độ dày LED","LED thickness")+"</strong><output id=\"mx151WidthValue\" for=\"mx151WidthRange mx151WidthNumber\"></output></div>")
      + ("<label class=\"mx151-scope\" for=\"mx151WidthScope\">"+mxTr("Chỉnh cho","Adjust for")+"<select id=\"mx151WidthScope\"><option value=\"selected\">"+mxTr("Viền đang chọn","Selected outline")+"</option><option value=\"all\">"+mxTr("Tất cả viền","All outlines")+"</option></select></label>")
      + ("<div class=\"mx151-width-row\"><input id=\"mx151WidthRange\" type=\"range\" min=\"1\" max=\"500\" step=\"1\" aria-label=\""+mxTr("Kéo độ dày LED Matrix, milimét","Adjust LED Matrix thickness, millimeters")+"\">")
      + ("<input id=\"mx151WidthNumber\" type=\"number\" min=\"1\" max=\"500\" step=\"1\" inputmode=\"decimal\" aria-label=\""+mxTr("Nhập độ dày LED Matrix, milimét","Enter LED Matrix thickness, millimeters")+"\"><span>mm</span></div>")
      + ("<div class=\"mx143-grid\"><button id=\"mx151Pixels\" type=\"button\">"+mxTr("Hạt LED","LED pixels")+"</button><button id=\"mx151Ribbon\" type=\"button\">"+mxTr("Dải liền","Ribbon")+"</button></div>")
      + ("<button id=\"mx151ClearProfile\" type=\"button\" title=\""+mxTr("Rộng 60 mm, bước hạt 90 mm, bật quầng sáng. Áp dụng cho phạm vi đang chọn.","60 mm width, 90 mm pixel pitch, glow enabled. Applies to the selected scope.")+"\">"+mxTr("LED rõ · 60 mm","Clear LEDs · 60 mm")+"</button>")
      + '<p id="mx151WidthStatus" role="status"></p>'
      + ("<small>"+mxTr("Độ sáng chỉnh tại Hiệu ứng / Timeline.","Adjust brightness in Effects / Timeline.")+"</small>");
    view.innerHTML=markupview();
    root?.addEventListener?.('ledstudio:locale',()=>{
      view.setAttribute('aria-label',mxTr('Độ dày và kiểu LED Matrix','LED Matrix thickness and style'));
      const template=document.createElement('template');template.innerHTML=markupview();
      const copy=(live,fresh)=>{
        if(live.nodeType===3){live.nodeValue=fresh.nodeValue;return;}
        for(const key of ['aria-label','title','placeholder'])if(fresh.hasAttribute?.(key))live.setAttribute(key,fresh.getAttribute(key));
        for(let i=0;i<fresh.childNodes.length;i++)if(live.childNodes[i])copy(live.childNodes[i],fresh.childNodes[i]);
      };
      for(let i=0;i<template.content.childNodes.length;i++)if(view.childNodes[i])copy(view.childNodes[i],template.content.childNodes[i]);
      update();
    });
    const get = id => view.querySelector('#' + id);
    const range = get('mx151WidthRange'), number = get('mx151WidthNumber'), output = get('mx151WidthValue');
    const scope = get('mx151WidthScope'), pixels = get('mx151Pixels'), ribbon = get('mx151Ribbon'), profile = get('mx151ClearProfile');
    function update(source = null) {
      const s = C.status(), value = s.value;
      if (source !== range) range.value = String(value);
      if (source !== number) number.value = String(value);
      for (const node of [range, number, pixels, ribbon, profile]) node.disabled = !s.count;
      scope.value = C.scope;
      range.style.setProperty('--mx151-fill', ((value-1)/499*100) + '%');
      range.setAttribute('aria-valuetext', s.mixed ? s.min + mxTr(" đến "," to ") + s.max + mxTr(" milimét; kéo để chỉnh đồng loạt"," millimeters; drag to adjust all") : value + mxTr(" milimét"," millimeters"));
      output.textContent = !s.count ? '—' : s.mixed ? s.min + '–' + s.max + ' mm' : value + ' mm';
      pixels.setAttribute('aria-pressed', String(s.pixels)); ribbon.setAttribute('aria-pressed', String(s.ribbon));
      pixels.classList.toggle('active', s.pixels); ribbon.classList.toggle('active', s.ribbon);
      get('mx151WidthStatus').textContent = !s.count ? mxTr("Chọn một viền đã tạo để chỉnh.","Select a created outline to edit.") : s.mixed ? s.count + mxTr(" viền khác độ dày · kéo để đặt chung."," outlines have different widths · drag to set all.") : s.name + ' · ' + (s.pixels ? mxTr("Hiện từng hạt LED","Individual LED pixels") : s.ribbon ? mxTr("Dải sáng liền","Continuous light ribbon") : mxTr("Nhiều kiểu LED","Mixed LED styles"));
    }
    function bind(input) {
      const begin = () => { if (!input.disabled) C.begin(); };
      const finish = () => { input.removeAttribute('aria-invalid'); C.end(); update(); };
      input.addEventListener('pointerdown', begin);
      input.addEventListener('keydown', event => {
        if (event.ctrlKey || event.metaKey || event.altKey || event.key === 'Tab') return;
        if (event.key === 'Enter' || event.key === 'Escape') { finish(); return; }
        begin();
      });
      input.addEventListener('input', () => {
        if (!input.value.trim() || !Number.isFinite(+input.value)) { input.setAttribute('aria-invalid', 'true'); return; }
        input.removeAttribute('aria-invalid');
        const value = Math.min(500, Math.max(1, +input.value));
        if (+input.value !== value) input.value = String(value);
        C.setWidth(value, { gesture: true, source: input });
      });
      input.addEventListener('change', finish); input.addEventListener('blur', finish);
      input.addEventListener('keyup', event => { if (/^(Arrow|Page|Home$|End$)/.test(event.key)) finish(); });
    }
    bind(range); bind(number);
    scope.addEventListener('change', () => C.setScope(scope.value));
    pixels.addEventListener('click', () => C.setStyle('pixels'));
    ribbon.addEventListener('click', () => C.setStyle('ribbon'));
    profile.addEventListener('click', () => C.applyProfile());
    for (const type of ['pointerdown', 'wheel', 'dblclick']) view.addEventListener(type, event => event.stopPropagation());
    for (const type of ['keydown', 'keyup']) view.addEventListener(type, event => { if (!event.ctrlKey && !event.metaKey && !event.altKey) event.stopPropagation(); });
    document.addEventListener('pointerup', () => C.end(), true);
    document.addEventListener('pointercancel', () => C.end(), true);
    root?.addEventListener?.('blur', () => C.end());
    C.subscribe(update);
    C.mount = panel => {
      if (C.editing) return;
      const host = panel?.querySelector('#mx151AppearanceHost');
      if (host && view.parentNode !== host) host.appendChild(view);
      else if (!host) view.remove();
      update();
    };
    C.update = update; C.element = view;
    C.mount(document.getElementById('matrix143Panel')); return C;
  }
  return { version: '15.1.0', profile: PROFILE, createController, install };
});
