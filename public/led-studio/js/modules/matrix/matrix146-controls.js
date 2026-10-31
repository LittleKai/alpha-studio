/* V14.6 — per-effect and per-cue brightness. A drag records one undo step;
   controls never remount while a pointer/keyboard gesture is active. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.Matrix146Controls = api;
    if (root.STUDIO?.matrix143) api.install(root.STUDIO, { root });
  }
})(typeof window === 'undefined' ? null : window, function () {
  'use strict';
  const unit = n => Math.min(1, Math.max(0, n));
  const percent = n => String(Math.round(unit(n) * 1000) / 10);

  function createController(X, host = {}) {
    let edit = null, pendingPaint = false;
    const listeners = new Set();
    const notify = source => { for (const listener of listeners) listener(source); };
    function end() {
      const changed = !!edit?.changed, repaint = pendingPaint;
      edit = null; pendingPaint = false;
      if (changed || repaint) host.paint?.();
      if (changed) host.renderTimeline?.();
      notify();
      return changed;
    }
    function begin(kind, id = null) {
      if (kind !== 'effect' && kind !== 'cue') throw new TypeError('Loại độ sáng không hợp lệ.');
      if (kind === 'cue' && !X.getCue(id)) return false;
      if (edit?.kind === kind && edit.id === id) return true;
      if (edit) end();
      edit = { kind, id, changed: false, checkpointed: false };
      return true;
    }
    function set(kind, value, id = null, source = null) {
      if (!Number.isFinite(value)) throw new TypeError('Độ sáng cần là một số hữu hạn.');
      value = unit(value);
      // A selected cue can change elsewhere during a gesture. Its target stays
      // the cue captured at pointerdown, never the newly selected neighbour.
      if (edit?.kind === kind) id = edit.id;
      const cue = kind === 'cue' ? X.getCue(id) : null;
      if (kind === 'cue' && !cue) return false;
      const before = kind === 'cue' ? X.cueSpec(cue).brightness : X.effect.brightness;
      if (before === value) return false;
      if (!begin(kind, id)) return false;
      if (!edit.checkpointed) { host.checkpoint?.(); edit.checkpointed = true; }
      const changed = kind === 'cue' ? X.updateCueBrightness(id, value, false) : X.updateEffectBrightness(value, false);
      if (changed) edit.changed = true;
      notify(source);
      return changed;
    }
    return {
      begin, end, set,
      get editing() { return !!edit; },
      get cueId() { return edit?.kind === 'cue' ? edit.id : null; },
      subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
      deferPaint() { if (!edit) return false; pendingPaint = true; return true; },
      onRestore() { edit = null; pendingPaint = false; notify(); }
    };
  }

  function levelMarkup(prefix, label) {
    return '<label for="' + prefix + 'Range">' + label + ' <output id="' + prefix + 'Value"></output></label>'
      + '<div class="mx146-level-row"><input id="' + prefix + 'Range" type="range" min="0" max="100" step="0.1" aria-label="' + label + ', phần trăm">'
      + '<input id="' + prefix + 'Number" type="number" min="0" max="100" step="0.1" inputmode="decimal" aria-label="Nhập ' + label.toLowerCase() + ', phần trăm"><span>%</span></div>';
  }

  function install(S, options = {}) {
    const X = S?.matrix143;
    if (!X || !X.updateCueBrightness || !X.updateEffectBrightness) return null;
    if (X.controls146) return X.controls146;
    const root = options.root || (typeof window === 'undefined' ? null : window);
    const document = options.document || root?.document;
    const C = createController(X, {
      checkpoint: options.checkpoint || (() => { if (typeof checkpoint === 'function') checkpoint(); else S.checkpoint?.(); }),
      paint: () => X.paint?.(), renderTimeline: () => S.renderSequence?.()
    });
    X.controls146 = C;
    if (!document) return C;
    const effect = document.createElement('div');
    effect.id = 'mx146EffectBrightness'; effect.className = 'mx146-level';
    effect.innerHTML = levelMarkup('mx146FxBrightness', 'Độ sáng hiệu ứng / cue mới')
      + '<small>Mức sáng dùng khi xem thử và được lưu riêng vào cue mới.</small>';
    const timeline = document.createElement('div');
    timeline.id = 'mx146TimelineBrightness'; timeline.className = 'mx146-timeline-level';
    timeline.setAttribute('role', 'region'); timeline.setAttribute('aria-label', 'Độ sáng cue LED Matrix trong timeline');
    timeline.innerHTML = '<div class="mx146-timeline-label"><strong>LED MATRIX</strong><span id="mx146TimelineCueName"></span></div>'
      + '<div class="mx146-level">' + levelMarkup('mx146TimelineBrightness', 'Độ sáng cue') + '</div>'
      + '<button id="mx146TimelineEdit" type="button" class="btn">Chỉnh cue</button>'
      + '<button id="mx146TimelineEffects" type="button" class="btn">35 hiệu ứng</button>';
    const get = (node, id) => node.querySelector('#' + id);
    const fxRange = get(effect, 'mx146FxBrightnessRange'), fxNumber = get(effect, 'mx146FxBrightnessNumber');
    const cueRange = get(timeline, 'mx146TimelineBrightnessRange'), cueNumber = get(timeline, 'mx146TimelineBrightnessNumber');
    const cueName = get(timeline, 'mx146TimelineCueName'), editButton = get(timeline, 'mx146TimelineEdit');
    const selectedCue = () => C.cueId ? X.getCue(C.cueId) : X.getCue();
    function updatePair(node, prefix, level, source, disabled = false) {
      const text = percent(level), range = get(node, prefix + 'Range'), number = get(node, prefix + 'Number');
      if (source !== range) range.value = text;
      if (source !== number) number.value = text;
      range.disabled = number.disabled = disabled;
      range.style.setProperty('--mx146-fill', text + '%');
      range.setAttribute('aria-valuetext', disabled ? 'Chọn cue LED Matrix' : text + ' phần trăm');
      get(node, prefix + 'Value').textContent = disabled ? '—' : text + '%';
    }
    function update(source = null) {
      updatePair(effect, 'mx146FxBrightness', X.effect.brightness, source);
      const cue = selectedCue();
      updatePair(timeline, 'mx146TimelineBrightness', cue ? X.cueSpec(cue).brightness : 0, source, !cue);
      cueName.textContent = cue ? cue.name : 'Chọn một cue Matrix trên timeline';
      cueName.title = cueName.textContent; editButton.disabled = !cue;
      timeline.hidden = !X.paths.length && !cue;
    }
    function bind(input, kind) {
      const id = () => kind === 'cue' ? selectedCue()?.id : null;
      const begin = () => { if (!input.disabled) C.begin(kind, id()); };
      input.addEventListener('pointerdown', begin);
      input.addEventListener('keydown', event => {
        if (event.ctrlKey || event.metaKey || event.altKey || event.key === 'Tab') return;
        if (event.key === 'Enter' || event.key === 'Escape') { C.end(); update(); return; }
        begin();
      });
      input.addEventListener('input', () => {
        if (!input.value.trim() || !Number.isFinite(+input.value)) { input.setAttribute('aria-invalid', 'true'); return; }
        input.removeAttribute('aria-invalid');
        const next = Math.max(0, Math.min(100, +input.value));
        if (+input.value !== next) input.value = String(next);
        C.set(kind, next / 100, id(), input);
      });
      const finish = () => { input.removeAttribute('aria-invalid'); C.end(); update(); };
      input.addEventListener('change', finish); input.addEventListener('blur', finish);
      input.addEventListener('keyup', event => { if (/^(Arrow|Page|Home$|End$)/.test(event.key)) finish(); });
    }
    bind(fxRange, 'effect'); bind(fxNumber, 'effect'); bind(cueRange, 'cue'); bind(cueNumber, 'cue');
    document.addEventListener('pointerup', () => C.end(), true);
    document.addEventListener('pointercancel', () => C.end(), true);
    root?.addEventListener?.('blur', () => C.end());
    for (const node of [effect, timeline]) {
      for (const type of ['pointerdown','wheel','dblclick']) node.addEventListener(type, event => event.stopPropagation());
      for (const type of ['keydown','keyup']) node.addEventListener(type, event => {
        if (!event.ctrlKey && !event.metaKey && !event.altKey) event.stopPropagation();
      });
    }
    editButton.addEventListener('click', () => { const cue = selectedCue(); if (cue) X.editCue(cue.id); });
    get(timeline, 'mx146TimelineEffects').textContent = X.effects.presets.length + ' hiệu ứng';
    get(timeline, 'mx146TimelineEffects').addEventListener('click', () => X.open('effects'));
    C.subscribe(update);
    C.mount = panel => {
      if (C.editing) return;
      const host = panel?.querySelector('#mx146EffectBrightnessHost');
      if (host && effect.parentNode !== host) host.appendChild(effect);
      else if (!host) effect.remove();
      update();
    };
    C.mountTimeline = () => {
      const dock = document.getElementById('sequenceDock');
      if (!dock) return;
      if (timeline.parentNode !== dock) dock.insertBefore(timeline, dock.querySelector('.seq-footer'));
      update();
    };
    // Modal editing is a draft until Save cue. Moving its range is not a
    // project mutation and Cancel must leave the original brightness intact.
    C.bindDialog = () => {
      const range = document.getElementById('mxCueBrightnessRange'), number = document.getElementById('mxCueBrightness'), output = document.getElementById('mxCueBrightnessValue');
      if (!range || !number || !output) return;
      const sync = source => {
        if (!source.value.trim() || !Number.isFinite(+source.value)) return;
        const value = Math.max(0, Math.min(100, +source.value));
        if (source !== range) range.value = String(value);
        if (source !== number) number.value = String(value);
        output.textContent = String(Math.round(value * 10) / 10) + '%';
        range.style.setProperty('--mx146-fill', value + '%');
      };
      range.addEventListener('input', () => sync(range)); number.addEventListener('input', () => sync(number));
      sync(number);
    };
    C.update = update;
    C.effectElement = effect; C.timelineElement = timeline;
    C.mount(document.getElementById('matrix143Panel')); C.mountTimeline();
    return C;
  }
  return { version: '14.6.0', createController, install };
});
