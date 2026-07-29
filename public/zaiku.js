var Zaiku = Zaiku || {}
Zaiku._readyQueue = []

Zaiku.ready = function(fn) {
  if (Zaiku._initialized) {
    fn()
  } else {
    Zaiku._readyQueue.push(fn)
  }
}

Zaiku.defaults = {
  tagInput: {
    spaceSeparator: true,
    badgeClass: 'badge-secondary',
    allowTagEdit: false,
    validate: null,
    onInsert: null,
    onDelete: null,
    onUpdate: null
  },
  formValidation: {
    validateUrl: null,
    debounceMs: 300,
    requiredMessage: 'This field is required'
  },
  clipboard: {
    successText: 'Copied!',
    successDuration: 2000
  },
  tabs: {
    tabSelector: '[data-tab-target], .tab',
    panelSelector: '[data-tab-panel], .tab-panel',
    activeTabClass: 'tab-active',
    activePanelClass: 'tab-panel-active',
    onSwitch: null
  },
  accordion: {
    multiple: false,
    onOpen: null,
    onClose: null,
    media: false,
    mediaPlayers: {}
  },
  stopMediaPlayerByMediaObserver: false,
  scrub: {
    step: 1,
    fineStep: 0.1,
    coarseStep: 10,
    min: 0,
    max: 100,
    decimals: 0,
    onInput: null,
    onUpdate: null,
    onFocus: null
  },
  dropdown: {
    autoPlacement: true,
    onOpen: null,
    onClose: null,
    onSelect: null,
    submenu: {
      trigger: 'hover',
      delay: 300
    }
  },
  hoverSlider: {
    speed: 800,
    speedIncreaseOnMove: 2,
    loop: true,
    resetOnLeave: false,
    moveOnly: false,
    forwardOnly: false,
    delay: 0,
    showCounter: false,
    showPagination: false,
    effects: null,
    onInit: null,
    onStart: null,
    onFinish: null,
    onSlide: null
  },
  lazyLoader: {
    rootMargin: '200px',
    threshold: 0,
    srcAttr: 'data-src',
    srcsetAttr: 'data-srcset',
    loadedClass: 'lazy-loaded',
    loadingContent: null,
    onLoad: null
  },
  elasticCards: {
    expandRatio: 2,
    collapseRatio: 0.5,
    effects: null,
    onEnter: null,
    onLeave: null,
    onExpand: null,
    onShrink: null
  },
  slider: {
    loop: false,
    autoPlay: false,
    interval: 3000,
    showControls: false,
    showPagination: false,
    slidesPerView: 1,
    gap: 0,
    draggable: false,
    direction: 'horizontal',
    breakpoints: null,
    sensitivitySwipe: 50,
    pauseOnHover: true,
    showCounter: false,
    timerStyle: 'bar',
    timerSize: 20,
    timerPosition: 'tr',
    timerStroke: 3,
    onInit: null,
    onSlide: null,
    onDestroy: null,
    onStart: null,
    onDrag: null,
    onSwipe: null,
    onEnd: null
  }
}

Zaiku.mediaPlayers = {
  'youtube.com': function(url) {
    var m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
    return m ? 'https://www.youtube.com/embed/' + m[1] : null
  },
  'vimeo.com': function(url) {
    var m = url.match(/vimeo\.com\/(\d+)/)
    return m ? 'https://player.vimeo.com/video/' + m[1] : null
  },
  'soundcloud.com': function(url) {
    return url.match(/soundcloud\.com\//) ? 'https://w.soundcloud.com/player/?url=' + encodeURIComponent(url) : null
  },
  'open.spotify.com': function(url) {
    var m = url.match(/open\.spotify\.com\/([a-z]+\/[a-zA-Z0-9]+)/)
    return m ? 'https://open.spotify.com/embed/' + m[1] : null
  },
  'twitch.tv': function(url) {
    var m = url.match(/twitch\.tv\/([a-zA-Z0-9_]+)/)
    return m ? 'https://player.twitch.tv/?channel=' + m[1] : null
  }
}

function resolveAttr(container, attr, fallback) {
  var val = container.getAttribute(attr)
  if (val === null) return fallback
  if (val === '' || val === 'true') return true
  if (val === 'false') return false
  var num = Number(val)
  return isNaN(num) ? val : num
}

function extend(a, b) {
  for (var key in b) {
    if (b.hasOwnProperty(key)) {
      if (typeof b[key] === 'object' && b[key] !== null && !Array.isArray(b[key])) {
        a[key] = a[key] || {}
        for (var sub in b[key]) a[key][sub] = b[key][sub]
      } else {
        a[key] = b[key]
      }
    }
  }
  return a
}

Zaiku.parseMediaUrl = function(url, customPlayers) {
  customPlayers = customPlayers || {}
  var players = extend({}, Zaiku.mediaPlayers)
  extend(players, customPlayers)
  for (var key in players) {
    if (players.hasOwnProperty(key)) {
      var result = players[key](url)
      if (result) return result
    }
  }
  return null
}

Zaiku.isMediaInOpenContainer = function(wrapper) {
  var content = wrapper.closest('.accordion-content')
  if (content) return content.classList.contains('active') && content.style.display !== 'none'
  var panel = wrapper.closest('.tab-panel')
  if (panel) return panel.classList.contains('tab-panel-active')
  return true
}

Zaiku.initStopMediaObserver = function(opts) {
  var ioConfig = typeof opts.stopMediaPlayerByMediaObserver === 'object' ? opts.stopMediaPlayerByMediaObserver : {}
  var customPlayers = ioConfig.mediaPlayers || (opts.accordion && opts.accordion.mediaPlayers) || {}

  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      var wrapper = entry.target
      if (!wrapper.getAttribute) return
      var src = wrapper.getAttribute('data-zaiku-media')
      if (!src) return

      var iframe = wrapper.querySelector('iframe')

      if (entry.isIntersecting && !iframe && Zaiku.isMediaInOpenContainer(wrapper)) {
        var embedSrc = Zaiku.parseMediaUrl(src, customPlayers)
        if (!embedSrc) return
        iframe = document.createElement('iframe')
        iframe.setAttribute('src', embedSrc)
        iframe.setAttribute('frameborder', '0')
        iframe.setAttribute('allowfullscreen', 'true')
        iframe.setAttribute('allow', 'autoplay; encrypted-media')
        wrapper.appendChild(iframe)
      } else if (!entry.isIntersecting && iframe) {
        iframe.remove()
      }
    })
  }, {
    rootMargin: ioConfig.rootMargin || '0px',
    threshold: ioConfig.threshold || 0
  })

  document.querySelectorAll('[data-zaiku-media]').forEach(function(el) {
    observer.observe(el)
  })

  if (typeof MutationObserver !== 'undefined') {
    var mutationObserver = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType !== 1) return
          if (node.matches && node.matches('[data-zaiku-media]')) observer.observe(node)
          if (node.querySelectorAll) {
            node.querySelectorAll('[data-zaiku-media]').forEach(function(el) { observer.observe(el) })
          }
        })
      })
    })
    mutationObserver.observe(document.body, { childList: true, subtree: true })
    Zaiku._mediaMutationObserver = mutationObserver
  }

  Zaiku._mediaObserver = observer
}

Zaiku.init = function (options) {
  var opts = extend({}, Zaiku.defaults)
  if (options) extend(opts, options)

  document.querySelectorAll('.input-tags').forEach(function (container) {
    new Zaiku.TagInput(container, opts)
  })

  document.querySelectorAll('form[data-zaiku-validation]').forEach(function (form) {
    new Zaiku.FormValidation(form, opts)
  })

  document.querySelectorAll('[data-zaiku-clipboard]').forEach(function (el) {
    new Zaiku.Clipboard(el, opts)
  })

  document.querySelectorAll('[data-zaiku-progress]').forEach(function (el) {
    new Zaiku.Progress(el, opts)
  })

  document.querySelectorAll('.tab-area').forEach(function (el) {
    new Zaiku.Tabs(el, opts)
  })

  document.querySelectorAll('[data-zaiku-accordion]').forEach(function (el) {
    new Zaiku.Accordion(el, opts)
  })

  document.querySelectorAll('[data-zaiku-scrub]').forEach(function (el) {
    new Zaiku.Scrub(el, opts)
  })

  document.querySelectorAll('.dropdown:not(.popover)').forEach(function (el) {
    new Zaiku.Dropdown(el, opts)
  })

  document.querySelectorAll('[data-zaiku-hover-slider]').forEach(function (el) {
    new Zaiku.HoverSlider(el, opts)
  })

  new Zaiku.LazyLoader(opts)

  document.querySelectorAll('[data-zaiku-card-elastic]').forEach(function (el) {
    new Zaiku.ElasticCards(el, opts)
  })

  document.querySelectorAll('[data-zaiku-slider]').forEach(function (el) {
    new Zaiku.Slider(el, opts)
  })

  if (opts.stopMediaPlayerByMediaObserver) Zaiku.initStopMediaObserver(opts)

  Zaiku._initialized = true
  Zaiku._readyQueue.forEach(function(fn) { fn() })
  Zaiku._readyQueue = []
}

