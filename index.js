import { extension_settings } from '../../../extensions.js';
import { saveSettingsDebounced } from '../../../../script.js';
import { R } from './rules.gen.js';

const MODULE = 'auto-wrap-fix';

const _abc = 'abcdefghijklmnopqrstuvwxyz';
const _abn = _abc + '0123456789';
const _rnd = () => {
  let s = _abc[Math.floor(Math.random() * 26)];
  for (let i = 0; i < 11; i++) s += _abn[Math.floor(Math.random() * 36)];
  return s;
};

const RULES = JSON.parse(atob(R));

const _featCls = {};
const _fc = (f) => f ? (_featCls[f] ||= '_' + _rnd()) : '';

const _state = RULES.map(r => ({ ...r, cls: '_' + _rnd() }));

const DEFAULTS = {
  extensions: false, prompts: false, worldbook: false, popup: false,
  qr: false, regexwrap: false, regexPaddingRight: 20,
  assistantScript: false, xiaobaixIcon: false, xiaobaixIconChar: '❀',
  wordReplace: false, wordReplaceFind: '', wordReplaceWith: '',
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

let _styleEl = null;
function _ensureStyle() {
  if (!_styleEl) {
    _styleEl = document.createElement('style');
    _styleEl.id = '_' + _rnd();
    document.head.appendChild(_styleEl);
  }
  return _styleEl;
}

function _dynVal(r) {
  const s = getSettings();
  if (r.id === 'xb_icon') return (s.xiaobaixIconChar || '❀').replace(/'/g, "\\'");
  if (r.id === 'rx_pad') return String(parseInt(s.regexPaddingRight, 10) || 0);
  return '';
}

function _buildCss() {
  const s = getSettings();
  const out = [];
  for (const r of _state) {
    if (r.id === 'rx_pad' && !(parseInt(s.regexPaddingRight, 10) || 0)) continue;
    const body = r.f ? `body.${_fc(r.f)} ` : '';
    const decl = r.d.indexOf('__V__') >= 0 ? r.d.replace('__V__', _dynVal(r)) : r.d;
    out.push(`${body}.${r.cls}${r.e || ''}{${decl}}`);
  }
  return out.join('');
}

function _tagAll() {
  for (const r of _state) {
    try { document.querySelectorAll(r.q).forEach(el => el.classList.add(r.cls)); } catch (e) {}
  }
}

function _syncBody() {
  const s = getSettings();
  for (const k of ['extensions', 'prompts', 'worldbook', 'popup', 'qr', 'regexwrap', 'assistantScript', 'xiaobaixIcon']) {
    document.body.classList.toggle(_fc(k), !!s[k]);
  }
}

function applySettings() {
  _ensureStyle().textContent = _buildCss();
  _syncBody();
  _tagAll();
  if (getSettings().qr) convertLabelsToTextarea(); else revertLabelTextareas();
}

function convertLabelsToTextarea() {
  document.querySelectorAll('.qr--set-itemLabel.text_pole').forEach(input => {
    if (input.dataset.awfConverted) return;
    input.dataset.awfConverted = '1';
    const ta = document.createElement('textarea');
    ta.className = 'awf-qrlabel-ta text_pole';
    ta.value = input.value;
    ta.placeholder = input.placeholder || '';
    ta.rows = 1;
    input.style.display = 'none';
    input.parentNode.insertBefore(ta, input);
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
  });
}
function revertLabelTextareas() {
  document.querySelectorAll('textarea.awf-qrlabel-ta').forEach(ta => {
    const input = ta.nextElementSibling;
    if (input && input.classList.contains('qr--set-itemLabel')) {
      input.style.display = '';
      delete input.dataset.awfConverted;
    }
    ta.remove();
  });
}

let _obs = null, _obsTimer = null;
function startObserver() {
  if (_obs) return;
  _obs = new MutationObserver(() => {
    clearTimeout(_obsTimer);
    _obsTimer = setTimeout(() => {
      _tagAll();
      if (getSettings().qr) convertLabelsToTextarea();
    }, 30);
  });
  _obs.observe(document.body, { childList: true, subtree: true });
}

const _originalHtml = new Map();
function saveOriginals() {
  document.querySelectorAll('#chat .mes_text').forEach(el => {
    if (!_originalHtml.has(el)) _originalHtml.set(el, el.innerHTML);
  });
}
function restoreOriginals() {
  _originalHtml.forEach((html, el) => { if (document.contains(el)) el.innerHTML = html; });
  _originalHtml.clear();
}
function replaceInNode(node, terms, replaceWith) {
  if (!terms.length) return;
  if (node.nodeType === Node.TEXT_NODE) {
    let text = node.textContent, changed = false;
    for (const term of terms) {
      if (!term) continue;
      const re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      if (re.test(text)) { text = text.replace(re, replaceWith); changed = true; }
    }
    if (changed) node.textContent = text;
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    if (['script', 'style', 'textarea', 'input'].includes(node.tagName.toLowerCase())) return;
    for (const child of Array.from(node.childNodes)) replaceInNode(child, terms, replaceWith);
  }
}
function getActiveTerms(s) {
  return (s.wordReplaceFind || '').split(/[，,]/).map(t => t.trim()).filter(Boolean);
}
function applyReplaceToAll() {
  const s = getSettings();
  const terms = getActiveTerms(s);
  const replaceWith = s.wordReplaceWith || '';
  saveOriginals();
  document.querySelectorAll('#chat .mes_text').forEach(el => {
    const orig = _originalHtml.get(el);
    if (orig !== undefined) el.innerHTML = orig;
  });
  if (!terms.length) return;
  document.querySelectorAll('#chat .mes_text').forEach(el => replaceInNode(el, terms, replaceWith));
}
let _replaceObserver = null;
function startReplaceObserver() {
  if (_replaceObserver) return;
  const chat = document.getElementById('chat');
  if (!chat) return;
  _replaceObserver = new MutationObserver(mutations => {
    const s = getSettings();
    if (!s.wordReplace) return;
    const terms = getActiveTerms(s);
    if (!terms.length) return;
    const replaceWith = s.wordReplaceWith || '';
    mutations.forEach(m => {
      m.addedNodes.forEach(node => {
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        const targets = node.classList?.contains('mes_text') ? [node] : Array.from(node.querySelectorAll('.mes_text'));
        targets.forEach(el => {
          if (!_originalHtml.has(el)) _originalHtml.set(el, el.innerHTML);
          replaceInNode(el, terms, replaceWith);
        });
      });
    });
  });
  _replaceObserver.observe(chat, { childList: true, subtree: true });
}
function stopReplaceObserver() {
  if (_replaceObserver) { _replaceObserver.disconnect(); _replaceObserver = null; }
}
function syncReplaceObserver() {
  const s = getSettings();
  if (s.wordReplace) { startReplaceObserver(); applyReplaceToAll(); }
  else { stopReplaceObserver(); restoreOriginals(); }
}

function escHtml(str) {
  return (str || '').replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"');
}

function buildPanel() {
  const s = getSettings();
  const html = `
    <div class="auto-wrap-fix-settings">
      <div class="inline-drawer">
        <div class="inline-drawer-toggle inline-drawer-header">
          <b>momo的插件</b>
          <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
        </div>
        <div class="inline-drawer-content">
          <label class="checkbox_label" for="awf-extensions"><input type="checkbox" id="awf-extensions" ${s.extensions ? 'checked' : ''}><span>扩展条目换行显示</span></label>
          <label class="checkbox_label" for="awf-prompts"><input type="checkbox" id="awf-prompts" ${s.prompts ? 'checked' : ''}><span>提示词管理器条目换行显示</span></label>
          <label class="checkbox_label" for="awf-worldbook"><input type="checkbox" id="awf-worldbook" ${s.worldbook ? 'checked' : ''}><span>世界书textarea换行显示</span></label>
          <label class="checkbox_label" for="awf-popup"><input type="checkbox" id="awf-popup" ${s.popup ? 'checked' : ''}><span>弹窗文本框换行显示</span></label>
          <label class="checkbox_label" for="awf-qr"><input type="checkbox" id="awf-qr" ${s.qr ? 'checked' : ''}><span>快速回复换行显示</span></label>
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            <label class="checkbox_label" for="awf-regexwrap" style="margin:0;"><input type="checkbox" id="awf-regexwrap" ${s.regexwrap ? 'checked' : ''}><span>正则脚本名称换行显示</span></label>
            <div id="awf-regexpadding-row" style="display:${s.regexwrap ? 'flex' : 'none'};align-items:center;gap:4px;">
              <label for="awf-regexpadding" style="font-size:.82em;opacity:.8;white-space:nowrap;">右侧留白：</label>
              <input type="number" id="awf-regexpadding" min="0" max="300" step="1" value="${s.regexPaddingRight}" style="width:48px;padding:1px 4px;border-radius:4px;font-size:.85em;height:20px;box-sizing:border-box;">
              <span style="font-size:.82em;opacity:.8;">px</span>
            </div>
          </div>
          <label class="checkbox_label" for="awf-assistant-script"><input type="checkbox" id="awf-assistant-script" ${s.assistantScript ? 'checked' : ''}><span>酒馆助手脚本换行显示</span></label>
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            <label class="checkbox_label" for="awf-xiaobaixicon" style="margin:0;"><input type="checkbox" id="awf-xiaobaixicon" ${s.xiaobaixIcon ? 'checked' : ''}><span>小白 x 图标替换</span></label>
            <div id="awf-xiaobaixicon-row" style="display:${s.xiaobaixIcon ? 'flex' : 'none'};align-items:center;gap:4px;">
              <label for="awf-xiaobaixiconchar" style="font-size:.82em;opacity:.8;white-space:nowrap;">替换图标：</label>
              <input type="text" id="awf-xiaobaixiconchar" value="${escHtml(s.xiaobaixIconChar)}" maxlength="4" style="width:44px;padding:1px 4px;border-radius:4px;text-align:center;font-size:.95em;height:20px;box-sizing:border-box;">
            </div>
          </div>
          <label class="checkbox_label" for="awf-wordreplace"><input type="checkbox" id="awf-wordreplace" ${s.wordReplace ? 'checked' : ''}><span>正文词汇替换</span></label>
          <div id="awf-replace-panel" class="awf-replace-section" style="display:${s.wordReplace ? 'block' : 'none'};">
            <div class="awf-replace-row">
              <label class="awf-row-label" for="awf-replace-find">查找词（可填多个，用 <b>，</b> 隔开）</label>
              <textarea id="awf-replace-find" class="awf-ta text_pole" rows="2" placeholder="词语1，词语2，词语3">${escHtml(s.wordReplaceFind)}</textarea>
            </div>
            <div class="awf-replace-row">
              <label class="awf-row-label" for="awf-replace-with">替换为（留空则删除匹配词）</label>
              <input id="awf-replace-with" class="awf-input text_pole" type="text" placeholder="替换内容" value="${escHtml(s.wordReplaceWith)}">
            </div>
            <div class="awf-replace-status" id="awf-replace-status"></div>
          </div>
          <small style="opacity:.7;display:block;margin-top:8px;">修改后即时生效，无需刷新。</small>
        </div>
      </div>
    </div>`;
  $('#extensions_settings2').append(html);

  const simple = ['extensions', 'prompts', 'worldbook', 'popup'];
  for (const k of simple) {
    $(`#awf-${k}`).on('change', function () {
      getSettings()[k] = !!this.checked;
      applySettings();
      saveSettingsDebounced();
    });
  }
  $('#awf-qr').on('change', function () {
    getSettings().qr = !!this.checked;
    applySettings();
    saveSettingsDebounced();
  });
  $('#awf-regexwrap').on('change', function () {
    getSettings().regexwrap = !!this.checked;
    $('#awf-regexpadding-row').toggle(!!this.checked);
    applySettings();
    saveSettingsDebounced();
  });
  $('#awf-regexpadding').on('input change', function () {
    const val = parseInt(this.value, 10);
    if (!isNaN(val) && val >= 0) {
      getSettings().regexPaddingRight = val;
      applySettings();
      saveSettingsDebounced();
    }
  });
  $('#awf-assistant-script').on('change', function () {
    getSettings().assistantScript = !!this.checked;
    applySettings();
    saveSettingsDebounced();
  });
  $('#awf-xiaobaixicon').on('change', function () {
    getSettings().xiaobaixIcon = !!this.checked;
    $('#awf-xiaobaixicon-row').toggle(!!this.checked);
    applySettings();
    saveSettingsDebounced();
  });
  $('#awf-xiaobaixiconchar').on('input', function () {
    getSettings().xiaobaixIconChar = this.value || '❀';
    applySettings();
    saveSettingsDebounced();
  });
  $('#awf-wordreplace').on('change', function () {
    getSettings().wordReplace = !!this.checked;
    $('#awf-replace-panel').toggle(!!this.checked);
    syncReplaceObserver();
    saveSettingsDebounced();
  });
  function onReplaceInput() {
    const s = getSettings();
    const terms = getActiveTerms(s);
    $('#awf-replace-status').text(terms.length ? `已配置 ${terms.length} 个查找词` : '');
    applyReplaceToAll();
    saveSettingsDebounced();
  }
  $('#awf-replace-find').on('input', function () {
    getSettings().wordReplaceFind = this.value;
    onReplaceInput();
  });
  $('#awf-replace-with').on('input', function () {
    getSettings().wordReplaceWith = this.value;
    onReplaceInput();
  });
}

jQuery(async () => {
  getSettings();
  applySettings();
  buildPanel();
  applySettings();
  startObserver();
  syncReplaceObserver();
});
