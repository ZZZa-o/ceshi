/* © ss | auto-wrap-fix */
import { extension_settings } from '../../../extensions.js';
import { saveSettingsDebounced } from '../../../../script.js';

const MODULE = 'auto-wrap-fix';

(function injectStaticStyles() {
  const el = document.createElement('style');
  el.id = 'awf-static';
  el.textContent = `
body.awf-extensions .extension_block>.flexGrow.extension_text_block{flex:1 1 0;min-width:0;overflow:hidden;white-space:normal}
body.awf-extensions .extension_text_block .extension_name{white-space:normal;word-break:break-word;display:inline}
body.awf-extensions .extension_block{display:flex;align-items:center;flex-wrap:nowrap;overflow:hidden}
body.awf-worldbook .world_entry_form textarea.text_pole{field-sizing:content;min-height:1lh}
body.awf-popup textarea.popup-input.text_pole{field-sizing:content!important;min-height:1.5em!important;max-height:300px!important;overflow-y:auto!important}
body.awf-assistant-script div[data-type="script"]>.flex:last-child{gap:1px!important}
body.awf-assistant-script div[data-type="script"] .menu_button[title]{margin:0!important;padding:1px!important}
body.awf-assistant-script div[data-type="script"] .menu_button[title] i{margin:0!important;padding:0!important}
body.awf-assistant-script div[data-type="script"]>.ml-0\\.5.w-0.grow{width:auto!important;overflow:visible!important;white-space:normal!important;word-break:break-all!important;flex-shrink:1!important}
.awf-replace-section{margin-top:10px}
.awf-replace-section .awf-replace-row{display:flex;flex-direction:column;gap:4px;margin-top:8px}
.awf-replace-section label.awf-row-label{font-size:.85em;opacity:.8;margin-bottom:2px}
.awf-replace-section textarea.awf-ta,.awf-replace-section input.awf-input{width:100%;box-sizing:border-box;padding:4px 6px;border-radius:4px;resize:vertical;font-size:.9em;min-height:36px}
.awf-replace-section textarea.awf-ta{min-height:54px}
.awf-replace-status{font-size:.8em;opacity:.7;margin-top:2px;min-height:1em}
  `;
  document.head.appendChild(el);
})();

const DEFAULTS = {
  extensions: false,
  prompts: false,
  worldbook: false,
  popup: false,
  qr: false,
  regexwrap: false,
  regexPaddingRight: 20,
  assistantScript: false,
  xiaobaixIcon: false,
  xiaobaixIconChar: '❀',
  wordReplace: false,
  wordReplaceFind: '',
  wordReplaceWith: '',
};

const CLASS_MAP = {
  extensions:      'awf-extensions',
  worldbook:       'awf-worldbook',
  popup:           'awf-popup',
  assistantScript: 'awf-assistant-script',
};

function getSettings() {
  if (!extension_settings[MODULE]) {
    extension_settings[MODULE] = structuredClone(DEFAULTS);
  }
  const s = extension_settings[MODULE];
  for (const [k, v] of Object.entries(DEFAULTS)) {
    if (s[k] === undefined || s[k] === null) s[k] = v;
  }

  if (s.qrlabelWidth !== undefined) delete s.qrlabelWidth;
  if (s.qrlabel !== undefined || s.qrset !== undefined) {
    if (s.qr === undefined) s.qr = !!(s.qrlabel ?? true);
    delete s.qrlabel;
    delete s.qrset;
  }
  return s;
}

let _promptsStyleEl = null;
function applyPromptsStyle(s) {
  if (!_promptsStyleEl) {
    _promptsStyleEl = document.createElement('style');
    _promptsStyleEl.id = 'awf-prompts-style';
    document.head.appendChild(_promptsStyleEl);
  }
  if (s.prompts) {
    _promptsStyleEl.textContent = `
      #completion_prompt_manager_list .completion_prompt_manager_prompt .completion_prompt_manager_prompt_name{white-space:normal;word-break:break-word;overflow-wrap:break-word;overflow:visible;text-overflow:unset;min-width:0;display:flex;flex-wrap:nowrap;align-items:center;gap:.3em}
      #completion_prompt_manager_list .completion_prompt_manager_prompt .completion_prompt_manager_prompt_name>span[class*="fa-"]{flex:0 0 auto;align-self:center;line-height:1.4}
      #completion_prompt_manager_list .completion_prompt_manager_prompt .completion_prompt_manager_prompt_name a.prompt-manager-inspect-action{flex:1 1 0;min-width:0;white-space:normal;word-break:break-word;overflow-wrap:break-word;display:block;text-overflow:unset;overflow:visible;line-height:1.4}
      #completion_prompt_manager_list .completion_prompt_manager_prompt{height:auto;min-height:unset;align-items:center}
    `;
  } else {
    _promptsStyleEl.textContent = '';
  }
}