class ZaikuTagInput {
  constructor(container, opts) {
    if (typeof container === 'string') container = document.querySelector(container)
    if (!container) return
    if (container.zaiku && container.zaiku.tagInstance) return container.zaiku.tagInstance

    this.container = container
    this.input = container.querySelector('.input-tags-field')
    if (!this.input || this.input.disabled) return

    var cfg = (opts && opts.tagInput) || opts || {}
    this.spaceSeparator = resolveAttr(container, 'data-tag-space-separator', cfg.spaceSeparator)
    this.badgeClass = resolveAttr(container, 'data-tag-badge-class', cfg.badgeClass)
    this.onInsert = cfg.onInsert
    this.onDelete = cfg.onDelete
    this.onUpdate = cfg.onUpdate
    this.allowEdit = cfg.allowTagEdit

    this.validate = cfg.validate
    if (typeof this.validate === 'string') {
      var url = this.validate
      this.validate = function (text, cb) {
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tag: text })
        }).then(function (r) { return r.json() }).then(function (data) {
          cb(data.valid !== false, data.message || '')
        }).catch(function () { cb(true) })
      }
    }

    container.zaiku = container.zaiku || {}
    container.zaiku.tagInstance = this
    this.init()
  }

  init() {
    this.container.querySelectorAll('.badge').forEach((badge) => {
      if (!badge._origClass) {
        var found = null
        var parts = badge.className.split(/\s+/)
        for (var i = 0; i < parts.length; i++) {
          var c = parts[i]
          if (c.indexOf('badge-') === 0 && c !== 'badge-text' && c !== 'badge-active' && c !== 'badge-outline' && c !== 'badge-bar' && c !== 'badge-validating') {
            found = c
            break
          }
        }
        badge._origClass = found || this.badgeClass || 'badge-secondary'
      }
      this.wrapBadgeText(badge)
      this.addRemoveButton(badge)
    })

    this.input.addEventListener('keydown', (e) => {
      if (e.key === ',' || (e.key === ' ' && this.spaceSeparator)) {
        e.preventDefault()
        var value = this.input.value.trim()
        if (value) {
          this.addTag(value)
          this.input.value = ''
        }
        return
      }

      if (e.key === 'Backspace' && this.input.value === '') {
        e.preventDefault()
        var active = this.container.querySelector('.badge-active')
        if (active) {
          var tagText = active.dataset.tag || active.textContent
          if (this.onDelete && this.onDelete(tagText, active) !== true) return
          active.remove()
          var badges = this.container.querySelectorAll('.input-tags > .badge')
          if (badges.length > 0) {
            badges[badges.length - 1].classList.add('badge-active')
          }
        } else {
          var badges = this.container.querySelectorAll('.input-tags > .badge')
          if (badges.length > 0) {
            badges[badges.length - 1].classList.add('badge-active')
          }
        }
        return
      }

      this.deactivateTags()
    })

    this.input.addEventListener('input', () => {
      this.deactivateTags()
    })

    if (this.allowEdit) {
      this.container.addEventListener('dblclick', (e) => {
        var badge = e.target.closest('.badge')
        if (!badge || badge.querySelector('.editing')) return
        if (e.target.closest('.tag-remove')) return
        this.startEdit(badge)
      })
    }
  }

  wrapBadgeText(badge) {
    if (badge.querySelector('.badge-text')) return
    var text = ''
    var nodes = []
    for (var i = 0; i < badge.childNodes.length; i++) {
      if (badge.childNodes[i].nodeType === 3) {
        text += badge.childNodes[i].nodeValue
        nodes.push(badge.childNodes[i])
      }
    }
    if (!text) return
    nodes.forEach(function (n) { n.remove() })
    var span = document.createElement('span')
    span.className = 'badge-text'
    span.textContent = text.trim()
    badge._textSpan = span
    badge.insertBefore(span, badge.firstChild)
  }

  getEditText(badge) {
    var span = badge._textSpan
    return span ? span.textContent.trim() : ''
  }

  selectText(badge) {
    var span = badge._textSpan
    if (!span) return
    var range = document.createRange()
    range.setStart(span.firstChild, span.textContent.length)
    range.collapse(true)
    var sel = window.getSelection()
    sel.removeAllRanges()
    sel.addRange(range)
  }

  setEditText(badge, text) {
    var span = badge._textSpan
    if (span) span.textContent = text
  }

  startEdit(badge) {
    var span = badge._textSpan
    if (!span) return

    this.clearError(badge)

    var self = this
    var oldText = span.textContent.trim()
    badge.classList.add('editing')
    span.contentEditable = true
    span.focus()
    var resolved = false

    var finish = (save) => {
      if (resolved) return
      resolved = true
      span.contentEditable = false
      badge.classList.remove('editing')
      var newText = save ? span.textContent.trim() : oldText
      newText = newText || oldText
      span.textContent = newText
      badge.dataset.tag = newText
    }

    span.addEventListener('blur', () => {
      if (resolved) return
      var newText = span.textContent.trim()
      if (newText && newText !== oldText) {
        if (this.onUpdate && this.onUpdate(oldText, newText, badge) !== true) {
          finish(false)
        } else {
          this.validateTag(newText, badge, function (valid) {
            if (valid) {
              finish(true)
            } else {
              span.textContent = oldText
              finish(false)
              self.clearError(badge)
            }
          })
        }
      } else {
        finish(false)
      }
    }, { once: true })

    span.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        span.blur()
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        finish(false)
      }
    })

    span.addEventListener('paste', (e) => {
      e.preventDefault()
      var text = (e.clipboardData || window.clipboardData).getData('text/plain')
      if (text) document.execCommand('insertText', false, text)
    })
  }

  addTag(text) {
    var badge = document.createElement('span')
    badge._origClass = this.badgeClass || 'badge-secondary'
    badge.className = 'badge ' + badge._origClass
    badge.dataset.tag = text
    var textSpan = document.createElement('span')
    textSpan.className = 'badge-text'
    textSpan.textContent = text
    badge._textSpan = textSpan
    badge.appendChild(textSpan)
    this.addRemoveButton(badge)

    if (this.onInsert && this.onInsert(text, badge) !== true) return

    this.input.parentNode.insertBefore(badge, this.input)
    this.deactivateTags()

    this.validateTag(text, badge)
  }

  validateTag(text, badge, done) {
    if (!this.validate) {
      if (done) done(true)
      return
    }

    this.clearError(badge)
    badge.classList.add('badge-validating')

    var self = this
    this.validate(text, function (valid, message) {
      badge.classList.remove('badge-validating')
      if (valid) {
        if (done) done(true)
      } else {
        if (message) {
          self.showTagError(badge, text, message)
        }
        if (done) done(false)
      }
    })
  }

  showTagError(badge, text, message) {
    var textSpan = badge._textSpan
    if (textSpan) textSpan.className = 'badge border-0 bg-lavender'
    badge.classList.remove(badge._origClass || 'badge-secondary')
    badge.classList.add('badge-outline', 'badge-bar', 'border-1', 'border-red')
    var removeBtn = badge.querySelector('.tag-remove')
    var msgSpan = document.createElement('span')
    msgSpan.className = 'tag-error-msg'
    msgSpan.textContent = message
    if (removeBtn) {
      badge.insertBefore(msgSpan, removeBtn)
    } else {
      badge.appendChild(msgSpan)
    }
  }

  clearError(badge) {
    var msg = badge.querySelector('.tag-error-msg')
    if (msg) msg.remove()
    var textSpan = badge._textSpan
    if (textSpan) textSpan.className = 'badge-text'
    badge.classList.remove('badge-outline', 'badge-bar', 'border-2', 'border-red')
    badge.classList.add(badge._origClass || 'badge-secondary')
  }

  addRemoveButton(badge) {
    if (badge.querySelector('.tag-remove')) return

    var btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'tag-remove'
    btn.innerHTML = '&times;'
    btn.setAttribute('aria-label', 'Remove tag')
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      var text = badge.dataset.tag || badge.textContent
      if (this.onDelete && this.onDelete(text, badge) !== true) return
      badge.remove()
      this.deactivateTags()
      this.input.focus()
    })
    badge.appendChild(btn)
  }

  deactivateTags() {
    this.container.querySelectorAll('.badge-active').forEach((badge) => {
      badge.classList.remove('badge-active')
    })
  }
}

Zaiku.TagInput = ZaikuTagInput

class ZaikuFormValidation {
  constructor(form, opts) {
    if (typeof form === 'string') form = document.querySelector(form)
    if (!form) return
    if (form.zaiku && form.zaiku.formInstance) return form.zaiku.formInstance

    this.form = form
    var cfg = (opts && opts.formValidation) || opts || {}
    this.debounceMs = resolveAttr(form, 'data-zaiku-debounce-ms', cfg.debounceMs)
    this.requiredMessage = resolveAttr(form, 'data-zaiku-required-msg', cfg.requiredMessage)

    this.validateUrl = resolveAttr(form, 'data-zaiku-validate-url', cfg.validateUrl)
    if (typeof cfg.onValidate === 'function') {
      this.validate = cfg.onValidate
    } else if (typeof this.validateUrl === 'string') {
      var url = this.validateUrl
      this.validate = function (name, value, cb) {
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name, value: value })
        }).then(function (r) { return r.json() }).then(function (data) {
          cb(data.valid !== false, data.message || '', data.type || 'danger')
        }).catch(function () { cb(true) })
      }
    }

    form.zaiku = form.zaiku || {}
    form.zaiku.formInstance = this
    this.init()
  }

  init() {
    this.timers = {}

    this.form.querySelectorAll('.input').forEach(function (input) {
      this.attachInput(input)
    }, this)

    this.submitHandler = function (e) {
      this.onSubmit(e)
    }.bind(this)
    this.form.addEventListener('submit', this.submitHandler)
  }

  onSubmit(e) {
    var invalid = false
    var inputs = this.form.querySelectorAll('.input')

    for (var i = 0; i < inputs.length; i++) {
      var input = inputs[i]
      if (input.disabled) continue
      this.clearField(input)
      if (input.hasAttribute('required') && input.value.trim() === '') {
        this.showFieldError(input, this.requiredMessage, 'danger')
        invalid = true
      }
    }

    if (invalid) {
      e.preventDefault()
    }
  }

  attachInput(input) {
    if (input.disabled) return
    var name = input.getAttribute('name') || input.id
    if (!name) return

    input.addEventListener('input', function () {
      this.validateField(name, input)
    }.bind(this))
  }

  validateField(name, input) {
    if (this.timers[name]) clearTimeout(this.timers[name])

    this.timers[name] = setTimeout(function () {
      if (!this.validate) return
      this.validate(name, input.value, function (valid, message, type) {
        if (valid) {
          this.clearField(input)
        } else {
          this.showFieldError(input, message, type || 'danger')
        }
      }.bind(this))
    }.bind(this), this.debounceMs)
  }

  showFieldError(input, message, type) {
    input.setAttribute('aria-invalid', 'true')

    var msgEl = this.getMsgEl(input) || this.createMsgEl(input)
    msgEl.textContent = message
    msgEl.className = 'field-msg field-msg-' + type + ' is-visible'
  }

  clearField(input) {
    input.removeAttribute('aria-invalid')
    var msgEl = this.getMsgEl(input)
    if (msgEl) msgEl.remove()
  }

  getMsgEl(input) {
    var next = input.nextElementSibling
    if (next && next.classList.contains('field-msg')) return next
    return null
  }

  createMsgEl(input) {
    var el = document.createElement('div')
    el.className = 'field-msg'
    input.parentNode.insertBefore(el, input.nextSibling)
    return el
  }
}

Zaiku.FormValidation = ZaikuFormValidation

class ZaikuClipboard {
  constructor(container, opts) {
    if (typeof container === 'string') container = document.querySelector(container)
    if (!container) return
    if (container.zaiku && container.zaiku.clipInstance) return container.zaiku.clipInstance

    this.container = container
    this.btn = container.querySelector('[data-copy-btn]')
    if (!this.btn) return

    var cfg = (opts && opts.clipboard) || opts || {}
    this.successText = resolveAttr(container, 'data-copy-success-text', cfg.successText)
    this.successDuration = resolveAttr(container, 'data-copy-success-duration', cfg.successDuration)

    container.zaiku = container.zaiku || {}
    container.zaiku.clipInstance = this
    this.init()
  }

  init() {
    this.btn.addEventListener('click', this.copy.bind(this))
  }

  copy() {
    var text = this.container.getAttribute('data-clipboard-text')
    if (text === null || text === '') {
      var targetSelector = this.btn.getAttribute('data-clipboard-target')
      if (targetSelector) {
        var source = this.container.querySelector(targetSelector)
        if (source) {
          text = source.value || source.textContent || ''
        }
      }
    }
    if (!text) {
      console.warn('Zaiku.Clipboard: no source found. Set data-clipboard-text or data-clipboard-target.')
      return
    }

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(this.showSuccess.bind(this)).catch(this.execCopy.bind(this, text))
    } else {
      this.execCopy(text)
    }
  }

  execCopy(text) {
    var ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    try { document.execCommand('copy') } catch (e) {}
    document.body.removeChild(ta)
    this.showSuccess()
  }

  showSuccess() {
    var origText = this.btn.textContent
    var origClass = this.btn.className
    this.btn.textContent = this.successText
    this.btn.classList.add('btn-success')
    setTimeout(function () {
      this.btn.textContent = origText
      this.btn.className = origClass
    }.bind(this), this.successDuration)
  }
}

Zaiku.Clipboard = ZaikuClipboard

class ZaikuProgress {
  constructor(container, opts) {
    if (typeof container === 'string') container = document.querySelector(container)
    if (!container) return
    if (container.zaiku && container.zaiku.progressInstance) return container.zaiku.progressInstance

    this.container = container
    this.bar = container.querySelector('.progress-bar')
    this.label = container.querySelector('.progress-label')
    if (!this.bar) return

    this._value = 0
    this._interval = null

    var initial = this.bar.style.width
    if (initial) {
      this._value = parseInt(initial, 10) || 0
    }

    container.zaiku = container.zaiku || {}
    container.zaiku.progressInstance = this
  }

