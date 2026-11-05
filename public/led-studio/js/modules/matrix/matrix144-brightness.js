/* V14.6 — Matrix levels inside the effects / timeline panel. Levels are stored as 0..1;
   controls show percent. All mirrors share one controller and history gesture.
   Appearance changes deliberately do not invalidate contour geometry. */
(function (root, factory) {
  'use strict';
  const mxTr=(vi,en)=>typeof window!=='undefined'&&typeof window.tr==='function'?window.tr(vi,en):vi;
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.Matrix144Brightness = api;
    if (root.STUDIO?.matrix143) api.install(root.STUDIO, { root });
  }
})(typeof window === 'undefined' ? null : window, function () {
  'use strict';
  const mxTr=(vi,en)=>typeof window!=='undefined'&&typeof window.tr==='function'?window.tr(vi,en):vi;
  const unit = (value, fallback = 1) => Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : fallback;
  const percent = value => String(Math.round(unit(value) * 1000) / 10);
  const inputLevel = value => {
    if (!Number.isFinite(value)) throw new TypeError(mxTr("Độ sáng cần là một số hữu hạn.","Brightness must be a finite number."));
    return unit(value);
  };
  const gestureHosts = new WeakMap();
  function bindGestureEnd(B, document, root) {
    let hosts = gestureHosts.get(B);
    if (!hosts) { hosts = new Set(); gestureHosts.set(B, hosts); }
    if (document && !hosts.has(document)) {
      document.addEventListener('pointerup', () => B.end(), true);
      document.addEventListener('pointercancel', () => B.end(), true);
      hosts.add(document);
    }
    if (root?.addEventListener && !hosts.has(root)) {
      root.addEventListener('blur', () => B.end()); hosts.add(root);
    }
  }
  function bindInput(input, kind, B, update) {
    const start = () => { if (!input.disabled) B.begin(kind, B.scope); };
    input.addEventListener('pointerdown', start);
    input.addEventListener('keydown', event => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.key === 'Tab') return;
      if (event.key === 'Enter' || event.key === 'Escape') { B.end(); update(); return; }
      start();
    });
    input.addEventListener('input', () => {
      if (!input.value.trim() || !Number.isFinite(+input.value)) { input.setAttribute('aria-invalid', 'true'); return; }
      input.removeAttribute('aria-invalid');
      const next = Math.max(0, Math.min(100, +input.value));
      if (+input.value !== next) input.value = String(next);
      const options = { gesture: true, source: input };
      if (kind === 'master') B.setMaster(next / 100, options); else B.setTarget(B.scope, next / 100, options);
    });
    input.addEventListener('keyup', event => { if (/^(Arrow|Page|Home$|End$)/.test(event.key)) B.end(); });
    const finish = () => { input.removeAttribute('aria-invalid'); B.end(); update(); };
    input.addEventListener('change', finish); input.addEventListener('blur', finish);
  }
  function fillTrack(input, level) { input.style?.setProperty('--mx145-fill', percent(level) + '%'); }

  function createController(X, host = {}) {
    X.masterBrightness = unit(X.masterBrightness);
    let scope = 'selected', edit = null, pendingPaint = false;
    const listeners = new Set();
    const notify = source => { for (const listener of listeners) listener(source); };
    const resolve = target => X.paths.filter(path => target === 'all' ||
      (target === 'selected' && path.id === X.selected) || target === 'path:' + path.id ||
      target === path.id || target === 'group:' + path.group);
    const pathsFor = target => edit?.kind === 'target' && edit.target === target ?
      X.paths.filter(path => edit.ids.includes(path.id)) : resolve(target);
    function status(target = scope) {
      const paths = pathsFor(target), levels = paths.map(path => unit(path.brightness));
      const min = levels.length ? Math.min(...levels) : 0, max = levels.length ? Math.max(...levels) : 0;
      return { target, count: paths.length, min, max, mixed: max - min > 1e-9,
        value: levels.length ? levels.reduce((sum, n) => sum + n, 0) / levels.length : 0 };
    }
    function end() {
      const changed = !!edit?.changed;
      edit = null;
      const repaint = pendingPaint;
      pendingPaint = false;
      if (repaint) host.paint?.();
      notify();
      return changed;
    }
    function begin(kind = 'master', target = scope) {
      if (kind !== 'master' && kind !== 'target') throw new TypeError(mxTr("Không tìm thấy điều khiển độ sáng.","Brightness control not found."));
      if (edit?.kind === kind && (kind === 'master' || edit.target === target)) return;
      if (edit) end();
      edit = { kind, target, ids: kind === 'target' ? resolve(target).map(path => path.id) : [],
        checkpointed: false, changed: false };
    }
    function beforeChange(kind, target, record) {
      const active = edit?.kind === kind && (kind === 'master' || edit.target === target) ? edit : null;
      if (record && !active?.checkpointed) {
        host.checkpoint?.();
        if (active) active.checkpointed = true;
      }
      if (active) active.changed = true;
    }
    function appearanceChanged(source) {
      X.revision = (Number.isFinite(X.revision) ? X.revision : 0) + 1;
      notify(source);
    }
    function setMaster(value, options = {}) {
      value = inputLevel(value);
      if (options.gesture) begin('master');
      if (unit(X.masterBrightness) === value) return false;
      beforeChange('master', null, options.record !== false);
      X.masterBrightness = value;
      appearanceChanged(options.source);
      return true;
    }
    function setTarget(target, value, options = {}) {
      value = inputLevel(value);
      if (options.gesture) begin('target', target);
      const paths = pathsFor(target).filter(path => unit(path.brightness) !== value);
      if (!paths.length) return false;
      beforeChange('target', target, options.record !== false);
      for (const path of paths) path.brightness = value;
      appearanceChanged(options.source);
      return true;
    }
    const controller = {
      get scope() { return scope; },
      get editing() { return !!edit; },
      begin, end, status, setMaster, setTarget,
      setScope(value) { end(); scope = String(value || 'selected'); notify(); return scope; },
      subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
      deferPaint() { if (!edit) return false; pendingPaint = true; return true; },
      onRestore() {
        edit = null; pendingPaint = false;
        X.masterBrightness = unit(X.masterBrightness);
        notify();
      },
      apply(cells) {
        const master = unit(X.masterBrightness);
        if (master !== 1) for (const cell of cells) cell.level = unit(cell.level, 0) * master;
        return cells;
      }
    };
    return controller;
  }

  function createView(X, B, document, root) {
    const node = document.createElement('div');
    node.id = 'mx144Brightness';
    node.className = 'mx144-brightness';
    node.setAttribute('role', 'region');
    node.setAttribute('aria-label', mxTr("Độ sáng LED Matrix","LED Matrix brightness"));
    const markupnode=()=>("<div class=\"mx144-brightness-title\"><strong>"+mxTr("Cân mức sáng của viền","Balance outline brightness")+"</strong><span>"+mxTr("0% = tắt","0% = off")+"</span></div>")
      + ("<div class=\"mx144-brightness-label\"><label for=\"mx144MasterRange\">"+mxTr("Tổng viền · Master","All outlines · Master")+"</label><output id=\"mx144MasterValue\" for=\"mx144MasterRange mx144MasterNumber\"></output></div>")
      + ("<div class=\"mx144-brightness-row\"><input id=\"mx144MasterRange\" type=\"range\" min=\"0\" max=\"100\" step=\"0.1\" aria-label=\""+mxTr("Độ sáng tổng Matrix, phần trăm","Master Matrix brightness, percent")+"\"><div class=\"mx144-percent\"><input id=\"mx144MasterNumber\" type=\"number\" min=\"0\" max=\"100\" step=\"0.1\" inputmode=\"decimal\" aria-label=\""+mxTr("Nhập độ sáng tổng Matrix, phần trăm","Enter master Matrix brightness, percent")+"\"><span aria-hidden=\"true\">%</span></div></div>")
      + ("<div class=\"mx144-brightness-scope\"><label for=\"mx144BrightnessTarget\">"+mxTr("Chỉnh viền / nhóm","Adjust outline / group")+"</label><select id=\"mx144BrightnessTarget\" aria-label=\""+mxTr("Đích chỉnh độ sáng","Brightness target")+"\"></select></div>")
      + ("<div class=\"mx144-brightness-row\"><input id=\"mx144TargetRange\" type=\"range\" min=\"0\" max=\"100\" step=\"0.1\" aria-label=\""+mxTr("Độ sáng viền hoặc nhóm, phần trăm","Outline or group brightness, percent")+"\"><div class=\"mx144-percent\"><input id=\"mx144TargetNumber\" type=\"number\" min=\"0\" max=\"100\" step=\"0.1\" inputmode=\"decimal\" aria-label=\""+mxTr("Nhập độ sáng viền hoặc nhóm, phần trăm","Enter outline or group brightness, percent")+"\"><span aria-hidden=\"true\">%</span></div></div>")
      + '<p id="mx144BrightnessStatus" class="mx144-brightness-status" role="status"></p>';
    node.innerHTML=markupnode();
    root?.addEventListener?.('ledstudio:locale',()=>{
      node.setAttribute('aria-label',mxTr('Độ sáng LED Matrix','LED Matrix brightness'));
      const template=document.createElement('template');template.innerHTML=markupnode();
      const copy=(live,fresh)=>{
        if(live.nodeType===3){live.nodeValue=fresh.nodeValue;return;}
        for(const key of ['aria-label','title','placeholder'])if(fresh.hasAttribute?.(key))live.setAttribute(key,fresh.getAttribute(key));
        for(let i=0;i<fresh.childNodes.length;i++)if(live.childNodes[i])copy(live.childNodes[i],fresh.childNodes[i]);
      };
      for(let i=0;i<template.content.childNodes.length;i++)if(node.childNodes[i])copy(node.childNodes[i],template.content.childNodes[i]);
      update();
    });
    const get = id => node.querySelector('#' + id);
    const masterRange = get('mx144MasterRange'), masterNumber = get('mx144MasterNumber'), masterValue = get('mx144MasterValue');
    const targetRange = get('mx144TargetRange'), targetNumber = get('mx144TargetNumber'), targetSelect = get('mx144BrightnessTarget'), output = get('mx144BrightnessStatus');
    let choiceKey = '';
    function choices() {
      const selected = X.paths.find(path => path.id === X.selected);
      return [['selected', selected ? mxTr("Viền đang chọn · ","Selected outline · ") + selected.name : mxTr("Viền đang chọn · chưa có","Selected outline · none")],
        ['all', mxTr("Tất cả viền","All outlines")], ...Array.from(new Set(X.paths.map(path => path.group))).map(group => ['group:' + group, mxTr("Nhóm · ","Group · ") + (group || mxTr("(chưa đặt tên)","(unnamed)"))])];
    }
    function value(input, next, source) { if (input !== source) input.value = next; }
    function update(source = null) {
      const entries = choices(), key = JSON.stringify(entries);
      if (!B.editing && key !== choiceKey) {
        const options = entries.map(([id, text]) => { const option = document.createElement('option'); option.value = id; option.textContent = text; return option; });
        targetSelect.replaceChildren(...options); choiceKey = key;
        if (!entries.some(([id]) => id === B.scope)) { B.setScope('selected'); return; }
      }
      targetSelect.value = B.scope;
      const master = percent(X.masterBrightness), state = B.status();
      value(masterRange, master, source); value(masterNumber, master, source); masterValue.textContent = master + '%';
      fillTrack(masterRange, X.masterBrightness);
      masterRange.setAttribute('aria-valuetext', master + mxTr(" phần trăm"," percent"));
      value(targetRange, percent(state.value), source);
      fillTrack(targetRange, state.value);
      value(targetNumber, state.count && !state.mixed ? percent(state.value) : '', source);
      targetNumber.placeholder = state.count ? percent(state.min) + '–' + percent(state.max) : '—';
      targetRange.disabled = targetNumber.disabled = state.count === 0;
      const levels = state.mixed ? percent(state.min) + '–' + percent(state.max) + '%' : percent(state.value) + '%';
      targetRange.setAttribute('aria-valuetext', state.count ? levels + (state.mixed ? mxTr(", các viền khác mức sáng",", outlines have different brightness levels") : '') : mxTr("Chưa có viền","No outlines"));
      output.textContent = !state.count ? mxTr("Chọn hoặc tạo viền để chỉnh độ sáng.","Select or create an outline to adjust brightness.") : state.count + mxTr(" viền · hiện "," outlines · current ") + levels +
        (state.mixed ? mxTr(" · kéo để đặt cùng mức."," · drag to set the same level.") : '') + (unit(X.masterBrightness) === 0 ? mxTr(" Tổng 0%: Matrix đang tắt."," Master 0%: Matrix is off.") : '');
      node.classList.toggle('is-blackout', unit(X.masterBrightness) === 0);
    }
    for (const [input, kind] of [[masterRange, 'master'], [masterNumber, 'master'], [targetRange, 'target'], [targetNumber, 'target']]) bindInput(input, kind, B, update);
    targetSelect.addEventListener('change', () => B.setScope(targetSelect.value));
    bindGestureEnd(B, document, root);
    B.subscribe(update);
    update();
    return { node, update, mount(panel) {
      if (!panel || B.editing) return;
      const content = panel.querySelector('.mx143-content');
      const show = X.isOpen && (X.tab === 'effects' || X.tab === 'cues');
      node.hidden = !show;
      if (!show || !content) { node.remove?.(); return; }
      if (node.parentNode !== content) content.appendChild(node);
      update();
    } };
  }

  function install(S, options = {}) {
    const X = S?.matrix143;
    if (!X || typeof X.evaluate !== 'function') return null;
    if (X.brightness144) return X.brightness144;
    const root = options.root || (typeof window === 'undefined' ? null : window);
    const B = createController(X, { checkpoint: options.checkpoint || (() => {
      if (typeof checkpoint === 'function') checkpoint(); else S.checkpoint?.();
    }), paint: () => X.paint?.() });
    X.brightness144 = B;
    const previousEvaluate = X.evaluate;
    X.evaluate = function (...args) { return B.apply(previousEvaluate.apply(X, args)); };
    const document = options.document || root?.document;
    if (document) {
      const view = createView(X, B, document, root);
      B.mount = panel => view.mount(panel);
      B.update = source => view.update(source);
      B.element = view.node;
      B.mount(document.getElementById('matrix143Panel'));
    } else { B.mount = () => {}; B.update = () => {}; }
    return B;
  }
  return { version: '14.6.0', createController, createView, install };
});