let _qrStyleEl = null;
function applyQrStyle(s) {
  if (!_qrStyleEl) {
    _qrStyleEl = document.createElement('style');
    _qrStyleEl.id = 'awf-qr-style';
    document.head.appendChild(_qrStyleEl);
  }
  if (s.qr) {
    _qrStyleEl.textContent = `
      .qr--set-itemLabelContainer{flex:0 0 120px!important;width:120px!important;min-width:120px!important;max-width:120px!important;overflow:visible!important;align-self:flex-start!important;display:flex!important;align-items:flex-start!important;box-sizing:border-box!important}
      textarea.awf-qrlabel-ta{width:100%!important;min-width:0!important;max-width:100%!important;box-sizing:border-box!important;white-space:pre-wrap!important;word-break:break-word!important;overflow-wrap:break-word!important;resize:none!important;field-sizing:content!important;min-height:28px!important;height:auto!important;line-height:1.4!important;padding:2px 4px!important;font:inherit!important}
      textarea.awf-qrlabel-ta:focus{outline:none!important}
      #qr--global .qr--item,#qr--chat .qr--item,#qr--character .qr--item{display:flex;flex-wrap:wrap;align-items:center;height:auto!important;min-height:unset!important}
      #qr--global .qr--set,#qr--chat .qr--set,#qr--character .qr--set{height:auto!important;min-height:28px!important;white-space:normal!important;word-break:break-all!important;overflow-wrap:break-word!important;overflow:hidden!important;flex:1 1 0!important;min-width:0!important}
      #qr--global .qr--set option,#qr--chat .qr--set option,#qr--character .qr--set option{white-space:normal!important;word-break:break-all!important}
    `;
    convertLabelsToTextarea();
  } else {
    _qrStyleEl.textContent = '';
    revertLabelTextareas();
  }
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
    ta.addEventListener('blur', () => {
      if (ta.value !== input.value) ta.value = input.value;
    });
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

let _qrObserver = null, _qrObserverTimer = null;
function startQrObserver() {
  if (_qrObserver) return;
  _qrObserver = new MutationObserver(() => {
    if (!getSettings().qr) return;
    clearTimeout(_qrObserverTimer);
    _qrObserverTimer = setTimeout(convertLabelsToTextarea, 50);
  });
  _qrObserver.observe(document.body, { childList: true, subtree: true });
}
function stopQrObserver() {
  if (_qrObserver) { _qrObserver.disconnect(); _qrObserver = null; }
  clearTimeout(_qrObserverTimer);
}

let _regexStyleEl = null;
function applyRegexPadding(s) {
  if (s.regexwrap) {
    if (!_regexStyleEl) {
      _regexStyleEl = document.createElement('style');
      _regexStyleEl.id = 'awf-regex-style';
      document.head.appendChild(_regexStyleEl);
    }
    const px = parseInt(s.regexPaddingRight, 10) || 0;
    const padRule = px > 0
      ? `#saved_regex_scripts,#saved_preset_scripts,#saved_scoped_scripts{padding-right:${px}px;}`
      : '';
    _regexStyleEl.textContent = `
      .regex-script-container{width:85%;margin-right:60px;}
      .regex_script_name{white-space:normal;line-height:1.4;}
      .regex-script-label{align-items:center;}
      ${padRule}
    `;
  } else {
    if (_regexStyleEl) { _regexStyleEl.remove(); _regexStyleEl = null; }
  }
}

let _xiaobaixStyleEl = null;
function applyXiaobaixStyle(s) {
  if (!_xiaobaixStyleEl) {
    _xiaobaixStyleEl = document.createElement('style');
    _xiaobaixStyleEl.id = 'awf-xiaobaix-style';
    document.head.appendChild(_xiaobaixStyleEl);
  }
  if (s.xiaobaixIcon) {
    const icon = (s.xiaobaixIconChar || '❀').replace(/'/g, "\\'");
    _xiaobaixStyleEl.textContent = `
      .xiaobaix-collapse-btn .xiaobaix-xstack span{display:none!important}
      .xiaobaix-collapse-btn .xiaobaix-xstack::before{content:'${icon}';color:var(--c-pure-black);font-size:16px;opacity:.8;font-weight:100;line-height:1}
      .xiaobaix-collapse-btn{background:transparent!important;border:none!important}
    `;
  } else {
    _xiaobaixStyleEl.textContent = '';
  }
}

function applySettings() {
  const s = getSettings();
  for (const [key, cls] of Object.entries(CLASS_MAP)) {
    document.body.classList.toggle(cls, !!s[key]);
  }
  applyPromptsStyle(s);
  applyQrStyle(s);
  applyRegexPadding(s);
  applyXiaobaixStyle(s);
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
function replaceInNode(node, findTerms, replaceWith) {
  if (!findTerms.length) return;
  if (node.nodeType === Node.TEXT_NODE) {
    let text = node.textContent, changed = false;
    for (const term of findTerms) {
      if (!term) continue;
      const re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      if (re.test(text)) { text = text.replace(re, replaceWith); changed = true; }
    }
    if (changed) node.textContent = text;
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    if (['script','style','textarea','input'].includes(node.tagName.toLowerCase())) return;
    for (const child of Array.from(node.childNodes)) replaceInNode(child, findTerms, replaceWith);
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
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
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
          <label class="checkbox_label" for="awf-extensions">
            <input type="checkbox" id="awf-extensions" ${s.extensions ? 'checked' : ''}>
            <span>扩展条目换行显示</span>
          </label>
          <label class="checkbox_label" for="awf-prompts">
            <input type="checkbox" id="awf-prompts" ${s.prompts ? 'checked' : ''}>
            <span>提示词管理器条目换行显示</span>
          </label>
          <label class="checkbox_label" for="awf-worldbook">
            <input type="checkbox" id="awf-worldbook" ${s.worldbook ? 'checked' : ''}>
            <span>世界书textarea换行显示</span>
          </label>
          <label class="checkbox_label" for="awf-popup">
            <input type="checkbox" id="awf-popup" ${s.popup ? 'checked' : ''}>
            <span>弹窗文本框换行显示</span>
          </label>
          <label class="checkbox_label" for="awf-qr">
            <input type="checkbox" id="awf-qr" ${s.qr ? 'checked' : ''}>
            <span>快速回复换行显示</span>
          </label>
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            <label class="checkbox_label" for="awf-regexwrap" style="margin:0;">
              <input type="checkbox" id="awf-regexwrap" ${s.regexwrap ? 'checked' : ''}>
              <span>正则脚本名称换行显示</span>
            </label>
            <div id="awf-regexpadding-row" style="display:${s.regexwrap ? 'flex' : 'none'};align-items:center;gap:4px;">
              <label for="awf-regexpadding" style="font-size:.82em;opacity:.8;white-space:nowrap;">右侧留白：</label>
              <input type="number" id="awf-regexpadding" min="0" max="300" step="1"
                value="${s.regexPaddingRight}"
                style="width:48px;padding:1px 4px;border-radius:4px;font-size:.85em;height:20px;box-sizing:border-box;">
              <span style="font-size:.82em;opacity:.8;">px</span>
            </div>
          </div>
          <label class="checkbox_label" for="awf-assistant-script">
            <input type="checkbox" id="awf-assistant-script" ${s.assistantScript ? 'checked' : ''}>
            <span>酒馆助手脚本换行显示</span>
          </label>
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            <label class="checkbox_label" for="awf-xiaobaixicon" style="margin:0;">
              <input type="checkbox" id="awf-xiaobaixicon" ${s.xiaobaixIcon ? 'checked' : ''}>
              <span>小白 x 图标替换</span>
            </label>
            <div id="awf-xiaobaixicon-row" style="display:${s.xiaobaixIcon ? 'flex' : 'none'};align-items:center;gap:4px;">
              <label for="awf-xiaobaixiconchar" style="font-size:.82em;opacity:.8;white-space:nowrap;">替换图标：</label>
              <input type="text" id="awf-xiaobaixiconchar"
                value="${escHtml(s.xiaobaixIconChar)}"
                maxlength="4"
                style="width:44px;padding:1px 4px;border-radius:4px;text-align:center;font-size:.95em;height:20px;box-sizing:border-box;">
            </div>
          </div>
          <label class="checkbox_label" for="awf-wordreplace">
            <input type="checkbox" id="awf-wordreplace" ${s.wordReplace ? 'checked' : ''}>
            <span>正文词汇替换</span>
          </label>
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
    </div>
  `;
  $('#extensions_settings2').append(html);

  for (const key of ['extensions','worldbook','popup']) {
    $(`#awf-${key}`).on('change', function () {
      getSettings()[key] = !!this.checked;
      applySettings();
      saveSettingsDebounced();
    });
  }

  $('#awf-prompts').on('change', function () {
    getSettings().prompts = !!this.checked;
    applySettings();
    saveSettingsDebounced();
  });

  $('#awf-qr').on('change', function () {
    const s = getSettings();
    s.qr = !!this.checked;
    if (s.qr) startQrObserver(); else stopQrObserver();
    applySettings();
    saveSettingsDebounced();
  });

  $('#awf-regexwrap').on('change', function () {
    const s = getSettings();
    s.regexwrap = !!this.checked;
    $('#awf-regexpadding-row').toggle(s.regexwrap);
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
    const s = getSettings();
    s.xiaobaixIcon = !!this.checked;
    $('#awf-xiaobaixicon-row').toggle(s.xiaobaixIcon);
    applySettings();
    saveSettingsDebounced();
  });

  $('#awf-xiaobaixiconchar').on('input', function () {
    getSettings().xiaobaixIconChar = this.value || '❀';
    applySettings();
    saveSettingsDebounced();
  });

  $('#awf-wordreplace').on('change', function () {
    const s = getSettings();
    s.wordReplace = !!this.checked;
    $('#awf-replace-panel').toggle(s.wordReplace);
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
  syncReplaceObserver();
  if (getSettings().qr) startQrObserver();
});