  setValue(pct) {
    this._value = Math.max(0, Math.min(100, pct))
    if (this.bar) {
      this.bar.style.width = this._value + '%'
    }
    if (this.label) {
      this.label.textContent = this._value + '%'
    }
    return this
  }

  getValue() {
    return this._value
  }

  increment(amount) {
    return this.setValue(this._value + (amount || 1))
  }

  start(intervalMs) {
    this.stop()
    this._interval = setInterval(function () {
      this.increment(1)
      if (this._value >= 100) this.stop()
    }.bind(this), intervalMs || 50)
    return this
  }

  stop() {
    if (this._interval) {
      clearInterval(this._interval)
      this._interval = null
    }
    return this
  }

  reset() {
    this.stop()
    return this.setValue(0)
  }

  finish() {
    this.stop()
    return this.setValue(100)
  }

  loading(activate) {
    if (activate === undefined) {
      this.container.classList.toggle('progress-loading')
    } else if (activate) {
      this.container.classList.add('progress-loading')
    } else {
      this.container.classList.remove('progress-loading')
    }
    return this
  }

  isLoading() {
    return this.container.classList.contains('progress-loading')
  }
}

Zaiku.Progress = ZaikuProgress

class ZaikuTabs {
  constructor(container, opts) {
    if (typeof container === 'string') container = document.querySelector(container)
    if (!container) return
    if (container.zaiku && container.zaiku.tabsInstance) return container.zaiku.tabsInstance

    this.container = container
    var cfg = (opts && opts.tabs) || opts || {}
    this.tabSelector = resolveAttr(container, 'data-tab-selector', cfg.tabSelector)
    this.panelSelector = resolveAttr(container, 'data-panel-selector', cfg.panelSelector)
    this.activeTabClass = resolveAttr(container, 'data-active-tab-class', cfg.activeTabClass)
    this.activePanelClass = resolveAttr(container, 'data-active-panel-class', cfg.activePanelClass)
    this.onSwitch = cfg.onSwitch
    this.hashEnabled = resolveAttr(container, 'data-tab-hash', cfg.tabHash)

    this._triggers = []
    this._panels = []
    this._activeIndex = -1

    if (!this.findTabs()) return

    container.zaiku = container.zaiku || {}
    container.zaiku.tabsInstance = this
    this.init()
  }

  findTabs() {
    this._triggers = Array.prototype.slice.call(this.container.querySelectorAll(this.tabSelector))
    var panels = this.container.querySelectorAll(this.panelSelector)
    this._panels = Array.prototype.slice.call(panels)

    if (this._triggers.length === 0) return false

    this._triggers.forEach(function (trigger, i) {
      var target = trigger.getAttribute('data-tab-target')
      if (target) {
        var panel = this.container.querySelector(target)
        if (panel && this._panels.indexOf(panel) === -1) {
          this._panels.push(panel)
        }
      }
    }, this)

    return this._triggers.length > 0
  }

  findTabByHash() {
    var hash = location.hash.slice(1)
    if (!hash) return -1
    for (var i = 0; i < this._panels.length; i++) {
      if (this._panels[i] && this._panels[i].id === hash) return i
    }
    return -1
  }

  init() {
    var initial = -1
    this._triggers.forEach(function (t, i) {
      if (t.classList.contains(this.activeTabClass)) {
        initial = i
      }
    }, this)
    if (initial === -1) initial = 0

    if (this.hashEnabled) {
      var hashTab = this.findTabByHash()
      if (hashTab !== -1) initial = hashTab
      window.addEventListener('hashchange', function () {
        var idx = this.findTabByHash()
        if (idx !== -1) this.activate(idx)
      }.bind(this))
    }

    this.container.addEventListener('click', function (e) {
      var trigger = e.target.closest(this.tabSelector)
      if (!trigger) return
      if (trigger.disabled || trigger.getAttribute('aria-disabled') === 'true') return
      var idx = this._triggers.indexOf(trigger)
      if (idx !== -1) this.activate(idx)
    }.bind(this))

    this.activate(initial)
  }

  activate(index) {
    if (index === this._activeIndex) return
    if (index < 0 || index >= this._triggers.length) return

    var oldIndex = this._activeIndex
    var oldTrigger = oldIndex >= 0 ? this._triggers[oldIndex] : null

    this._triggers.forEach(function (t) {
      t.classList.remove(this.activeTabClass)
      t.setAttribute('aria-selected', 'false')
    }, this)
    this._panels.forEach(function (p) { p.classList.remove(this.activePanelClass) }, this)

    this._triggers[index].classList.add(this.activeTabClass)
    this._triggers[index].setAttribute('aria-selected', 'true')
    if (this._panels[index]) this._panels[index].classList.add(this.activePanelClass)

    this._activeIndex = index

    if (this.hashEnabled) {
      var panel = this._panels[index]
      if (panel && panel.id) {
        history.replaceState(null, '', '#' + panel.id)
      }
    }

    if (this.onSwitch) {
      this.onSwitch(index, oldIndex, this._triggers[index], oldTrigger)
    }
  }
}

Zaiku.Tabs = ZaikuTabs

class ZaikuAccordion {
  constructor(container, opts) {
    if (typeof container === 'string') container = document.querySelector(container)
    if (!container) return
    if (container.zaiku && container.zaiku.accordionInstance) return container.zaiku.accordionInstance

    this.container = container
    var cfg = (opts && opts.accordion) || opts || {}
    this.multiple = resolveAttr(container, 'data-accordion-multiple', cfg.multiple)
    this.onOpen = cfg.onOpen
    this.onClose = cfg.onClose
    this.media = cfg.media
    this.mediaPlayers = cfg.mediaPlayers || {}

    container.zaiku = container.zaiku || {}
    container.zaiku.accordionInstance = this
    this.init()
  }

  init() {
    this.container.addEventListener('click', function (e) {
      var header = e.target.closest('.accordion-header')
      if (!header) return
      if (header.closest('.accordion-item').classList.contains('disabled')) return
      if (header.closest('[data-zaiku-accordion]') !== this.container) return
      var item = header.closest('.accordion-item')
      if (!item) return
      this.toggle(item)
    }.bind(this))
  }

  toggle(item) {
    var content = item.querySelector('.accordion-content')
    if (!content) return
    var isOpen = content.classList.contains('active')

    if (!this.multiple && !isOpen) {
      this.container.querySelectorAll('.accordion-item').forEach(function (other) {
        if (other !== item) this.close(other)
      }, this)
    }

    if (isOpen) {
      this.close(item)
    } else {
      this.open(item)
    }
  }

  open(item) {
    var content = item.querySelector('.accordion-content')
    var header = item.querySelector('.accordion-header')
    if (!content) return
    content.classList.add('active')
    content.style.display = 'block'
    if (header) header.classList.add('active')

    if (this.media) {
      content.querySelectorAll('[data-zaiku-media]').forEach(function (w) {
        if (w.querySelector('iframe')) return
        var src = w.getAttribute('data-zaiku-media')
        if (!src) return
        var embedSrc = Zaiku.parseMediaUrl(src, this.mediaPlayers)
        if (!embedSrc) return
        var iframe = document.createElement('iframe')
        iframe.setAttribute('src', embedSrc)
        iframe.setAttribute('frameborder', '0')
        iframe.setAttribute('allowfullscreen', 'true')
        iframe.setAttribute('allow', 'autoplay; encrypted-media')
        w.appendChild(iframe)
      }, this)
    }

    if (this.onOpen) this.onOpen(item, this)
  }

  close(item) {
    var content = item.querySelector('.accordion-content')
    var header = item.querySelector('.accordion-header')
    if (!content) return
    content.classList.remove('active')
    content.style.display = 'none'
    if (header) header.classList.remove('active')

    if (this.media) {
      content.querySelectorAll('[data-zaiku-media] iframe').forEach(function (f) {
        f.remove()
      })
    }

    if (this.onClose) this.onClose(item, this)
  }

  openByIndex(index) {
    var items = this.container.querySelectorAll('.accordion-item')
    if (items[index]) this.open(items[index])
  }

  closeByIndex(index) {
    var items = this.container.querySelectorAll('.accordion-item')
    if (items[index]) this.close(items[index])
  }

  toggleByIndex(index) {
    var items = this.container.querySelectorAll('.accordion-item')
    if (items[index]) this.toggle(items[index])
  }
}

class ZaikuScrub {
  constructor(container, opts) {
    if (typeof container === 'string') container = document.querySelector(container)
    if (!container) return
    if (container.zaiku && container.zaiku.scrubInstance) return container.zaiku.scrubInstance

    this.container = container
    var cfg = (opts && opts.scrub) || opts || {}

    this.step = resolveAttr(container, 'data-scrub-step', cfg.step)
    this.fineStep = resolveAttr(container, 'data-scrub-fine-step', cfg.fineStep)
    this.coarseStep = resolveAttr(container, 'data-scrub-coarse-step', cfg.coarseStep)
    this.min = resolveAttr(container, 'data-scrub-min', cfg.min)
    this.max = resolveAttr(container, 'data-scrub-max', cfg.max)
    this.decimals = resolveAttr(container, 'data-scrub-decimals', cfg.decimals)
    this.prefix = container.getAttribute('data-scrub-prefix') || ''
    this.suffix = container.getAttribute('data-scrub-suffix') || ''

    this.onInput = cfg.onInput
    this.onUpdate = cfg.onUpdate
    this.onFocus = cfg.onFocus

    this.valueDisplay = container.querySelector('.input-scrub-value')
    this.editField = container.querySelector('.input-scrub-field')
    this.hiddenInput = container.querySelector('input[type="hidden"]') || container.querySelector('input[data-scrub-hidden]')

    var initial = container.getAttribute('data-scrub-value')
    this._value = initial !== null ? parseFloat(initial) : this.min
    if (isNaN(this._value)) this._value = this.min
    this._value = Math.max(this.min, Math.min(this.max, this._round(this._value)))
    this._editMode = false
    this._savedValue = this._value
    this._dragging = false
    this._dragStartX = 0
    this._dragStartValue = 0
    this._dragMoved = false

    container.zaiku = container.zaiku || {}
    container.zaiku.scrubInstance = this

    this.init()
  }

  get value() { return this._value }
  set value(v) { this.setValue(v) }

  init() {
    this.container.addEventListener('mousedown', this._onMouseDown.bind(this))
    document.addEventListener('mousemove', this._onMouseMove.bind(this))
    document.addEventListener('mouseup', this._onMouseUp.bind(this))
    this.container.addEventListener('keydown', this._onKeyDown.bind(this))

    if (this.editField) {
      this.editField.addEventListener('blur', this._commitEdit.bind(this))
      this.editField.addEventListener('keydown', this._onEditKeyDown.bind(this))
    }

    this._render()
  }

  setValue(v, updateHidden) {
    if (updateHidden === undefined) updateHidden = true
    v = Math.max(this.min, Math.min(this.max, v))
    this._value = this._round(v)
    this._render()
    if (updateHidden) this._syncHidden()
    if (this.onInput) this.onInput(this._value, this)
  }

  _round(v) {
    var f = Math.pow(10, this.decimals)
    return Math.round(v * f) / f
  }

  _render() {
    if (this.valueDisplay) {
      this.valueDisplay.textContent = this.prefix + this._value.toFixed(this.decimals) + this.suffix
    }
  }

