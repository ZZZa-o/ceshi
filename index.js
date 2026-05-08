import { extension_settings } from '../../../extensions.js';
import { saveSettingsDebounced } from '../../../../script.js';
import { P } from './rules.gen.js';

const MODULE = '__awf_v2__';
(function migrate() {
  const OLD = 'auto-wrap-fix';
  if (extension_settings[OLD] && !extension_settings[MODULE]) {
    extension_settings[MODULE] = extension_settings[OLD];
    delete extension_settings[OLD];
    try { saveSettingsDebounced(); } catch (e) {}
  }
})();

const _abc = 'abcdefghijklmnopqrstuvwxyz';
const _abn = _abc + '0123456789';
const _rnd = () => {
  let s = _abc[Math.floor(Math.random() * 26)];
  for (let i = 0; i < 11; i++) s += _abn[Math.floor(Math.random() * 36)];
  return s;
};

const _payload = JSON.parse(atob(P));
const SEL = _payload.S;
const RULES = _payload.R;

const UI = {
  root:     '_' + _rnd(),
  extChk:   '_' + _rnd(),
  promptsChk:'_' + _rnd(),
  wbChk:    '_' + _rnd(),
  popupChk: '_' + _rnd(),
  qrChk:    '_' + _rnd(),
  qrW:      '_' + _rnd(),
  qrWRow:   '_' + _rnd(),
  rxChk:    '_' + _rnd(),
  rxPad:    '_' + _rnd(),
  rxPadRow: '_' + _rnd(),
  asChk:    '_' + _rnd(),
  xbChk:    '_' + _rnd(),
  xbChar:   '_' + _rnd(),
  xbRow:    '_' + _rnd(),
  wrChk:    '_' + _rnd(),
  wrPanel:  '_' + _rnd(),
  wrFind:   '_' + _rnd(),
  wrWith:   '_' + _rnd(),
  wrCase:   '_' + _rnd(),
  wrMask:   '_' + _rnd(),
  wrStat:   '_' + _rnd(),
  sec:      '_' + _rnd(),
  row:      '_' + _rnd(),
  rowLbl:   '_' + _rnd(),
  ta:       '_' + _rnd(),
  input:    '_' + _rnd(),
  opts:     '_' + _rnd(),
  qrTa:     '_' + _rnd(),
};

const DS = {
  converted: 'd' + _rnd(),
  pasteIso:  'd' + _rnd(),
};

function _expandUiPlaceholders(str) {
  return str
    .split('__QTA__').join('textarea.' + UI.qrTa)
    .split('__UI_sec__').join('.' + UI.sec)
    .split('__UI_row__').join(UI.row)
    .split('__UI_rowLbl__').join(UI.rowLbl)
    .split('__UI_ta__').join(UI.ta)
    .split('__UI_input__').join(UI.input)
    .split('__UI_stat__').join(UI.wrStat)
    .split('__UI_opts__').join(UI.opts);
}

const _featCls = {};
const _fc = (f) => f ? (_featCls[f] ||= '_' + _rnd()) : '';

const _state = RULES.map(r => ({
  ...r,
  q: _expandUiPlaceholders(r.q),
  cls: '_' + _rnd(),
}));

const _uiRuleIds = new Set(['ui_sec','ui_row','ui_row_label','ui_fields','ui_ta','ui_stat','ui_opts']);

const DEFAULTS = {
  extensions: false,
  prompts: false,
  worldbook: false,
  popup: false,
  qr: false,
  qrLabelWidth: 120,
  regexwrap: false,
  regexPaddingRight: 20,
  assistantScript: false,
  xiaobaixIcon: false,
  xiaobaixIconChar: '❀',
  wordReplace: false,
  wordReplaceFind: '',
  wordReplaceWith: '',
  wordReplaceCaseSensitive: false,
  wordReplaceMask: false,
};

function getSettings() {
  if (!extension_settings[MODULE]) extension_settings[MODULE] = structuredClone(DEFAULTS);
  const s = extension_settings[MODULE];
  for (const [k, v] of Object.entries(DEFAULTS)) if (s[k] === undefined || s[k] === null) s[k] = v;
  if (s.qrlabelWidth !== undefined) delete s.qrlabelWidth;
  if (s.qrlabel !== undefined || s.qrset !== undefined) {
    if (s.qr === undefined) s.qr = !!(s.qrlabel ?? true);
    delete s.qrlabel; delete s.qrset;
  }
  return s;
}

