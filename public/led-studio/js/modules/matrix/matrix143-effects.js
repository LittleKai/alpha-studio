/* Creative LED Studio V14.6 — 35 deterministic LED strip / matrix effects.
 * No DOM, timer, frame accumulator or random source is used for evaluation.
 * count = cells per row; the returned array contains count * rows cells.
 * phase is measured in pattern cycles. tail/groupSize are measured in cells.
 * Most patterns complete one cycle in four beats at speed=1. Accumulate and
 * colorWipe fill once across duration/speed seconds and then hold their result.
 */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.Matrix143FX = api;
})(typeof window !== 'undefined' ? window : typeof globalThis !== 'undefined' ? globalThis : null, function () {
  'use strict';
  const TAU = Math.PI * 2;
  const limits = Object.freeze({ maxCount: 4096, maxRows: 64, maxCells: 65536 });
  const presets = Object.freeze([
    { id: 'steady', name: 'Sáng liên tục', description: 'Giữ toàn bộ điểm LED sáng theo màu và độ sáng đã chọn.' },
    { id: 'blink', name: 'Chớp đều', description: 'Bật và tắt đồng thời theo nhịp; tần số tối đa 3 Hz.' },
    { id: 'strobe', name: 'Strobe · tối đa 3 Hz', description: 'Chớp ngắn theo beat với giới hạn 3 lần mỗi giây.' },
    { id: 'pulse', name: 'Nhịp sáng mềm', description: 'Tăng và giảm sáng liên tục theo đường cong mềm.' },
    { id: 'chase', name: 'Chạy xuôi theo viền', description: 'Một dải LED chạy vòng theo thứ tự các điểm trên viền.' },
    { id: 'chaseReverse', name: 'Chạy ngược theo viền', description: 'Một dải LED chạy vòng ngược thứ tự các điểm trên viền.' },
    { id: 'pingPong', name: 'Chạy qua lại', description: 'Cụm LED chạy tới hai đầu rồi đổi hướng, không nhảy đầu.' },
    { id: 'comet', name: 'Sao chổi xuôi', description: 'Điểm sáng với đuôi giảm sáng chạy xuôi theo thứ tự điểm.' },
    { id: 'cometReverse', name: 'Sao chổi ngược', description: 'Điểm sáng với đuôi giảm sáng chạy ngược theo thứ tự điểm.' },
    { id: 'accumulate', name: 'Sáng dồn xuôi', description: 'Lấp đầy từng cụm theo chiều xuôi trong thời lượng cue, sau đó giữ sáng.' },
    { id: 'accumulateReverse', name: 'Sáng dồn ngược', description: 'Lấp đầy từng cụm theo chiều ngược trong thời lượng cue, sau đó giữ sáng.' },
    { id: 'centerOut', name: 'Từ tâm ra hai bên', description: 'Hai dải sáng đối xứng di chuyển từ tâm tới hai đầu.' },
    { id: 'centerIn', name: 'Từ hai bên vào tâm', description: 'Hai dải sáng đối xứng di chuyển từ hai đầu về tâm.' },
    { id: 'alternating', name: 'Cụm chẵn / lẻ', description: 'Luân phiên bật các cụm LED chẵn và lẻ.' },
    { id: 'theaterChase', name: 'Chase ba nhịp', description: 'Mỗi cụm thứ ba sáng và chuyển lần lượt qua ba vị trí.' },
    { id: 'twoColorChase', name: 'Chạy hai màu', description: 'Các dải màu chính và màu phụ chạy nối tiếp nhau.' },
    { id: 'rainbowCycle', name: 'Đổi màu cầu vồng', description: 'Toàn dải đổi màu liên tục; các hàng có lệch màu nhẹ.' },
    { id: 'rainbowChase', name: 'Cầu vồng chuyển động', description: 'Dải màu cầu vồng phân bố theo vị trí và chạy dọc LED.' },
    { id: 'sparkle', name: 'Lấp lánh ngẫu nhiên', description: 'Các cụm sáng ngắn theo seed cố định; tua lại cho cùng kết quả.' },
    { id: 'twinkle', name: 'Nhấp nhô ánh sao', description: 'Mỗi điểm LED lên xuống sáng mềm với pha riêng theo seed.' },
    { id: 'wave', name: 'Sóng sáng', description: 'Sóng độ sáng chạy dọc dải và lệch pha giữa các hàng.' },
    { id: 'colorWipe', name: 'Quét đổi màu', description: 'Màu chính thay dần màu phụ trong thời lượng cue rồi giữ lại.' },
    { id: 'scan', name: 'Quét cột ma trận', description: 'Một cột sáng mềm quét đồng bộ qua toàn bộ các hàng.' },
    { id: 'groupSequence', name: 'Sáng lần lượt theo cụm', description: 'Bật trọn từng cụm nối tiếp; độ lớn cụm quyết định số LED mỗi bước.' },
    { id: 'blackout', name: 'Tắt toàn bộ', description: 'Đặt độ sáng của toàn bộ điểm LED về 0.' },
    { id: 'dualComet', name: 'Hai sao chổi đối hướng', description: 'Hai sao chổi mang hai màu chạy ngược chiều; cụm chỉnh đầu sáng, đuôi chỉnh vệt mờ.' },
    { id: 'meteorRain', name: 'Mưa sao băng', description: 'Các vệt sáng rơi lệch nhịp theo seed; ma trận rơi qua các hàng, dải đơn chạy dọc viền.' },
    { id: 'fire', name: 'Lửa chuyển động', description: 'Mảng sáng hai màu dao động mềm theo seed, nóng ở hàng dưới và dịu dần lên trên.' },
    { id: 'waterRipple', name: 'Gợn sóng mặt nước', description: 'Nhiều vòng sóng hai màu lan từ tâm; cụm chỉnh bước sóng, đuôi chỉnh độ lan xa.' },
    { id: 'diagonalChase', name: 'Vệt sáng chéo', description: 'Các vệt có đuôi mềm chạy chéo qua các hàng; dải đơn hiển thị chuỗi vệt nối tiếp.' },
    { id: 'checkerboard', name: 'Bàn cờ đổi màu', description: 'Các ô LED xen kẽ giữa hai màu và đổi sáng mềm theo nhịp, lệch ô giữa các hàng.' },
    { id: 'zipper', name: 'Khóa kéo hai phía', description: 'Hai màu lấp đầy các răng LED xen kẽ từ hai đầu rồi mở ra; đuôi chỉnh độ mềm.' },
    { id: 'breathingGradient', name: 'Dải màu thở', description: 'Dải chuyển sắc hai màu trôi chậm trong nhịp sáng lên xuống; cụm chỉnh độ rộng dải màu.' },
    { id: 'bouncingBalls', name: 'Bóng sáng nảy', description: 'Các bóng sáng hai màu nảy theo quỹ đạo cong, lệch nhịp theo seed và không nhảy qua đầu viền.' },
    { id: 'confetti', name: 'Pháo giấy hai màu', description: 'Các cụm màu xuất hiện theo seed rồi mờ dần; cụm chỉnh kích thước, đuôi chỉnh thời gian lưu sáng.' }
  ].map(Object.freeze));
  const presetIds = new Set(presets.map(item => item.id));

  function finite(value, fallback) {
    const n = Number(value);
    return value !== null && value !== '' && Number.isFinite(n) ? n : fallback;
  }
  function clamp(value, lo, hi) { return Math.min(hi, Math.max(lo, value)); }
  function fract(value) { return value - Math.floor(value); }
  function mod(value, divisor) { return ((value % divisor) + divisor) % divisor; }
  function hex(value, fallback) {
    if (typeof value !== 'string') return fallback;
    const v = value.trim().toLowerCase();
    if (/^#[0-9a-f]{6}$/.test(v)) return v;
    if (/^#[0-9a-f]{3}$/.test(v)) return '#' + [...v.slice(1)].map(c => c + c).join('');
    return fallback;
  }
  function seedValue(value) {
    if (typeof value === 'string' && value.trim() && !Number.isFinite(Number(value))) {
      let seed = 2166136261;
      for (let i = 0; i < value.length; i++) seed = Math.imul(seed ^ value.charCodeAt(i), 16777619);
      return seed >>> 0;
    }
    return Math.trunc(finite(value, 143)) >>> 0;
  }
  function normalize(input = {}) {
    const o = input && typeof input === 'object' ? input : {};
    const count = Math.round(clamp(finite(o.count, 32), 1, limits.maxCount));
    const rows = Math.round(clamp(finite(o.rows, 1), 1, Math.min(limits.maxRows, Math.floor(limits.maxCells / count))));
    return {
      count, rows,
      time: clamp(finite(o.time, 0), 0, 36000),
      duration: clamp(finite(o.duration, 8), .001, 36000),
      bpm: clamp(finite(o.bpm, 120), 20, 300),
      preset: presetIds.has(o.preset) ? o.preset : 'steady',
      speed: clamp(finite(o.speed, 1), 0, 8),
      color: hex(o.color, '#42d9d0'),
      color2: hex(o.color2, '#ff4f8b'),
      brightness: clamp(finite(o.brightness, 1), 0, 1),
      tail: clamp(finite(o.tail, 6), 1, limits.maxCount),
      groupSize: Math.round(clamp(finite(o.groupSize, 1), 1, limits.maxCount)),
      phase: clamp(finite(o.phase, 0), -10000, 10000),
      reverse: o.reverse === true,
      seed: seedValue(o.seed)
    };
  }
  // Stable integer hash: equal inputs produce equal values in every replay.
  function hash(seed, index, tick, salt = 0) {
    let v = (seed ^ Math.imul(index + 1, 0x9e3779b1) ^ Math.imul(tick, 0x85ebca6b) ^ salt) | 0;
    v ^= v >>> 16; v = Math.imul(v, 0x7feb352d);
    v ^= v >>> 15; v = Math.imul(v, 0x846ca68b);
    return ((v ^ (v >>> 16)) >>> 0) / 4294967296;
  }
  function hueOf(color) {
    const [r, g, b] = [1, 3, 5].map(i => parseInt(color.slice(i, i + 2), 16) / 255);
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    if (d < 1e-9) return 0;
    return fract((max === r ? (g - b) / d : max === g ? (b - r) / d + 2 : (r - g) / d + 4) / 6);
  }
  function hueColor(hue) {
    const h = fract(hue) * 6;
    const x = 1 - Math.abs(h % 2 - 1);
    const channels = h < 1 ? [1, x, 0] : h < 2 ? [x, 1, 0] : h < 3 ? [0, 1, x] : h < 4 ? [0, x, 1] : h < 5 ? [x, 0, 1] : [1, 0, x];
    return '#' + channels.map(v => Math.round((.04 + .96 * v) * 255).toString(16).padStart(2, '0')).join('');
  }
  function rgb(color) { return [1, 3, 5].map(i => parseInt(color.slice(i, i + 2), 16)); }
  function blendColor(a, b, amount) {
    const t = clamp(amount, 0, 1);
    return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join('');
  }
  function smooth(value) { return value * value * (3 - 2 * value); }
  // Smooth value noise is evaluated at the requested time, never accumulated.
  function noise(seed, position, time, salt) {
    const x = Math.floor(position), t = Math.floor(time), u = smooth(fract(position)), v = smooth(fract(time));
    const a = hash(seed, x, t, salt), b = hash(seed, x + 1, t, salt);
    const c = hash(seed, x, t + 1, salt), d = hash(seed, x + 1, t + 1, salt);
    return (a + (b - a) * u) * (1 - v) + (c + (d - c) * u) * v;
  }
  function cometLevel(distance, core, tail) {
    const behind = Math.max(0, distance - (core - 1));
    return Math.pow(Math.max(0, 1 - behind / tail), 1.7);
  }

  function evaluate(input = {}) {
    const o = normalize(input);
    const { count, rows, preset, brightness } = o;
    // Stored controls remain independent of preview dimensions. Clamp only here.
    const groupSize = Math.min(count, o.groupSize), tail = Math.min(count, o.tail);
    const beatRate = o.bpm / 60 * o.speed;
    const cycleRate = beatRate / 4;
    const clock = o.time * cycleRate + o.phase;
    const progress = fract(clock);
    const fill = clamp(o.time / o.duration * o.speed + o.phase, 0, 1);
    const groups = Math.ceil(count / groupSize);
    const completedGroups = fill >= 1 ? groups : Math.floor(fill * groups + 1e-10);
    const reversedPreset = preset === 'chaseReverse' || preset === 'cometReverse' || preset === 'accumulateReverse';
    const reversed = o.reverse !== reversedPreset;
    const head = progress * count;
    const stepHead = Math.min(count - 1, Math.floor(head));
    const hueBase = hueOf(o.color);
    const primary = rgb(o.color), secondary = rgb(o.color2);
    const sparkleTick = Math.floor(o.time * Math.min(3, cycleRate * 6) + o.phase * 6);
    const result = new Array(count * rows);
    for (let row = 0; row < rows; row++) {
      const rowPhase = rows > 1 ? row / rows : 0;
      const sparkleAnchor = Math.floor(hash(o.seed, row, sparkleTick, 0x47f5b1) * groups);
      const balls = preset === 'bouncingBalls' ? Array.from({ length: Math.min(3, Math.max(1, Math.ceil(count / (groupSize * 2)))) }, (_, i) => {
        const t = fract(clock * (.75 + i * .18) + hash(o.seed, row * 3 + i, 0, 0x6d271b));
        return { position: 4 * t * (1 - t) * (count - 1), mix: i === 0 ? 0 : i === 1 ? 1 : .5 };
      }) : null;
      let confetti = null;
      if (preset === 'confetti') {
        confetti = new Map();
        const lifetime = clamp(tail / groupSize, 1, 8), tick = Math.floor(clock * 4), age = fract(clock * 4);
        for (let i = 0; i < Math.ceil(lifetime); i++) {
          const at = Math.floor(hash(o.seed, row, tick - i, 0x5137fa) * groups);
          const level = Math.pow(Math.max(0, 1 - (age + i) / lifetime), 2);
          if (level > (confetti.get(at)?.level || 0)) confetti.set(at, { level, color: hash(o.seed, row, tick - i, 0x18d7e9) < .5 ? o.color : o.color2 });
        }
      }
      for (let col = 0; col < count; col++) {
        const x = reversed ? count - 1 - col : col;
        const group = Math.floor(x / groupSize);
        const index = row * count + x;
        let color = o.color, level = 1;
        switch (preset) {
          case 'steady': break;
          case 'blink':
            level = fract(o.time * Math.min(3, cycleRate) + o.phase) < .5 ? 1 : 0;
            break;
          case 'strobe':
            level = fract(o.time * Math.min(3, beatRate) + o.phase) < .2 ? 1 : 0;
            break;
          case 'pulse':
            level = .08 + .92 * (.5 - .5 * Math.cos(TAU * clock));
            break;
          case 'chase':
          case 'chaseReverse':
            level = mod(x - stepHead, count) < groupSize ? 1 : 0;
            break;
          case 'pingPong': {
            const travel = (1 - Math.abs(progress * 2 - 1)) * Math.max(0, count - groupSize);
            const start = Math.round(travel);
            level = x >= start && x < start + groupSize ? 1 : 0;
            break;
          }
          case 'comet':
          case 'cometReverse': {
            const behind = mod(head - x, count);
            level = behind < tail ? Math.pow(1 - behind / tail, 1.7) : 0;
            break;
          }
          case 'accumulate':
          case 'accumulateReverse':
            level = group < completedGroups ? 1 : 0;
            break;
          case 'centerOut':
          case 'centerIn': {
            const center = (count - 1) / 2;
            const centerHead = (preset === 'centerOut' ? progress : 1 - progress) * center;
            level = Math.abs(Math.abs(x - center) - centerHead) <= groupSize / 2 ? 1 : 0;
            break;
          }
          case 'alternating':
            level = (group + Math.floor(clock * 2)) % 2 === 0 ? 1 : 0;
            break;
          case 'theaterChase':
            level = mod(group - Math.floor(clock * 3), 3) === 0 ? 1 : 0;
            break;
          case 'twoColorChase':
            color = Math.floor(mod(x - stepHead, groupSize * 2) / groupSize) === 0 ? o.color : o.color2;
            break;
          case 'rainbowCycle':
            color = hueColor(hueBase + clock + rowPhase / 3);
            break;
          case 'rainbowChase':
            color = hueColor(hueBase + x / count - clock + rowPhase / 3);
            break;
          case 'sparkle': {
            const random = hash(o.seed, row * groups + group, sparkleTick, 0x163c21);
            level = group === sparkleAnchor || random < .12 ? 1 : 0;
            color = hash(o.seed, index, sparkleTick, 0x4a5b6c) < .5 ? o.color : o.color2;
            break;
          }
          case 'twinkle': {
            const offset = hash(o.seed, index, 0, 0x671f25);
            const frequency = .65 + hash(o.seed, index, 0, 0x215a4d) * .7;
            level = .02 + .98 * Math.pow(.5 + .5 * Math.sin(TAU * (clock * frequency + offset)), 3);
            color = hash(o.seed, index, 0, 0x1367ab) < .3 ? o.color2 : o.color;
            break;
          }
          case 'wave':
            level = .08 + .92 * (.5 + .5 * Math.sin(TAU * (clock - x / Math.max(2, groupSize * 4) - rowPhase / 2)));
            break;
          case 'colorWipe':
            color = group < completedGroups ? o.color : o.color2;
            break;
          case 'scan': {
            const column = progress * Math.max(0, count - 1);
            level = Math.max(0, 1 - Math.abs(x - column) / Math.max(1, groupSize));
            break;
          }
          case 'groupSequence':
            level = group === Math.min(groups - 1, Math.floor(progress * groups)) ? 1 : 0;
            break;
          case 'blackout': level = 0; break;
          case 'dualComet': {
            const a = cometLevel(mod(head - x, count), groupSize, tail);
            const b = cometLevel(mod(x - (count / 2 - head), count), groupSize, tail);
            level = Math.max(a, b);
            color = blendColor(primary, secondary, a + b ? b / (a + b) : 0);
            break;
          }
          case 'meteorRain': {
            const segment = Math.min(count, Math.max(4, groupSize + tail * 2));
            const lane = rows > 1 ? group : Math.floor(x / segment);
            const span = rows > 1 ? rows : Math.min(segment, count - lane * segment);
            const position = rows > 1 ? row : x - lane * segment;
            const trail = Math.min(tail, Math.max(1, span * .65));
            const rate = .7 + hash(o.seed, lane, 0, 0x45ae19) * .6;
            const offset = hash(o.seed, lane, 0, 0x719c35);
            const behind = fract(clock * rate + offset) * (span + trail) - position;
            level = behind >= 0 && behind < trail ? Math.pow(1 - behind / trail, 1.5) : 0;
            color = blendColor(primary, secondary, hash(o.seed, lane, 0, 0x2ce783));
            break;
          }
          case 'fire': {
            const height = rows > 1 ? (rows - 1 - row) / (rows - 1) : .25;
            const field = noise(o.seed, x / Math.max(1, groupSize + tail * .35), clock * 3 - height * 1.6, 0x2b53d9);
            const heat = clamp(.15 + field * 1.3 - height * .7, 0, 1);
            level = Math.pow(heat, 1.4);
            color = blendColor(secondary, primary, Math.pow(heat, .7));
            break;
          }
          case 'waterRipple': {
            const radius = Math.hypot(x - (count - 1) / 2, (row - (rows - 1) / 2) * Math.max(1, count / Math.max(1, rows) * .5));
            const ring = .5 + .5 * Math.cos(TAU * (radius / Math.max(2, groupSize * 4) - clock * 2));
            const envelope = 1 / (1 + radius / (tail * 2));
            level = (.05 + .95 * ring * ring) * (.35 + .65 * envelope);
            color = blendColor(secondary, primary, ring);
            break;
          }
          case 'diagonalChase': {
            const period = Math.max(1, Math.min(count, groupSize * 2 + tail));
            const stripe = mod(x - clock * period - row * groupSize, period);
            level = stripe < groupSize ? 1 : .45 * Math.pow(Math.max(0, 1 - (stripe - groupSize) / tail), 2);
            color = blendColor(primary, secondary, Math.min(1, stripe / Math.max(1, groupSize + tail)));
            break;
          }
          case 'checkerboard': {
            const parity = (group + row) % 2, exchange = .5 - .5 * Math.cos(TAU * clock);
            const mix = parity ? 1 - exchange : exchange;
            color = blendColor(primary, secondary, mix);
            level = .3 + .7 * (parity ? exchange : 1 - exchange);
            break;
          }
          case 'zipper': {
            const closing = 1 - Math.abs(progress * 2 - 1), fromStart = group % 2 === 0;
            const distance = fromStart ? group : groups - 1 - group, feather = Math.max(1, tail / groupSize);
            level = clamp((closing * (groups + feather) - distance) / feather, 0, 1);
            color = fromStart ? o.color : o.color2;
            break;
          }
          case 'breathingGradient': {
            const repeats = Math.max(1, count / Math.max(2, groupSize * 8));
            const gradient = .5 + .5 * Math.cos(TAU * (x / Math.max(1, count - 1) * repeats + rowPhase * .35 - clock * .25));
            const breath = .12 + .88 * (.5 - .5 * Math.cos(TAU * clock));
            level = breath * (.4 + .6 * gradient);
            color = blendColor(primary, secondary, gradient);
            break;
          }
          case 'bouncingBalls': {
            let total = 0, mixed = 0;level = 0;
            for (const ball of balls) {
              const distance = Math.abs(x - ball.position), core = Math.max(.5, groupSize / 2);
              const value = Math.pow(Math.max(0, 1 - Math.max(0, distance - core) / Math.max(1, tail / 2)), 2);
              level = Math.max(level, value);total += value;mixed += value * ball.mix;
            }
            color = blendColor(primary, secondary, total ? mixed / total : 0);
            break;
          }
          case 'confetti': {
            const particle = confetti.get(group);
            level = particle?.level || 0;color = particle?.color || o.color;
            break;
          }
        }
        result[row * count + col] = { color, level: clamp(level * brightness, 0, 1) };
      }
    }
    return result;
  }
  return Object.freeze({ version: '14.6.0', presets, limits, normalize, evaluate });
});