  _syncHidden() {
    if (this.hiddenInput) {
      this.hiddenInput.value = this._value
      var evt = document.createEvent('HTMLEvents')
      evt.initEvent('change', true, false)
      this.hiddenInput.dispatchEvent(evt)
    }
  }

  _onMouseDown(e) {
    if (this._editMode) return
    if (e.target.closest('.input-scrub-field, .input-scrub-btn')) return
    this._dragging = true
    this._dragStartX = e.clientX
    this._dragStartValue = this._value
    this._dragMoved = false
    this.container.classList.add('is-dragging')
    e.preventDefault()
  }

  _onMouseMove(e) {
    if (!this._dragging) return
    var dx = e.clientX - this._dragStartX
    var step = this.step
    if (e.altKey) step = this.fineStep
    if (e.shiftKey) step = this.coarseStep
    if (Math.abs(dx) > 2) this._dragMoved = true
    this.setValue(this._dragStartValue + dx * step)
  }

  _onMouseUp(e) {
    if (!this._dragging) return
    this._dragging = false
    this.container.classList.remove('is-dragging')
    if (this._dragMoved) {
      if (this.onUpdate) this.onUpdate(this._value, this)
    } else if (this.editField) {
      this._enterEditMode()
    }
  }

  _enterEditMode() {
    this._editMode = true
    this._savedValue = this._value
    this.container.classList.add('is-editing')
    this.editField.value = this._value.toFixed(this.decimals)
    this.editField.focus()
    this.editField.select()
    if (this.onFocus) this.onFocus(this._value, this)
  }

  _exitEditMode() {
    this._editMode = false
    this.container.classList.remove('is-editing')
  }

  _commitEdit() {
    var raw = this.editField.value.trim()
    var val = parseFloat(raw)
    if (isNaN(val)) {
      this.setValue(this._savedValue)
    } else {
      val = Math.max(this.min, Math.min(this.max, this._round(val)))
      this.setValue(val)
    }
    this._exitEditMode()
    if (this.onUpdate) this.onUpdate(this._value, this)
  }

  _revertEdit() {
    this.setValue(this._savedValue)
    this._exitEditMode()
  }

  _onKeyDown(e) {
    if (this._editMode) return
    var step = this.step
    if (e.altKey) step = this.fineStep
    if (e.shiftKey) step = this.coarseStep
    switch (e.key) {
      case 'ArrowUp': e.preventDefault(); this.setValue(this._value + step); if (this.onUpdate) this.onUpdate(this._value, this); break
      case 'ArrowDown': e.preventDefault(); this.setValue(this._value - step); if (this.onUpdate) this.onUpdate(this._value, this); break
      case 'Home': e.preventDefault(); this.setValue(this.min); if (this.onUpdate) this.onUpdate(this._value, this); break
      case 'End': e.preventDefault(); this.setValue(this.max); if (this.onUpdate) this.onUpdate(this._value, this); break
      case 'Enter':
      case ' ':
        if (this.editField) { e.preventDefault(); this._enterEditMode() }
        break
    }
  }

  _onEditKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); this._commitEdit() }
    else if (e.key === 'Escape') { e.preventDefault(); this._revertEdit() }
  }
}

Zaiku.Accordion = ZaikuAccordion

Zaiku.Scrub = ZaikuScrub

class ZaikuDropdown {
  constructor(container, opts) {
    if (typeof container === 'string') container = document.querySelector(container)
    if (!container) return
    if (container.zaiku && container.zaiku.dropdownInstance) return container.zaiku.dropdownInstance

    this.container = container
    this.toggleBtn = container.querySelector('.dropdown-toggle')
    this.menu = container.querySelector('.dropdown-menu')

    var cfg = (opts && opts.dropdown) || opts || {}
    this.onOpen = cfg.onOpen
    this.onClose = cfg.onClose
    this.onSelect = cfg.onSelect
    this.autoPlacement = cfg.autoPlacement !== false

    var submenuCfg = cfg.submenu || {}
    this.submenuTrigger = submenuCfg.trigger || 'hover'
    this.submenuDelay = submenuCfg.delay || 300

    container.zaiku = container.zaiku || {}
    container.zaiku.dropdownInstance = this

    this._init()
  }

  _init() {
    if (this.toggleBtn) {
      this.toggleBtn.addEventListener('click', function (e) {
        e.preventDefault()
        this.toggle()
      }.bind(this))
    }

    document.addEventListener('click', function (e) {
      if (this.menu && this.menu.contains(e.target)) return
      if (!this.container.contains(e.target)) this.close()
    }.bind(this))

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (!this.menu || !this.menu.contains(document.activeElement)) {
          var openSubmenus = this.menu ? this.menu.querySelectorAll('.dropdown-submenu.show') : []
          if (openSubmenus.length > 0) {
            openSubmenus[openSubmenus.length - 1].classList.remove('show')
          } else {
            this.close()
          }
        }
      }
    }.bind(this))

    if (this.menu) {
      this.menu.addEventListener('click', function (e) {
        var item = e.target.closest('.dropdown-item')
        if (!item) return
        if (e.target.closest('input, textarea, select, [contenteditable]')) return
        if (item.classList.contains('dropdown-submenu')) return
        var sel = this.onSelect ? this.onSelect(item, this) : true
        if (sel !== false && !item.hasAttribute('data-dropdown-stay-open')) {
          this.close()
        }
      }.bind(this))

      this._initSubmenus()
    }
  }

  _initSubmenus() {
    if (!this.menu) return
    var items = this.menu.querySelectorAll('.dropdown-submenu')
    var self = this

    items.forEach(function (item) {
      var nestedMenu = item.querySelector('.dropdown-menu')
      if (!nestedMenu) return

      if (self.submenuTrigger === 'hover') {
        var timer
        item.addEventListener('mouseenter', function () {
          clearTimeout(item._submenuTimer)
          self._closeSiblingSubmenus(item)
          item.classList.add('show')
          self._positionSubmenu(item, nestedMenu)
        })
        item.addEventListener('mouseleave', function () {
          item._submenuTimer = setTimeout(function () {
            item.classList.remove('show')
          }, self.submenuDelay)
        })
        nestedMenu.addEventListener('mouseenter', function () {
          clearTimeout(item._submenuTimer)
        })
        nestedMenu.addEventListener('mouseleave', function () {
          item._submenuTimer = setTimeout(function () {
            item.classList.remove('show')
          }, self.submenuDelay)
        })
      } else {
        item.addEventListener('click', function (e) {
          e.stopPropagation()
          self._closeSiblingSubmenus(item)
          item.classList.toggle('show')
          self._positionSubmenu(item, nestedMenu)
        })
      }
    })
  }

  _closeSiblingSubmenus(item) {
    var parent = item.parentNode
    if (!parent) return
    for (var i = 0; i < parent.children.length; i++) {
      var child = parent.children[i]
      if (child !== item && child.classList.contains('dropdown-submenu') && child.classList.contains('show')) {
        child.classList.remove('show')
      }
    }
  }

  _positionSubmenu(item, nestedMenu) {
    if (!this.autoPlacement) return

    void nestedMenu.offsetHeight

    var children = nestedMenu.children
    if (children.length === 0) return

    for (var i = 0; i < children.length; i++) void children[i].offsetHeight

    var firstRect = children[0].getBoundingClientRect()
    var lastRect = children[children.length - 1].getBoundingClientRect()
    var contentHeight = lastRect.bottom - firstRect.top

    var cs = getComputedStyle(nestedMenu)
    contentHeight += parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom)

    nestedMenu.style.height = contentHeight + 'px'

    var ib = item.getBoundingClientRect()
    var spaceBelow = window.innerHeight - ib.bottom
    var subWidth = nestedMenu.offsetWidth

    if (ib.right + subWidth > window.innerWidth) {
      item.classList.add('dropstart')
    } else {
      item.classList.remove('dropstart')
    }

    if (spaceBelow < contentHeight) {
      var spaceAbove = ib.top
      if (spaceAbove >= contentHeight) {
        nestedMenu.style.top = 'auto'
        nestedMenu.style.bottom = '0'
      } else {
        nestedMenu.style.top = ''
        nestedMenu.style.bottom = ''
      }
    } else {
      nestedMenu.style.top = ''
      nestedMenu.style.bottom = ''
    }
  }

  _closeAllSubmenus() {
    if (this.menu) {
      this.menu.querySelectorAll('.dropdown-submenu.show').forEach(function (item) {
        item.classList.remove('show')
        var m = item.querySelector('.dropdown-menu')
        if (m) {
          m.style.height = ''
          m.style.top = ''
          m.style.bottom = ''
        }
      })
    }
  }

  toggle() {
    if (this.container.classList.contains('show')) {
      this.close()
    } else {
      this.open()
    }
  }

  open() {
    document.querySelectorAll('.dropdown.show').forEach(function (d) {
      if (d.zaiku && d.zaiku.dropdownInstance && d !== this.container) {
        d.zaiku.dropdownInstance.close()
      }
    }, this)
    this.container.classList.add('show')

    if (this.autoPlacement && this.menu) {
      var menuRect = this.menu.getBoundingClientRect()
      if (menuRect.bottom > window.innerHeight) {
        this.container.classList.add('dropup')
      } else {
        this.container.classList.remove('dropup')
      }
    }

    if (this.onOpen) this.onOpen(this)
  }

  close() {
    this.container.classList.remove('show', 'dropup')
    this._closeAllSubmenus()
    if (this.onClose) this.onClose(this)
  }
}

Zaiku.Dropdown = ZaikuDropdown