function debounce(fn, wait = 120) {
  let t;
  return function (...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}
function rafThrottle(fn) {
  let scheduled = false;
  return function (...args) {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; fn.apply(this, args); });
  };
}

let _styleEl = null;
function _ensureStyle() {
  if (!_styleEl) {
    _styleEl = document.createElement('style');
    _styleEl.id = '_' + _rnd();
    document.head.appendChild(_styleEl);
  }
  return _styleEl;
}

function _dynVal(r, s) {
  if (r.id === 'xb_icon') return (s.xiaobaixIconChar || '❀').replace(/'/g, "\\'");
  if (r.id === 'rx_container') return String(Math.max(0, parseInt(s.regexPaddingRight, 10) || 0));
  if (r.id === 'qr_label_w') return String(parseInt(s.qrLabelWidth, 10) || 120);
  return '';
}

function _buildCss() {
  const s = getSettings();
  const out = [];
  for (const r of _state) {
    const body = r.f ? `body.${_fc(r.f)} ` : '';
    let decl = r.d;
    if (decl.indexOf('__V__') >= 0) {
      const v = _dynVal(r, s);
      decl = decl.split('__V__').join(v);
    }
    if (_uiRuleIds.has(r.id)) {
      out.push(`${body}${r.q}${r.e || ''}{${decl}}`);
    } else {
      out.push(`${body}.${r.cls}${r.e || ''}{${decl}}`);
    }
  }
  return out.join('');
}

function _tagAll(root = document) {
  for (const r of _state) {
    if (_uiRuleIds.has(r.id)) continue;
    try {
      const list = root.querySelectorAll ? root.querySelectorAll(r.q) : [];
      for (const el of list) el.classList.add(r.cls);
    } catch (e) {}
  }
}

function _syncBody() {
  const s = getSettings();
  const keys = ['extensions','prompts','worldbook','popup','qr','regexwrap','assistantScript','xiaobaixIcon'];
  for (const k of keys) document.body.classList.toggle(_fc(k), !!s[k]);
}

const applySettings = rafThrottle(function () {
  _ensureStyle().textContent = _buildCss();
  _syncBody();
  _tagAll();
  if (getSettings().qr) convertLabelsToTextarea(); else revertLabelTextareas();
});

function convertLabelsToTextarea(root = document) {
  const list = root.querySelectorAll ? root.querySelectorAll(SEL.qrLabelInput) : [];
  for (const input of list) {
    if (input.dataset[DS.converted]) continue;
    input.dataset[DS.converted] = '1';
    const ta = document.createElement('textarea');
    ta.className = UI.qrTa + ' text_pole';
    ta.value = input.value;
    ta.placeholder = input.placeholder || '';
    ta.rows = 1;
    input.style.display = 'none';
    input.parentNode.insertBefore(ta, input);
    for (const r of _state) {
      if (r.id === 'qr_ta' || r.id === 'qr_ta_focus') ta.classList.add(r.cls);
    }
    ta.addEventListener('input', () => {
      input.value = ta.value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    ta.addEventListener('change', () => {
      input.value = ta.value;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    ta.addEventListener('blur', () => { if (ta.value !== input.value) ta.value = input.value; });
  }
}

function revertLabelTextareas() {
  document.querySelectorAll('textarea.' + UI.qrTa).forEach(ta => {
    const input = ta.nextElementSibling;
    if (input && input.classList.contains(SEL.qrLabelClass)) {
      input.style.display = '';
      delete input.dataset[DS.converted];
    }
    ta.remove();
  });
}

let _qrObserver = null;
const _qrScanDebounced = debounce(() => {
  if (!getSettings().qr) return;
  convertLabelsToTextarea(document);
}, 80);
function startQrObserver() {
  if (_qrObserver) return;
  _qrObserver = new MutationObserver(muts => {
    for (const m of muts) {
      for (const n of m.addedNodes) {
        if (n.nodeType !== 1) continue;
        if (n.matches?.(SEL.qrLabelInput) || n.querySelector?.(SEL.qrLabelInput)) {
          _qrScanDebounced();
          return;
        }
      }
    }
  });
  _qrObserver.observe(document.body, { childList: true, subtree: true });
}
function stopQrObserver() {
  if (_qrObserver) { _qrObserver.disconnect(); _qrObserver = null; }
}

let _tagObserver = null;
const _tagScanDebounced = debounce(() => _tagAll(document), 30);
function startTagObserver() {
  if (_tagObserver) return;
  _tagObserver = new MutationObserver(muts => {
    for (const m of muts) {
      if (m.addedNodes && m.addedNodes.length) { _tagScanDebounced(); return; }
    }
  });
  _tagObserver.observe(document.body, { childList: true, subtree: true });
}

const _originalHtml = new WeakMap();
let _compiledRegex = null;

function compileTerms(s) {
  const terms = (s.wordReplaceFind || '').split(/[，,]/).map(t => t.trim()).filter(Boolean);
  if (!terms.length) { _compiledRegex = null; return false; }
  const escaped = terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const flags = s.wordReplaceCaseSensitive ? 'g' : 'gi';
  _compiledRegex = new RegExp(escaped.join('|'), flags);
  return true;
}

const MASK_CLS = '_awf_mask_';

function _ensureMaskStyle() {
  if (document.getElementById(MASK_CLS + 'style')) return;
  const s = document.createElement('style');
  s.id = MASK_CLS + 'style';
  s.textContent = '.' + MASK_CLS + '{' +
    'background:var(--SmartThemeQuoteColor,rgba(128,128,128,0.25));' +
    'color:transparent;' +
    'filter:blur(4px);' +
    'border-radius:3px;' +
    'padding:0 2px;' +
    'user-select:none;' +
    'cursor:default;' +
    'transition:filter .2s,color .2s;' +
  '}' +
  '.' + MASK_CLS + ':hover{' +
    'filter:blur(0);' +
    'color:inherit;' +
  '}';
  document.head.appendChild(s);
}

function _wrapMatchesInSpan(textNode) {
  const text = textNode.textContent;
  _compiledRegex.lastIndex = 0;
  if (!_compiledRegex.test(text)) return;
  _compiledRegex.lastIndex = 0;
  const frag = document.createDocumentFragment();
  let last = 0, m;
  while ((m = _compiledRegex.exec(text)) !== null) {
    if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
    const span = document.createElement('span');
    span.className = MASK_CLS;
    span.textContent = m[0];
    frag.appendChild(span);
    last = m.index + m[0].length;
  }
  if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
  textNode.parentNode.replaceChild(frag, textNode);
}

function replaceInNode(node, replaceWith, maskMode) {
  if (!_compiledRegex) return;
  if (maskMode) {
    _ensureMaskStyle();
    if (node.nodeType === Node.TEXT_NODE) {
      _wrapMatchesInSpan(node);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = node.tagName;
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA' || tag === 'INPUT') return;
      const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, {
        acceptNode: n => {
          const p = n.parentNode;
          if (!p) return NodeFilter.FILTER_REJECT;
          const t = p.tagName;
          if (t === 'SCRIPT' || t === 'STYLE' || t === 'TEXTAREA' || t === 'INPUT') return NodeFilter.FILTER_REJECT;
          if (p.classList && p.classList.contains(MASK_CLS)) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        },
      });
      const nodes = [];
      let n;
      while ((n = walker.nextNode())) nodes.push(n);
      nodes.forEach(_wrapMatchesInSpan);
    }
    return;
  }
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent;
    _compiledRegex.lastIndex = 0;
    if (_compiledRegex.test(text)) {
      _compiledRegex.lastIndex = 0;
      node.textContent = text.replace(_compiledRegex, replaceWith);
    }
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    const tag = node.tagName;
    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA' || tag === 'INPUT') return;
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, {
      acceptNode: n => {
        const p = n.parentNode;
        if (!p) return NodeFilter.FILTER_REJECT;
        const t = p.tagName;
        if (t === 'SCRIPT' || t === 'STYLE' || t === 'TEXTAREA' || t === 'INPUT') return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    let n;
    while ((n = walker.nextNode())) {
      const text = n.textContent;
      _compiledRegex.lastIndex = 0;
      if (_compiledRegex.test(text)) {
        _compiledRegex.lastIndex = 0;
        n.textContent = text.replace(_compiledRegex, replaceWith);
      }
    }
  }
}

function processMesText(el, replaceWith, maskMode) {
  if (!_originalHtml.has(el)) _originalHtml.set(el, el.innerHTML);
  else el.innerHTML = _originalHtml.get(el);
  replaceInNode(el, replaceWith, maskMode);
}

function restoreOriginals() {
  document.querySelectorAll(SEL.chatMesText).forEach(el => {
    if (_originalHtml.has(el)) el.innerHTML = _originalHtml.get(el);
  });
}

function applyReplaceToAll() {
  const s = getSettings();
  const ok = compileTerms(s);
  const maskMode = !!s.wordReplaceMask;
  const replaceWith = s.wordReplaceWith || '';
  const nodes = document.querySelectorAll(SEL.chatMesText);
  if (!ok) {
    nodes.forEach(el => { if (_originalHtml.has(el)) el.innerHTML = _originalHtml.get(el); });
    return;
  }
  nodes.forEach(el => processMesText(el, replaceWith, maskMode));
}

const applyReplaceDebounced = debounce(applyReplaceToAll, 200);

let _replaceObserver = null;
function startReplaceObserver() {
  if (_replaceObserver) return;
  const chat = document.querySelector(SEL.chat);
  if (!chat) return;
  _replaceObserver = new MutationObserver(mutations => {
    const s = getSettings();
    if (!s.wordReplace || !_compiledRegex) return;
    const maskMode = !!s.wordReplaceMask;
    const replaceWith = s.wordReplaceWith || '';
    const targets = new Set();
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType !== 1) continue;
        if (node.matches?.(SEL.mesText)) targets.add(node);
        else node.querySelectorAll?.(SEL.mesText).forEach(el => targets.add(el));
      }
    }
    if (!targets.size) return;
    requestAnimationFrame(() => { targets.forEach(el => processMesText(el, replaceWith, maskMode)); });
  });
  _replaceObserver.observe(chat, { childList: true, subtree: true });
}
function stopReplaceObserver() {
  if (_replaceObserver) { _replaceObserver.disconnect(); _replaceObserver = null; }
}
function syncReplaceObserver() {
  const s = getSettings();
  if (s.wordReplace) {
    compileTerms(s);
    startReplaceObserver();
    applyReplaceToAll();
  } else {
    stopReplaceObserver();
    _compiledRegex = null;
    restoreOriginals();
  }
}

function escHtml(str) {
  return (str || '').replace(/&/g,'&').replace(/</g,'<').replace(/>/g,'>').replace(/"/g,'"');
}

function isolatePasteAndInput(el) {
  if (!el || el.dataset[DS.pasteIso]) return;
  el.dataset[DS.pasteIso] = '1';
  const stopOnly = e => { e.stopPropagation(); };
  el.addEventListener('paste', stopOnly, true);
  el.addEventListener('copy', stopOnly, true);
  el.addEventListener('cut', stopOnly, true);
  el.addEventListener('drop', stopOnly, true);
  el.addEventListener('keydown', stopOnly, true);
  el.addEventListener('keyup', stopOnly, true);
}

function buildPanel() {
  const s = getSettings();
  const html = `
    <div class="${UI.root}">
      <div class="inline-drawer">
        <div class="inline-drawer-toggle inline-drawer-header">
          <b>momo的插件</b>
          <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
        </div>
        <div class="inline-drawer-content">
          <label class="checkbox_label" for="${UI.extChk}">
            <input type="checkbox" id="${UI.extChk}" ${s.extensions ? 'checked' : ''}>
            <span>扩展条目换行显示</span>
          </label>
          <label class="checkbox_label" for="${UI.promptsChk}">
            <input type="checkbox" id="${UI.promptsChk}" ${s.prompts ? 'checked' : ''}>
            <span>提示词管理器条目换行显示</span>
          </label>
          <label class="checkbox_label" for="${UI.wbChk}">
            <input type="checkbox" id="${UI.wbChk}" ${s.worldbook ? 'checked' : ''}>
            <span>世界书textarea换行显示</span>
          </label>
          <label class="checkbox_label" for="${UI.popupChk}">
            <input type="checkbox" id="${UI.popupChk}" ${s.popup ? 'checked' : ''}>
            <span>弹窗文本框换行显示</span>
          </label>
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            <label class="checkbox_label" for="${UI.qrChk}" style="margin:0;">
              <input type="checkbox" id="${UI.qrChk}" ${s.qr ? 'checked' : ''}>
              <span>快速回复换行显示</span>
            </label>
            <div id="${UI.qrWRow}" style="display:${s.qr ? 'flex' : 'none'};align-items:center;gap:4px;">
              <label for="${UI.qrW}" style="font-size:.82em;opacity:.8;white-space:nowrap;">标签宽度：</label>
              <input type="number" id="${UI.qrW}" min="40" max="600" step="1"
                value="${s.qrLabelWidth}"
                style="width:54px;padding:1px 4px;border-radius:4px;font-size:.85em;height:20px;box-sizing:border-box;">
              <span style="font-size:.82em;opacity:.8;">px</span>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            <label class="checkbox_label" for="${UI.rxChk}" style="margin:0;">
              <input type="checkbox" id="${UI.rxChk}" ${s.regexwrap ? 'checked' : ''}>
              <span>正则脚本名称换行显示</span>
            </label>
            <div id="${UI.rxPadRow}" style="display:${s.regexwrap ? 'flex' : 'none'};align-items:center;gap:4px;">
              <label for="${UI.rxPad}" style="font-size:.82em;opacity:.8;white-space:nowrap;">右侧留白：</label>
              <input type="number" id="${UI.rxPad}" min="0" max="300" step="1"
                value="${s.regexPaddingRight}"
                style="width:48px;padding:1px 4px;border-radius:4px;font-size:.85em;height:20px;box-sizing:border-box;">
              <span style="font-size:.82em;opacity:.8;">px</span>
            </div>
          </div>
          <label class="checkbox_label" for="${UI.asChk}">
            <input type="checkbox" id="${UI.asChk}" ${s.assistantScript ? 'checked' : ''}>
            <span>酒馆助手脚本换行显示</span>
          </label>
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            <label class="checkbox_label" for="${UI.xbChk}" style="margin:0;">
              <input type="checkbox" id="${UI.xbChk}" ${s.xiaobaixIcon ? 'checked' : ''}>
              <span>小白 x 图标替换</span>
            </label>
            <div id="${UI.xbRow}" style="display:${s.xiaobaixIcon ? 'flex' : 'none'};align-items:center;gap:4px;">
              <label for="${UI.xbChar}" style="font-size:.82em;opacity:.8;white-space:nowrap;">替换图标：</label>
              <input type="text" id="${UI.xbChar}"
                value="${escHtml(s.xiaobaixIconChar)}"
                maxlength="4"
                style="width:44px;padding:1px 4px;border-radius:4px;text-align:center;font-size:.95em;height:20px;box-sizing:border-box;">
            </div>
          </div>
          <label class="checkbox_label" for="${UI.wrChk}">
            <input type="checkbox" id="${UI.wrChk}" ${s.wordReplace ? 'checked' : ''}>
            <span>正文词汇替换</span>
          </label>
          <div id="${UI.wrPanel}" class="${UI.sec}" style="display:${s.wordReplace ? 'block' : 'none'};">
            <div class="${UI.row}">
              <label class="${UI.rowLbl}" for="${UI.wrFind}">查找词（可填多个，用 <b>，</b> 隔开）</label>
              <textarea id="${UI.wrFind}" class="${UI.ta} text_pole" rows="2" placeholder="词语1，词语2，词语3">${escHtml(s.wordReplaceFind)}</textarea>
            </div>
            <div class="${UI.row}" id="${UI.wrMask}_row" style="display:${s.wordReplaceMask ? 'none' : ''};">
              <label class="${UI.rowLbl}" for="${UI.wrWith}">替换为（留空则删除匹配词）</label>
              <input id="${UI.wrWith}" class="${UI.input} text_pole" type="text" placeholder="替换内容" value="${escHtml(s.wordReplaceWith)}" ${s.wordReplaceMask ? 'disabled' : ''}>
            </div>
            <div class="${UI.opts}">
              <label class="checkbox_label" for="${UI.wrCase}" style="margin:0;">
                <input type="checkbox" id="${UI.wrCase}" ${s.wordReplaceCaseSensitive ? 'checked' : ''}>
                <span>区分英文大小写</span>
              </label>
              <label class="checkbox_label" for="${UI.wrMask}" style="margin:0;">
                <input type="checkbox" id="${UI.wrMask}" ${s.wordReplaceMask ? 'checked' : ''}>
                <span>打码模式</span>
              </label>
            </div>
            <div class="${UI.wrStat}" id="${UI.wrStat}"></div>
          </div>
          <small style="opacity:.7;display:block;margin-top:8px;">修改后即时生效，无需刷新。</small>
        </div>
      </div>
    </div>
  `;
  $(SEL.extSettings).append(html);

  const bind = (id, handler) => $(document.getElementById(id)).on('change', handler);
  bind(UI.extChk,     function(){ getSettings().extensions = !!this.checked; applySettings(); saveSettingsDebounced(); });
  bind(UI.wbChk,      function(){ getSettings().worldbook  = !!this.checked; applySettings(); saveSettingsDebounced(); });
  bind(UI.popupChk,   function(){ getSettings().popup      = !!this.checked; applySettings(); saveSettingsDebounced(); });
  bind(UI.promptsChk, function(){ getSettings().prompts    = !!this.checked; applySettings(); saveSettingsDebounced(); });
  bind(UI.asChk,      function(){ getSettings().assistantScript = !!this.checked; applySettings(); saveSettingsDebounced(); });

  $(document.getElementById(UI.qrChk)).on('change', function () {
    const s = getSettings();
    s.qr = !!this.checked;
    $('#' + UI.qrWRow).toggle(s.qr);
    if (s.qr) startQrObserver(); else stopQrObserver();
    applySettings();
    saveSettingsDebounced();
  });

  $(document.getElementById(UI.qrW)).on('input change', debounce(function () {
    const val = parseInt(this.value, 10);
    if (!isNaN(val) && val >= 0) {
      getSettings().qrLabelWidth = val;
      applySettings();
      saveSettingsDebounced();
    }
  }, 100));

  $(document.getElementById(UI.rxChk)).on('change', function () {
    const s = getSettings();
    s.regexwrap = !!this.checked;
    $('#' + UI.rxPadRow).toggle(s.regexwrap);
    applySettings();
    saveSettingsDebounced();
  });

  $(document.getElementById(UI.rxPad)).on('input change', debounce(function () {
    const raw = String(this.value).trim();
    const val = raw === '' ? 0 : parseInt(raw, 10);
    if (!isNaN(val) && val >= 0) {
      getSettings().regexPaddingRight = val;
      applySettings();
      saveSettingsDebounced();
    }
  }, 100));

  $(document.getElementById(UI.xbChk)).on('change', function () {
    const s = getSettings();
    s.xiaobaixIcon = !!this.checked;
    $('#' + UI.xbRow).toggle(s.xiaobaixIcon);
    applySettings();
    saveSettingsDebounced();
  });

  $(document.getElementById(UI.xbChar)).on('input', debounce(function () {
    getSettings().xiaobaixIconChar = this.value || '❀';
    applySettings();
    saveSettingsDebounced();
  }, 150));

  $(document.getElementById(UI.wrChk)).on('change', function () {
    const s = getSettings();
    s.wordReplace = !!this.checked;
    $('#' + UI.wrPanel).toggle(s.wordReplace);
    syncReplaceObserver();
    saveSettingsDebounced();
  });

  function onReplaceInputImmediate() {
    const s = getSettings();
    compileTerms(s);
    const terms = (s.wordReplaceFind || '').split(/[，,]/).map(t => t.trim()).filter(Boolean);
    $('#' + UI.wrStat).text(terms.length ? `已配置 ${terms.length} 个查找词` : '');
    applyReplaceDebounced();
    saveSettingsDebounced();
  }

  const findEl = document.getElementById(UI.wrFind);
  const withEl = document.getElementById(UI.wrWith);
  isolatePasteAndInput(findEl);
  isolatePasteAndInput(withEl);

  $(findEl).on('input', function () {
    getSettings().wordReplaceFind = this.value;
    onReplaceInputImmediate();
  });
  $(withEl).on('input', function () {
    getSettings().wordReplaceWith = this.value;
    onReplaceInputImmediate();
  });
  $(document.getElementById(UI.wrCase)).on('change', function () {
    getSettings().wordReplaceCaseSensitive = !!this.checked;
    onReplaceInputImmediate();
  });
  $(document.getElementById(UI.wrMask)).on('change', function () {
    const s = getSettings();
    s.wordReplaceMask = !!this.checked;
    const withRow = document.getElementById(UI.wrMask + '_row');
    const withInput = document.getElementById(UI.wrWith);
    if (withRow) withRow.style.display = s.wordReplaceMask ? 'none' : '';
    if (withInput) withInput.disabled = s.wordReplaceMask;
    onReplaceInputImmediate();
    saveSettingsDebounced();
  });
}

jQuery(async () => {
  getSettings();
  applySettings();
  buildPanel();
  applySettings();
  startTagObserver();
  syncReplaceObserver();
  if (getSettings().qr) startQrObserver();
});