ZaikuHoverSliderEffects = {
  fade: {
    leave: function (el) {
      gsap.to(el, { opacity: 0, scale: 0.95, duration: 0.2, ease: 'power2.in' })
    },
    appear: function (el, dir, done) {
      gsap.fromTo(el, { opacity: 0, scale: 1.05 }, { opacity: 1, scale: 1, duration: 0.25, ease: 'power2.out', onComplete: done })
    }
  },
  slide: {
    leave: function (el, dir) {
      gsap.to(el, { x: dir > 0 ? -30 : 30, opacity: 0, duration: 0.2, ease: 'power2.in' })
    },
    appear: function (el, dir, done) {
      gsap.fromTo(el, { x: dir > 0 ? 30 : -30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.25, ease: 'power2.out', onComplete: done })
    }
  },
  kenburns: {
    leave: function (el) {
      gsap.set(el, { opacity: 0 })
    },
    appear: function (el, dir, done) {
      gsap.fromTo(el, { opacity: 0, scale: 1.3 }, { opacity: 1, scale: 1.15, duration: 0.3, ease: 'power2.out', onComplete: done })
    }
  },
  blur: {
    leave: function (el) {
      gsap.to(el, { filter: 'blur(8px)', opacity: 0, duration: 0.2, ease: 'power2.in' })
    },
    appear: function (el, dir, done) {
      gsap.fromTo(el, { filter: 'blur(8px)', opacity: 0 }, { filter: 'blur(0px)', opacity: 1, duration: 0.25, ease: 'power2.out', onComplete: done })
    }
  },
  zoom: {
    leave: function (el) {
      gsap.to(el, { scale: 0.5, opacity: 0, duration: 0.2, ease: 'power2.in' })
    },
    appear: function (el, dir, done) {
      gsap.fromTo(el, { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)', onComplete: done })
    }
  },
  rotate: {
    leave: function (el, dir) {
      gsap.to(el, { rotation: dir > 0 ? -15 : 15, opacity: 0, duration: 0.2, ease: 'power2.in' })
    },
    appear: function (el, dir, done) {
      gsap.fromTo(el, { rotation: dir > 0 ? 15 : -15, opacity: 0 }, { rotation: 0, opacity: 1, duration: 0.25, ease: 'power2.out', onComplete: done })
    }
  },
  skew: {
    leave: function (el, dir) {
      gsap.to(el, { skewX: dir > 0 ? 20 : -20, opacity: 0, duration: 0.2, ease: 'power2.in' })
    },
    appear: function (el, dir, done) {
      gsap.fromTo(el, { skewX: dir > 0 ? -20 : 20, opacity: 0 }, { skewX: 0, opacity: 1, duration: 0.25, ease: 'power2.out', onComplete: done })
    }
  }
}

class ZaikuHoverSlider {
  constructor(container, opts) {
    if (typeof container === 'string') container = document.querySelector(container)
    if (!container) return
    if (container.zaiku && container.zaiku.hoverSliderInstance) return container.zaiku.hoverSliderInstance

    this.container = container
    var cfg = (opts && opts.hoverSlider) || opts || {}

    this.speed = resolveAttr(container, 'data-speed', cfg.speed)
    this.speedBoost = resolveAttr(container, 'data-speed-boost', cfg.speedIncreaseOnMove)
    this.loop = resolveAttr(container, 'data-loop', cfg.loop !== false)
    this.resetOnLeave = resolveAttr(container, 'data-reset-on-leave', cfg.resetOnLeave || false)
    this.moveOnly = resolveAttr(container, 'data-move-only', cfg.moveOnly || false)
    this.forwardOnly = resolveAttr(container, 'data-forward-only', cfg.forwardOnly || false)
    this.delay = resolveAttr(container, 'data-delay', cfg.delay || 0)
    this.onSlide = cfg.onSlide
    this.onInit = cfg.onInit
    this.onStart = cfg.onStart
    this.onFinish = cfg.onFinish
    this.effects = cfg.effects
    var effectAttr = container.getAttribute('data-effect')
    if (effectAttr !== null && effectAttr !== '') this.effects = effectAttr
    this._hasGSAP = typeof gsap !== 'undefined'
    this.showCounter = resolveAttr(container, 'data-show-counter', cfg.showCounter || false)
    this.showPagination = resolveAttr(container, 'data-show-pagination', cfg.showPagination || false)

    var inline = container.getAttribute('data-zaiku-hover-slider-opts')
    if (inline) {
      try { inline = JSON.parse(inline) } catch (e) { inline = null }
      if (inline) {
        for (var key in inline) {
          if (inline.hasOwnProperty(key)) this[key] = inline[key]
        }
      }
    }

    this.slides = Array.from(container.querySelectorAll('.card-slide, [data-slide]'))
    if (this.slides.length === 0) {
      var images = container.getAttribute('data-images')
      if (images) {
        try { images = JSON.parse(images) } catch (e) { images = null }
      }
      if (images && images.length) {
        var imgTop = container.querySelector('.card-img-top')
        if (!imgTop) {
          imgTop = document.createElement('div')
          imgTop.className = 'card-img-top'
          container.insertBefore(imgTop, container.firstChild)
        }
        images.forEach(function (url) {
          var slide = document.createElement('div')
          slide.className = 'card-slide'
          slide.style.backgroundImage = 'url(' + url + ')'
          imgTop.appendChild(slide)
          this.slides.push(slide)
        }, this)
      }
    }

    this.total = this.slides.length
    if (this.total < 2) return

    for (var i = 0; i < this.total; i++) {
      var s = this.slides[i]
      if (s.getAttribute('data-src') && !s.style.backgroundImage) {
        this._loadSlide(s, s.getAttribute('data-src'))
      }
    }

    this.current = 0
    this.isHovering = false
    this.velocity = 0
    this.direction = 1
    this.accumulator = 0
    this.lastX = 0
    this.lastMoveTime = 0
    this.rafId = null

    container.zaiku = container.zaiku || {}
    container.zaiku.hoverSliderInstance = this

    this._init()
    if (this.onInit) this.onInit(this)
  }

  _init() {
    var self = this
    this.slides[0].classList.add('active')

    if (this._hasGSAP && this.effects) {
      for (var i = 0; i < this.total; i++) {
        gsap.set(this.slides[i], { opacity: i === 0 ? 1 : 0, scale: 1, x: 0 })
      }
      if (this._effectType() === 'kenburns') {
        gsap.to(this.slides[0], { scale: 1.2, duration: 8, ease: 'none' })
      }
    }

    if (this.showCounter) this._createCounter()
    if (this.showPagination) this._createPagination()

    this.container.addEventListener('mouseenter', function (e) {
      self.isHovering = true
      self.velocity = 0
      self.lastX = e.clientX
      self.lastMoveTime = performance.now()
      self.accumulator = 0
      self._pixelAccum = 0
      if (!self.moveOnly && !self.rafId) self._tick(performance.now())
      if (self.onStart) self.onStart(self)
    })

    this.container.addEventListener('mousemove', function (e) {
      if (!self.isHovering) return
      var now = performance.now()
      var dt = now - self.lastMoveTime
      var dx = e.clientX - self.lastX
      if (dt > 0) {
        self.velocity = Math.abs(dx) / dt
        self.direction = self.forwardOnly ? 1 : (dx > 0 ? 1 : (dx < 0 ? -1 : self.direction))
      }
      self.lastX = e.clientX
      self.lastMoveTime = now

      if (self.moveOnly) {
        var now = performance.now()
        if (self.delay && self._lastAdvanceTime && now - self._lastAdvanceTime < self.delay) return
        self._pixelAccum += Math.abs(dx)
        if (self._pixelAccum >= 25) {
          self._pixelAccum = 0
          self._lastAdvanceTime = now
          var next = self.current + (self.forwardOnly ? 1 : (dx > 0 ? 1 : (dx < 0 ? -1 : self.direction)))
          if (self.loop) {
            next = ((next % self.total) + self.total) % self.total
          } else {
            next = Math.max(0, Math.min(next, self.total - 1))
          }
          if (next !== self.current) self.gotoSlide(next)
        }
      }
    })

    this.container.addEventListener('mouseleave', function () {
      self.isHovering = false
      self.velocity = 0
      self._pixelAccum = 0
      if (self.rafId) {
        cancelAnimationFrame(self.rafId)
        self.rafId = null
      }
      if (self.resetOnLeave) self.gotoSlide(0)
      if (self.onFinish) self.onFinish(self)
    })
  }

  _createCounter() {
    var imgTop = this.container.querySelector('.card-img-top')
    if (!imgTop) return
    this._counterEl = document.createElement('span')
    var pos = 'bottom'
    if (this.container.hasAttribute('data-counter-top')) pos = 'top'
    if (this.container.hasAttribute('data-counter-bottom')) pos = 'bottom'
    this._counterEl.className = 'card-slider-counter ' + pos
    this._counterEl.textContent = '1/' + this.total
    imgTop.appendChild(this._counterEl)
  }

  _createPagination() {
    var imgTop = this.container.querySelector('.card-img-top')
    if (!imgTop) return
    var wrap = document.createElement('div')
    var pos = 'top'
    if (this.container.hasAttribute('data-pagination-top')) pos = 'top'
    if (this.container.hasAttribute('data-pagination-bottom')) pos = 'bottom'
    wrap.className = 'card-slider-pagination ' + pos
    this._pagItems = []
    for (var i = 0; i < this.total; i++) {
      var item = document.createElement('span')
      item.className = 'card-slider-pagination-item' + (i === 0 ? ' active' : '')
      wrap.appendChild(item)
      this._pagItems.push(item)
    }
    imgTop.appendChild(wrap)
  }

  _tick(timestamp) {
    var self = this
    if (this.isHovering && this.total > 1) {
      var dt = Math.min(timestamp - (this._lastTick || timestamp), 50)
      this._lastTick = timestamp

      var adjustedInterval = this.speed / (1 + this.velocity * this.speedBoost)
      this.accumulator += dt

      if (this.accumulator >= adjustedInterval) {
        this.accumulator = 0
        var next = this.current + this.direction
        if (this.loop) {
          next = ((next % this.total) + this.total) % this.total
        } else {
          next = Math.max(0, Math.min(next, this.total - 1))
        }
        if (next !== this.current) this.gotoSlide(next)
      }
    }
    this.rafId = requestAnimationFrame(function (t) { self._tick(t) })
  }

  gotoSlide(index) {
    var prev = this.current
    var proceed = true
    if (this.onSlide) proceed = this.onSlide(index, this.slides[index], prev, this.slides[prev], this)
    if (proceed !== false) {
      if (this._hasGSAP && this.effects) {
        this._animateSlide(index, prev)
      } else {
        this.slides[prev].classList.remove('active')
        this.current = index
        this.slides[this.current].classList.add('active')
        this._updateUI()
      }
    }
  }

  _effectType() {
    return typeof this.effects === 'string' ? this.effects : (this.effects && this.effects.type) || null
  }

  _animateSlide(to, from) {
    var self = this
    var outEl = this.slides[from]
    var inEl = this.slides[to]
    var dir = this.direction
    var type = this._effectType()
    var fx = ZaikuHoverSliderEffects[type] || ZaikuHoverSliderEffects.fade

    gsap.killTweensOf([outEl, inEl])

    if (type === 'kenburns') gsap.set(outEl, { scale: 1 })
    gsap.set(inEl, { opacity: 0, scale: type === 'kenburns' ? 1.3 : 1, x: 0 })

    var done = function () {
      self.current = to
      self._updateUI()
      if (type === 'kenburns') gsap.to(inEl, { scale: 1.2, duration: 8, ease: 'none' })
    }

    if (outEl !== inEl) {
      fx.leave(outEl, dir)
    }
    fx.appear(inEl, dir, done)
  }

  _updateUI() {
    if (this._counterEl) this._counterEl.textContent = (this.current + 1) + '/' + this.total
    if (this._pagItems) {
      for (var i = 0; i < this._pagItems.length; i++) {
        this._pagItems[i].classList.toggle('active', i === this.current)
      }
    }
  }

  next() {
    var next = this.current + 1
    if (this.loop) next = next % this.total
    else next = Math.min(next, this.total - 1)
    this.gotoSlide(next)
  }

  prev() {
    var prev = this.current - 1
    if (this.loop) prev = ((prev % this.total) + this.total) % this.total
    else prev = Math.max(0, prev)
    this.gotoSlide(prev)
  }

  start() {
    this.isHovering = true
    this.velocity = 0
    this.accumulator = 0
    if (!this.rafId) this._tick(performance.now())
    if (this.onStart) this.onStart(this)
  }

  stop() {
    this.isHovering = false
    this.velocity = 0
    if (this.onFinish) this.onFinish(this)
  }

  setOptions(opts) {
    if (!opts) return this
    var keys = ['speed', 'speedBoost', 'loop', 'resetOnLeave', 'moveOnly', 'forwardOnly', 'delay', 'effects', 'showCounter', 'showPagination', 'onSlide', 'onStart', 'onFinish']
    for (var i = 0; i < keys.length; i++) {
      if (opts[keys[i]] !== undefined) this[keys[i]] = opts[keys[i]]
    }
    return this
  }

  _loadSlide(el, src) {
    if (!src) return
    var img = new Image()
    img.onload = function () {
      el.style.backgroundImage = 'url(' + src + ')'
    }
    img.src = src
  }

  destroy() {
    this.stop()
    if (this._hasGSAP && this.effects) gsap.killTweensOf(this.slides)
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }
}

Zaiku.HoverSlider = ZaikuHoverSlider

class ZaikuLazyLoader {
  constructor(opts) {
    var cfg = (opts && opts.lazyLoader) || opts || {}

    this.selector = cfg.selector || '[data-zaiku-lazy]'
    this.srcAttr = cfg.srcAttr || 'data-src'
    this.srcsetAttr = cfg.srcsetAttr || 'data-srcset'
    this.rootMargin = cfg.rootMargin || '200px'
    this.threshold = cfg.threshold || 0
    this.loadedClass = cfg.loadedClass || 'lazy-loaded'
    this.loadingContent = cfg.loadingContent || null
    this.onLoad = cfg.onLoad
    this._observer = null

    this._init()
  }

  _init() {
    var self = this
    this._observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) self._load(entry.target)
      })
    }, {
      rootMargin: this.rootMargin,
      threshold: this.threshold
    })

    document.querySelectorAll(this.selector).forEach(function (el) {
      self._add(el)
    })

    if (typeof MutationObserver !== 'undefined') {
      this._mo = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          mutation.addedNodes.forEach(function (node) {
            if (node.nodeType !== 1) return
            if (node.matches && node.matches(self.selector)) self._add(node)
            if (node.querySelectorAll) {
              node.querySelectorAll(self.selector).forEach(function (el) { self._add(el) })
            }
          })
        })
      })
      this._mo.observe(document.body, { childList: true, subtree: true })
    }
  }

  _add(el) {
    if (el._lazyLoaded) return
    el._lazyLoaded = true
    this._observer.observe(el)

    el.classList.add('lazy-loading')
    var wasStatic = getComputedStyle(el).position === 'static'
    if (wasStatic) el.style.position = 'relative'

    var indicator = document.createElement('div')
    indicator.className = 'lazy-loading-indicator'
    var custom = el.getAttribute('data-lazy-loading')
    if (custom) {
      indicator.innerHTML = custom
    } else if (this.loadingContent) {
      indicator.innerHTML = this.loadingContent
    } else {
      var spinner = document.createElement('span')
      spinner.className = 'spinner spinner-sm'
      indicator.appendChild(spinner)
    }
    el.appendChild(indicator)
  }

  _load(el) {
    var self = this
    var src = el.getAttribute(this.srcAttr)
    if (!src) return

    this._observer.unobserve(el)

    var img = new Image()
    var srcset = el.getAttribute(this.srcsetAttr)
    if (srcset) img.srcset = srcset
    img.onload = function () {
      if (el.tagName === 'IMG') {
        el.src = src
        var ss = el.getAttribute(self.srcsetAttr)
        if (ss) el.srcset = ss
      } else {
        el.style.backgroundImage = 'url(' + src + ')'
      }
      self._cleanup(el)
      if (self.onLoad) self.onLoad(el, src)
    }
    img.onerror = function () {
      self._cleanup(el)
      el.classList.add(self.loadedClass + '-error')
    }
    img.src = src
  }

  _cleanup(el) {
    var indicator = el.querySelector('.lazy-loading-indicator')
    if (indicator) indicator.remove()
    el.classList.remove('lazy-loading')
    el.classList.add(this.loadedClass)
  }

  observe(el) {
    if (this._observer) this._add(el)
  }

  destroy() {
    if (this._observer) this._observer.disconnect()
    if (this._mo) this._mo.disconnect()
  }
}

Zaiku.LazyLoader = ZaikuLazyLoader

class ZaikuElasticCards {
  constructor(container, opts) {
    if (typeof container === 'string') container = document.querySelector(container)
    if (!container) return
    if (container.zaiku && container.zaiku.elasticInstance) return container.zaiku.elasticInstance

    var cfg = (opts && opts.elasticCards) || opts || {}

    this.container = container
    this.expandRatio = resolveAttr(container, 'data-expand-ratio', cfg.expandRatio)
    this.collapseRatio = resolveAttr(container, 'data-collapse-ratio', cfg.collapseRatio)
    this.effects = resolveAttr(container, 'data-effect', cfg.effects) || null
    this.onEnter = cfg.onEnter
    this.onLeave = cfg.onLeave
    this.onExpand = cfg.onExpand
    this.onShrink = cfg.onShrink
    this._cards = Array.from(container.children)
    this._active = -1

    if (this._cards.length < 2) return

    container.zaiku = container.zaiku || {}
    container.zaiku.elasticInstance = this

    this._init()
  }

  _init() {
    var self = this
    this._resize = function () { self._setEqual() }

    this.container.addEventListener('mouseenter', function () {
      if (self.onEnter) self.onEnter(self)
      if (self.effects && typeof gsap !== 'undefined') {
        self.container.classList.add('no-transition')
      }
    })

    this._cards.forEach(function (card, i) {
      card.addEventListener('mouseenter', function () { self._hover(i) })
    })

    this.container.addEventListener('mouseleave', function () {
      if (self.onLeave) self.onLeave(self)
      self._setEqual()
    })

    window.addEventListener('resize', this._resize)
    this._setEqual()
  }

  _setEqual() {
    var prev = this._active
    this._active = -1
    var total = this._cards.length
    var gap = this._getGap()
    var each = (this.container.clientWidth - gap * (total - 1)) / total

    if (this.effects && typeof gsap !== 'undefined') {
      gsap.killTweensOf(this._cards)
      gsap.to(this._cards, { width: each, duration: 0.3, ease: 'power2.out' })
      this.container.classList.remove('no-transition')
    } else {
      for (var i = 0; i < total; i++) {
        this._cards[i].style.width = each + 'px'
      }
    }
    if (prev >= 0 && this.onShrink) {
      this.onShrink(this._cards[prev], prev, this)
      if (prev > 0) this.onShrink(this._cards[prev - 1], prev - 1, this)
      if (prev < total - 1) this.onShrink(this._cards[prev + 1], prev + 1, this)
    }
  }

  _hover(index) {
    if (index === this._active) return
    var prev = this._active
    this._active = index

    var total = this._cards.length
    var gap = this._getGap()
    var avail = this.container.clientWidth - gap * (total - 1)

    var weights = []
    var sum = 0
    for (var i = 0; i < total; i++) {
      var w
      if (i === index) {
        w = this.expandRatio
      } else {
        var dist = Math.abs(i - index)
        w = this.collapseRatio + (1 - this.collapseRatio) * (1 - 1 / (dist + 1))
      }
      weights[i] = w
      sum += w
    }

    if (this.effects && typeof gsap !== 'undefined') {
      gsap.killTweensOf(this._cards)
      for (var i = 0; i < total; i++) {
        gsap.to(this._cards[i], { width: avail * weights[i] / sum, duration: 0.4, ease: 'back.out(1.7)' })
      }
    } else {
      for (var i = 0; i < total; i++) {
        this._cards[i].style.width = (avail * weights[i] / sum) + 'px'
      }
    }

    if (this.onExpand) this.onExpand(this._cards[index], index, this)
    if (this.onShrink) {
      for (var i = 0; i < total; i++) {
        if (i !== index) this.onShrink(this._cards[i], i, this)
      }
    }
  }

  _getGap() {
    var style = getComputedStyle(this.container)
    var g = style.gap || style.columnGap
    if (g) {
      var m = parseFloat(g)
      return isNaN(m) ? 0 : m
    }
    return 0
  }

  destroy() {
    window.removeEventListener('resize', this._resize)
    for (var i = 0; i < this._cards.length; i++) {
      this._cards[i].style.width = ''
    }
  }
}

class ZaikuSlider {
  constructor(container, opts) {
    if (typeof container === 'string') container = document.querySelector(container)
    if (!container) return
    if (container.zaiku && container.zaiku.sliderInstance) return container.zaiku.sliderInstance

    this.container = container

    var cfg = (opts && opts.slider) || opts || {}
    var D = { loop: false, autoPlay: false, interval: 3000, showControls: false, showPagination: false, slidesPerView: 1, gap: 0, draggable: false, breakpoints: null, sensitivitySwipe: 50, pauseOnHover: true, showCounter: false, direction: 'horizontal', timerStyle: 'bar', timerSize: 20, timerPosition: 'tr', timerStroke: 3 }

    this.loop = resolveAttr(container, 'data-loop', cfg.loop, 'bool')
    if (this.loop === undefined) this.loop = D.loop
    this.autoPlay = resolveAttr(container, 'data-autoplay', cfg.autoPlay, 'bool')
    if (this.autoPlay === undefined) this.autoPlay = D.autoPlay
    this.interval = resolveAttr(container, 'data-interval', cfg.interval, 'number')
    if (this.interval === undefined) this.interval = D.interval
    this.showControls = resolveAttr(container, 'data-show-controls', cfg.showControls, 'bool')
    if (this.showControls === undefined) this.showControls = D.showControls
    this.showPagination = resolveAttr(container, 'data-show-pagination', cfg.showPagination, 'bool')
    if (this.showPagination === undefined) this.showPagination = D.showPagination
    this.slidesPerView = resolveAttr(container, 'data-slides-per-view', cfg.slidesPerView, 'number')
    if (this.slidesPerView === undefined || this.slidesPerView < 1) this.slidesPerView = D.slidesPerView
    this.gap = resolveAttr(container, 'data-gap', cfg.gap, 'number')
    if (this.gap === undefined) this.gap = D.gap
    this.draggable = resolveAttr(container, 'data-draggable', cfg.draggable, 'bool')
    if (this.draggable === undefined) this.draggable = D.draggable
    this.breakpoints = resolveAttr(container, 'data-breakpoints', cfg.breakpoints)
    if (this.breakpoints === undefined) this.breakpoints = D.breakpoints
    this.sensitivitySwipe = resolveAttr(container, 'data-sensitivity-swipe', cfg.sensitivitySwipe, 'number')
    if (this.sensitivitySwipe === undefined || this.sensitivitySwipe < 1) this.sensitivitySwipe = D.sensitivitySwipe
    this.pauseOnHover = resolveAttr(container, 'data-pause-on-hover', cfg.pauseOnHover, 'bool')
    if (this.pauseOnHover === undefined) this.pauseOnHover = D.pauseOnHover
    this.showCounter = resolveAttr(container, 'data-show-counter', cfg.showCounter, 'bool')
    if (this.showCounter === undefined) this.showCounter = D.showCounter
    this.direction = resolveAttr(container, 'data-direction', cfg.direction)
    if (!this.direction) this.direction = D.direction
    this.timerStyle = resolveAttr(container, 'data-timer-style', cfg.timerStyle)
    if (!this.timerStyle) this.timerStyle = D.timerStyle
    this.timerSize = resolveAttr(container, 'data-timer-size', cfg.timerSize, 'number')
    if (!this.timerSize || this.timerSize < 12) this.timerSize = D.timerSize
    this.timerPosition = resolveAttr(container, 'data-timer-position', cfg.timerPosition)
    if (!this.timerPosition) this.timerPosition = D.timerPosition
    this.timerStroke = resolveAttr(container, 'data-timer-stroke', cfg.timerStroke, 'number')
    if (!this.timerStroke || this.timerStroke < 1) this.timerStroke = D.timerStroke
    this._axis = this.direction === 'vertical' ? { pos: 'y', client: 'clientY', sizeProp: 'offsetHeight', re: /translateY\(([-\d.]+)px\)/, gsapKey: 'y' } : { pos: 'x', client: 'clientX', sizeProp: 'offsetWidth', re: /translateX\(([-\d.]+)px\)/, gsapKey: 'x' }
    this.onInit = cfg.onInit
    this.onSlide = cfg.onSlide
    this.onDestroy = cfg.onDestroy
    this.onStart = cfg.onStart
    this.onDrag = cfg.onDrag
    this.onSwipe = cfg.onSwipe
    this.onEnd = cfg.onEnd
    this.onCancel = cfg.onCancel

    this._hasGSAP = typeof gsap !== 'undefined'
    this._current = 0
    this._autoTimer = null
    this._destroyed = false
    this._resizeTimer = null
    this._wasPlaying = false
    this._timerPausedWidth = 0
    this._currentTranslate = 0

    container.zaiku = container.zaiku || {}
    container.zaiku.sliderInstance = this

    this._init()
  }

  _init() {
    this._buildTrack()
    this._slides = Array.from(this._track.children).filter(function (s) {
      return s.classList && !s.classList.contains('zaiku-slider-btn') && !s.classList.contains('zaiku-slider-pagination')
    })
    if (this._slides.length === 0) return

    this._applyBreakpoints()
    this._updateSlideSizes()

    if (this.showControls) this._buildControls()
    if (this.showPagination) this._buildPagination()
    if (this.draggable) this._initDrag()
    if (this.pauseOnHover) this._initPauseOnHover()
    if (this.showCounter) this._buildCounter()

    this._onResize = this._debouncedResize.bind(this)
    window.addEventListener('resize', this._onResize)

    this.goTo(0, false)

    if (this.autoPlay) this.start()
    if (this.onInit) this.onInit(this)
  }

  _buildTrack() {
    this._track = this.container.querySelector('.zaiku-slider-track')
    if (!this._track) {
      this._track = document.createElement('div')
      this._track.className = 'zaiku-slider-track'
      var slides = this.container.querySelectorAll(':scope > .zaiku-slider-slide, :scope > [data-slide]')
      if (slides.length > 0) {
        slides.forEach(function (s) { this._track.appendChild(s) }, this)
        this.container.appendChild(this._track)
      }
    }
  }

  _updateSlideSizes() {
    var containerSize = this.container[this._axis.sizeProp]
    var spv = this._slidesPerView || this.slidesPerView
    var slideSize = (containerSize - this.gap * (spv - 1)) / spv

    for (var i = 0; i < this._slides.length; i++) {
      this._slides[i].style.flex = '0 0 ' + slideSize + 'px'
    }
    this._track.style.gap = this.gap + 'px'
    this._track.classList.toggle('vertical', this.direction === 'vertical')
    this._slideSize = slideSize
    this._slideStep = slideSize + this.gap
  }

  _applyBreakpoints() {
    this._slidesPerView = this.slidesPerView
    if (!this.breakpoints) return
    var bps = typeof this.breakpoints === 'string' ? JSON.parse(this.breakpoints) : this.breakpoints
    var keys = Object.keys(bps).map(Number).sort(function (a, b) { return b - a })
    var w = window.innerWidth
    for (var i = 0; i < keys.length; i++) {
      if (w >= keys[i]) {
        this._slidesPerView = bps[keys[i]].slidesPerView || this.slidesPerView
        return
      }
    }
  }

  _debouncedResize() {
    clearTimeout(this._resizeTimer)
    var self = this
    this._resizeTimer = setTimeout(function () {
      if (self._destroyed) return
      self._applyBreakpoints()
      self._updateSlideSizes()
      self.goTo(self._current, false)
    }, 150)
  }

  _buildControls() {
    if (this.container.querySelector('.zaiku-slider-btn')) return

    var isVert = this.direction === 'vertical'
    var prev = document.createElement('button')
    prev.className = 'zaiku-slider-btn zaiku-slider-btn-prev' + (isVert ? ' vertical' : '')
    prev.setAttribute('aria-label', 'Previous slide')
    prev.innerHTML = isVert ? '∧' : '‹'
    var self = this
    prev.addEventListener('click', function () { self.prev() })

    var next = document.createElement('button')
    next.className = 'zaiku-slider-btn zaiku-slider-btn-next' + (isVert ? ' vertical' : '')
    next.setAttribute('aria-label', 'Next slide')
    next.innerHTML = isVert ? '∨' : '›'
    next.addEventListener('click', function () { self.next() })

    this.container.appendChild(prev)
    this.container.appendChild(next)
  }

  _buildPagination() {
    if (this.container.querySelector('.zaiku-slider-pagination')) return

    var el = document.createElement('div')
    el.className = 'zaiku-slider-pagination' + (this.direction === 'vertical' ? ' vertical' : '')
    if (this.direction === 'vertical' && this.container.hasAttribute('data-pagination-left')) {
      el.classList.add('left')
    }
    var self = this
    var spv = this._slidesPerView || this.slidesPerView
    var count = Math.max(1, this._slides.length - spv + 1)

    for (var i = 0; i < count; i++) {
      var dot = document.createElement('button')
      dot.className = 'zaiku-slider-pagination-item'
      dot.setAttribute('aria-label', 'Go to slide ' + (i + 1))
      ;(function (idx) {
        dot.addEventListener('click', function () { self.goTo(idx) })
      }(i))
      el.appendChild(dot)
    }

    this.container.appendChild(el)
    this._paginationEl = el
  }

  _buildCounter() {
    if (this.container.querySelector('.zaiku-slider-counter')) return
    var el = document.createElement('span')
    var pos = 'bottom'
    if (this.container.hasAttribute('data-counter-top')) pos = 'top'
    if (this.container.hasAttribute('data-counter-bottom')) pos = 'bottom'
    el.className = 'zaiku-slider-counter ' + pos
    this.container.appendChild(el)
    this._counterEl = el
  }

  _updatePagination() {
    if (!this._paginationEl) return
    var dots = this._paginationEl.children
    for (var i = 0; i < dots.length; i++) {
      dots[i].classList.toggle('active', i === this._current)
    }
    if (this._counterEl) {
      this._counterEl.textContent = (this._current + 1) + '/' + this._slides.length
    }
  }

  _initDrag() {
    var self = this
    var startPos = 0
    var startTranslate = 0
    var dragging = false
    var track = this._track

    function getMaxTranslate() {
      var spv = self._slidesPerView || self.slidesPerView
      return -((self._slides.length - spv) * self._slideStep)
    }

    function getPointerPos(e) {
      return self._axis.client === 'clientY'
        ? (e.clientY || (e.touches && e.touches[0].clientY))
        : (e.clientX || (e.touches && e.touches[0].clientX))
    }

    function onPointerDown(e) {
      if (self._slides.length <= 1) return
      dragging = true
      e.preventDefault()
      self.stop()
      if (self._hasGSAP) gsap.killTweensOf(track)
      startPos = getPointerPos(e)
      startTranslate = self._getTranslate()
      track.classList.add('no-transition')
      document.addEventListener('pointermove', onPointerMove)
      document.addEventListener('pointerup', onPointerUp)
      document.addEventListener('touchmove', onPointerMove, { passive: false })
      document.addEventListener('touchend', onPointerUp)
      if (self.onStart) self.onStart(self)
    }

    function onPointerMove(e) {
      if (!dragging) return
      e.preventDefault()
      var pos = getPointerPos(e)
      var delta = pos - startPos
      var maxT = getMaxTranslate()
      var newPos = startTranslate + delta

      if (!self.loop) {
        if (newPos > 0) {
          newPos = newPos * 0.3
        } else if (newPos < maxT) {
          newPos = maxT + (newPos - maxT) * 0.3
        }
      }
      track.style.transform = self._axis.pos === 'x' ? 'translateX(' + newPos + 'px)' : 'translateY(' + newPos + 'px)'
      if (self.onDrag) self.onDrag(delta, self)
    }

    function onPointerUp(e) {
      if (!dragging) return
      dragging = false
      track.classList.remove('no-transition')

      var finalClientPos = e.changedTouches ? e.changedTouches[0][self._axis.client === 'clientY' ? 'clientY' : 'clientX'] : e[self._axis.client === 'clientY' ? 'clientY' : 'clientX']

      document.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('pointerup', onPointerUp)
      document.removeEventListener('touchmove', onPointerMove)
      document.removeEventListener('touchend', onPointerUp)

      var delta = finalClientPos - startPos
      var maxT = getMaxTranslate()
      var curPos = self._getTranslate()

      if (curPos > 0) {
        self.goTo(0)
        if (self.onEnd) self.onEnd(self)
        return
      }
      if (curPos < maxT) {
        self.goTo(self._slides.length - (self._slidesPerView || self.slidesPerView))
        if (self.onEnd) self.onEnd(self)
        return
      }

      var threshold = self.sensitivitySwipe || 20
      if (Math.abs(delta) > threshold) {
        if (self.onSwipe) self.onSwipe(delta, self)
        if (delta < 0) self.next()
        else self.prev()
      } else {
        if (self.onCancel) self.onCancel(self)
        self.goTo(self._current)
      }
      if (self.onEnd) self.onEnd(self)
    }

    this.container.addEventListener('pointerdown', onPointerDown)
    this.container.addEventListener('touchstart', onPointerDown, { passive: false })
    this._dragCleanup = function () {
      self.container.removeEventListener('pointerdown', onPointerDown)
      self.container.removeEventListener('touchstart', onPointerDown)
    }
  }

  _getTranslate() {
    return this._currentTranslate
  }

  _initPauseOnHover() {
    if (this._pauseCleanup) return
    var self = this
    var onEnter = function () {
      if (self._autoTimer) {
        self._wasPlaying = true
        self._pauseTimer()
      }
    }
    var onLeave = function () {
      if (self._wasPlaying) {
        self._wasPlaying = false
        self._resumeTimer()
      }
    }
    this.container.addEventListener('mouseenter', onEnter)
    this.container.addEventListener('mouseleave', onLeave)
    this._pauseCleanup = function () {
      self.container.removeEventListener('mouseenter', onEnter)
      self.container.removeEventListener('mouseleave', onLeave)
      self._pauseCleanup = null
    }
  }

  _pauseTimer() {
    if (!this._timerEl) return
    if (this.timerStyle === 'pie') {
      var cs = getComputedStyle(this._timerEl)
      this._timerPausedWidth = parseFloat(cs.strokeDashoffset) / this._timerCirc
    } else {
      var pw = this._timerEl.parentNode
      this._timerPausedWidth = pw ? this._timerEl.offsetWidth / pw.offsetWidth : 0
    }
    this._timerEl.style.transition = 'none'
    if (this.timerStyle === 'pie') {
      this._timerEl.style.strokeDashoffset = this._timerCirc * this._timerPausedWidth
    } else {
      this._timerEl.style.width = (this._timerPausedWidth * 100) + '%'
    }
  }

  _resumeTimer() {
    if (!this._autoTimer || !this._timerEl) return
    if (this._timerEl.style.transition !== 'none') return
    var remain = Math.max(50, (1 - this._timerPausedWidth) * this.interval)

    if (this.timerStyle === 'pie') {
      this._timerEl.style.strokeDashoffset = this._timerCirc * this._timerPausedWidth
      void this._timerEl.getBoundingClientRect()
      this._timerEl.style.transition = 'stroke-dashoffset ' + (remain / 1000) + 's linear'
      this._timerEl.style.strokeDashoffset = '0'
    } else {
      var pw = this._timerEl.parentNode
      if (!pw) return
      this._timerEl.style.width = (this._timerPausedWidth * 100) + '%'
      void this._timerEl.offsetHeight
      this._timerEl.style.transition = 'width ' + (remain / 1000) + 's linear'
      this._timerEl.style.width = '100%'
    }
  }

  goTo(index, animate) {
    if (this._destroyed) return
    if (animate === undefined) animate = true
    var len = this._slides.length
    if (len === 0) return

    var from = this._current
    var spv = this._slidesPerView || this.slidesPerView
    var wrapped = false

    if (this.loop) {
      if (index < 0) { index = len - 1; wrapped = true }
      else if (index >= len) { index = 0; wrapped = true }
    } else {
      index = Math.max(0, Math.min(len - spv, index))
    }

    if (index === from) {
      this._slideTo(index)
      return
    }

    if (this.onSlide) {
      var ret = this.onSlide(index, from, this)
      if (ret === false) return
    }

    this._current = index
    if (wrapped) {
      this._slideTo(index, false)
      if (this._hasGSAP) {
        gsap.killTweensOf(this._slides)
        this._slides.forEach(function (s) { gsap.set(s, { clearProps: 'opacity' }) })
      }
    } else {
      this._slideTo(index, animate)
    }
    this._updatePagination()
    if (this._autoTimer) this._resetTimer()
  }

  _slideTo(index, animate) {
    var p = -(index * this._slideStep)
    var track = this._track
    var self = this

    if (animate === false) {
      track.classList.add('no-transition')
      track.style.transform = this._axis.pos === 'x' ? 'translateX(' + p + 'px)' : 'translateY(' + p + 'px)'
      void track.offsetHeight
      track.classList.remove('no-transition')
      this._currentTranslate = p
    } else if (this._hasGSAP) {
      gsap.killTweensOf(track)
      var o = { duration: 0.35, ease: 'power3.out', overwrite: 'auto', onUpdate: function () { self._currentTranslate = gsap.getProperty(track, self._axis.gsapKey) } }
      o[this._axis.gsapKey] = p
      gsap.to(track, o)
      this._currentTranslate = p
    } else {
      track.style.transform = this._axis.pos === 'x' ? 'translateX(' + p + 'px)' : 'translateY(' + p + 'px)'
      this._currentTranslate = p
    }
  }

  next() {
    this.goTo(this._current + 1)
  }

  prev() {
    this.goTo(this._current - 1)
  }

  getCurrent() {
    return this._current
  }

  getTotal() {
    return this._slides.length
  }

  setOptions(opts) {
    if (!opts) return
    var changed = false

    if (opts.showCounter !== undefined && opts.showCounter !== this.showCounter) {
      this.showCounter = opts.showCounter
      if (this.showCounter) { this._buildCounter(); this._updatePagination() }
      else if (this._counterEl) { this._counterEl.remove(); this._counterEl = null }
      changed = true
    }

    if (opts.showPagination !== undefined && opts.showPagination !== this.showPagination) {
      this.showPagination = opts.showPagination
      if (this.showPagination) this._buildPagination()
      else if (this._paginationEl) { this._paginationEl.remove(); this._paginationEl = null }
      changed = true
    }

    if (opts.showControls !== undefined && opts.showControls !== this.showControls) {
      this.showControls = opts.showControls
      if (this.showControls) this._buildControls()
      else {
        this.container.querySelectorAll('.zaiku-slider-btn').forEach(function (b) { b.remove() })
      }
      changed = true
    }

    if (opts.pauseOnHover !== undefined && opts.pauseOnHover !== this.pauseOnHover) {
      this.pauseOnHover = opts.pauseOnHover
      if (this._pauseCleanup) { this._pauseCleanup(); this._pauseCleanup = null }
      if (this.pauseOnHover) this._initPauseOnHover()
      changed = true
    }

    if (opts.loop !== undefined) { this.loop = opts.loop; changed = true }
    if (opts.draggable !== undefined) { this.draggable = opts.draggable; changed = true }
    if (opts.direction !== undefined && opts.direction !== this.direction) {
      this.direction = opts.direction
      this._axis = this.direction === 'vertical' ? { pos: 'y', client: 'clientY', sizeProp: 'offsetHeight', re: /translateY\(([-\d.]+)px\)/, gsapKey: 'y' } : { pos: 'x', client: 'clientX', sizeProp: 'offsetWidth', re: /translateX\(([-\d.]+)px\)/, gsapKey: 'x' }
      if (this._paginationEl) { this._paginationEl.remove(); this._paginationEl = null }
      if (this.showPagination) this._buildPagination()
      this.container.querySelectorAll('.zaiku-slider-btn').forEach(function (b) { b.remove() })
      if (this.showControls) this._buildControls()
      this._updateSlideSizes()
      this.goTo(this._current, false)
      changed = true
    }
    if (opts.slidesPerView !== undefined || opts.gap !== undefined) {
      if (opts.slidesPerView !== undefined) this.slidesPerView = opts.slidesPerView
      if (opts.gap !== undefined) this.gap = opts.gap
      this._updateSlideSizes()
      this.goTo(this._current, false)
      changed = true
    }
    if (opts.interval !== undefined) { this.interval = opts.interval; changed = true }
    if (opts.sensitivitySwipe !== undefined) { this.sensitivitySwipe = opts.sensitivitySwipe; changed = true }
    if (opts.timerStyle !== undefined && opts.timerStyle !== this.timerStyle) {
      this.timerStyle = opts.timerStyle
      if (this._timerEl) { this._timerEl.parentNode.remove(); this._timerEl = null }
      if (this._autoTimer) { this._buildTimer(); this._resetTimer() }
      changed = true
    }
    if (opts.timerSize !== undefined) { this.timerSize = opts.timerSize; changed = true }
    if (opts.timerPosition !== undefined) { this.timerPosition = opts.timerPosition; changed = true }
    if (opts.timerStroke !== undefined) { this.timerStroke = opts.timerStroke; changed = true }
  }

  addSlide(el, index) {
    if (!this._track) return
    if (index < 0 || index >= this._slides.length) {
      this._track.appendChild(el)
    } else {
      var ref = this._slides[index]
      this._track.insertBefore(el, ref)
    }
    this._slides = Array.from(this._track.children).filter(function (s) {
      return s.classList && !s.classList.contains('zaiku-slider-btn') && !s.classList.contains('zaiku-slider-pagination')
    })
    if (this.showPagination) {
      if (this._paginationEl) this._paginationEl.remove()
      this._buildPagination()
    }
    this._updateSlideWidths()
    this.goTo(this._current, false)
    this._updatePagination()
    if (this._autoTimer) this._resetTimer()
  }

  removeSlide(index) {
    if (index < 0 || index >= this._slides.length) return
    var el = this._slides[index]
    el.remove()
    this._slides = Array.from(this._track.children).filter(function (s) {
      return s.classList && !s.classList.contains('zaiku-slider-btn') && !s.classList.contains('zaiku-slider-pagination')
    })
    if (this._slides.length === 0) {
      this.stop()
      if (this._paginationEl) { this._paginationEl.remove(); this._paginationEl = null }
      return
    }
    if (this._current >= this._slides.length) this._current = this._slides.length - 1
    if (this.showPagination) {
      if (this._paginationEl) this._paginationEl.remove()
      this._buildPagination()
    }
    this._updateSlideWidths()
    this.goTo(this._current, false)
    this._updatePagination()
    if (this._autoTimer) this._resetTimer()
  }

  start() {
    if (this._autoTimer) return
    if (this._slides.length <= 1) return
    this._buildTimer()
    this._autoTimer = true
    this._resetTimer()
  }

  _buildTimer() {
    if (this._timerEl) return
    var self = this
    var isPie = this.timerStyle === 'pie'

    if (isPie) {
      var sz = this.timerSize
      var sw = this.timerStroke
      var r = (sz - sw) / 2
      var circ = 2 * Math.PI * r
      this._timerCirc = circ

      var wrap = document.createElement('div')
      wrap.className = 'zaiku-slider-pie-wrap ' + this.timerPosition

      var svgNS = 'http://www.w3.org/2000/svg'
      var svg = document.createElementNS(svgNS, 'svg')
      svg.setAttribute('viewBox', '0 0 ' + sz + ' ' + sz)
      svg.setAttribute('width', sz)
      svg.setAttribute('height', sz)

      var bg = document.createElementNS(svgNS, 'circle')
      bg.setAttribute('cx', sz / 2)
      bg.setAttribute('cy', sz / 2)
      bg.setAttribute('r', r)
      bg.setAttribute('fill', 'none')
      bg.setAttribute('stroke', 'var(--color-gray-300)')
      bg.setAttribute('stroke-width', sw)

      this._timerEl = document.createElementNS(svgNS, 'circle')
      this._timerEl.setAttribute('cx', sz / 2)
      this._timerEl.setAttribute('cy', sz / 2)
      this._timerEl.setAttribute('r', r)
      this._timerEl.setAttribute('fill', 'none')
      this._timerEl.setAttribute('stroke', 'var(--color-gray-700)')
      this._timerEl.setAttribute('stroke-width', sw)
      this._timerEl.setAttribute('stroke-dasharray', circ + ' ' + circ)
      this._timerEl.setAttribute('stroke-dashoffset', circ)
      this._timerEl.style.transformOrigin = 'center'
      this._timerEl.style.transform = 'rotate(-90deg)'

      svg.appendChild(bg)
      svg.appendChild(this._timerEl)
      wrap.appendChild(svg)
      this.container.appendChild(wrap)

      this._timerEl.addEventListener('transitionend', function (e) {
        if (e.propertyName !== 'stroke-dashoffset') return
        if (!self._autoTimer || self._destroyed) return
        var before = self._current
        self.next()
        if (self._current === before) self.stop()
      })
    } else {
      var wrap = document.createElement('div')
      wrap.className = 'zaiku-slider-timer-wrap'
      this._timerEl = document.createElement('div')
      this._timerEl.className = 'zaiku-slider-timer'
      wrap.appendChild(this._timerEl)
      this.container.appendChild(wrap)

      this._timerEl.addEventListener('transitionend', function (e) {
        if (e.propertyName !== 'width') return
        if (!self._autoTimer || self._destroyed) return
        var before = self._current
        self.next()
        if (self._current === before) self.stop()
      })
    }
  }

  _resetTimer() {
    if (!this._timerEl) return
    var slide = this._slides[this._current]
    var dur = slide ? parseFloat(slide.getAttribute('data-interval')) || this.interval : this.interval
    var isPie = this.timerStyle === 'pie'

    if (isPie) {
      this._timerEl.style.transition = 'none'
      this._timerEl.style.strokeDashoffset = this._timerCirc
      void this._timerEl.getBoundingClientRect()
      this._timerEl.style.transition = 'stroke-dashoffset ' + (dur / 1000) + 's linear'
      this._timerEl.style.strokeDashoffset = '0'
    } else {
      this._timerEl.style.transition = 'none'
      this._timerEl.style.width = '0%'
      void this._timerEl.offsetHeight
      this._timerEl.style.transition = 'width ' + (dur / 1000) + 's linear'
      this._timerEl.style.width = '100%'
    }
  }

  stop() {
    this._autoTimer = null
    this._wasPlaying = false
    if (this._timerEl) {
      this._timerEl.style.transition = 'none'
      if (this.timerStyle === 'pie') {
        this._timerEl.style.strokeDashoffset = this._timerCirc
      } else {
        this._timerEl.style.width = '0%'
      }
    }
  }

  destroy() {
    this._destroyed = true
    this.stop()
    if (this._timerEl) { this._timerEl.parentNode.remove(); this._timerEl = null }
    window.removeEventListener('resize', this._onResize)
    if (this._dragCleanup) this._dragCleanup()
    if (this._pauseCleanup) this._pauseCleanup()
    this.container.querySelectorAll('.zaiku-slider-btn, .zaiku-slider-pagination, .zaiku-slider-counter').forEach(function (el) {
      el.remove()
    })
    this._track.style.transform = ''
    this.container.zaiku.sliderInstance = null
    if (this.onDestroy) this.onDestroy(this)
  }
}

Zaiku.Slider = ZaikuSlider

Zaiku.ElasticCards = ZaikuElasticCards
