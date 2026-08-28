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
  },
  calendar: {
    type: 'single',
    format: 'YYYY-MM-DD',
    firstDayOfWeek: 1,
    panels: 1,
    panelGap: 1,
    minDate: null,
    maxDate: null,
    disabledDates: null,
    disabledDays: null,
    preventPastMonths: false,
    preventPastDays: false,
    splitRange: false,
    minStay: 0,
    onSelect: null,
    onOpen: null,
    onClose: null,
    onDayClick: null,
    onDateSelect: null,
    onRangeStart: null,
    onRangeEnd: null,
    onMonthChange: null
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

  document.querySelectorAll('[data-zaiku-calendar]').forEach(function (el) {
    new Zaiku.Calendar(el, opts)
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

/**
 * @class ZaikuTabs
 * @classdesc Tabbed content switcher that toggles between panels on tab click.
 * Supports hash-based navigation and ARIA attributes. Applied to `.tab-area` elements.
 */
class ZaikuTabs {
  /**
   * @param {Element|string} container - The tabs container element or CSS selector.
   * @param {Object} [opts] - Global options object containing {@link Zaiku.defaults.tabs}.
   */
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

  /**
   * @private
   * @returns {boolean} Whether any tab triggers were found.
   * Find and associate tab triggers with their panels.
   */
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

  /**
   * @private
   * @returns {number} The panel index matching the current URL hash, or -1.
   */
  findTabByHash() {
    var hash = location.hash.slice(1)
    if (!hash) return -1
    for (var i = 0; i < this._panels.length; i++) {
      if (this._panels[i] && this._panels[i].id === hash) return i
    }
    return -1
  }

  /**
   * Initialize the tabs: determine the initial active tab, set up click delegation,
   * and optionally listen for hashchange events.
   */
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

  /**
   * Activate a tab by index, updating classes, ARIA attributes, hash, and firing the onSwitch callback.
   * @param {number} index - The index of the tab to activate.
   */
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

/**
 * @memberof Zaiku
 * @type {typeof ZaikuTabs}
 */
Zaiku.Tabs = ZaikuTabs

/**
 * @class ZaikuAccordion
 * @classdesc Accordion component that toggles sections open/closed.
 * Supports single or multiple open panels and optional media auto-embed.
 * Triggered via `data-zaiku-accordion` attribute.
 */
class ZaikuAccordion {
  /**
   * @param {Element|string} container - The accordion container element or CSS selector.
   * @param {Object} [opts] - Global options object containing {@link Zaiku.defaults.accordion}.
   */
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

  /**
   * Initialize the accordion: delegate click events on `.accordion-header`.
   */
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

  /**
   * Toggle the open/closed state of an accordion item.
   * @param {Element} item - The `.accordion-item` element.
   */
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

  /**
   * Open an accordion item and optionally embed media players.
   * @param {Element} item - The `.accordion-item` element.
   */
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

  /**
   * Close an accordion item and remove any embedded media iframes.
   * @param {Element} item - The `.accordion-item` element.
   */
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

  /**
   * Open the accordion item at the given index.
   * @param {number} index - The index of the item to open.
   */
  openByIndex(index) {
    var items = this.container.querySelectorAll('.accordion-item')
    if (items[index]) this.open(items[index])
  }

  /**
   * Close the accordion item at the given index.
   * @param {number} index - The index of the item to close.
   */
  closeByIndex(index) {
    var items = this.container.querySelectorAll('.accordion-item')
    if (items[index]) this.close(items[index])
  }

  /**
   * Toggle the accordion item at the given index.
   * @param {number} index - The index of the item to toggle.
   */
  toggleByIndex(index) {
    var items = this.container.querySelectorAll('.accordion-item')
    if (items[index]) this.toggle(items[index])
  }
}

/**
 * @class ZaikuScrub
 * @classdesc Numeric scrubber that allows value adjustment via horizontal drag,
 * keyboard arrows, and direct text input. Triggered via `data-zaiku-scrub` attribute.
 */
class ZaikuScrub {
  /**
   * @param {Element|string} container - The scrub container element or CSS selector.
   * @param {Object} [opts] - Global options object containing {@link Zaiku.defaults.scrub}.
   */
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

  /**
   * Get the current scrub value.
   * @type {number}
   */
  get value() { return this._value }
  set value(v) { this.setValue(v) }

  /**
   * Initialize the scrubber: attach mouse, keyboard, and edit-field event listeners.
   */
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

  /**
   * Set the scrub value, clamping to min/max and rounding to the configured decimals.
   * @param {number} v - New value.
   * @param {boolean} [updateHidden=true] - Whether to sync the hidden input.
   */
  setValue(v, updateHidden) {
    if (updateHidden === undefined) updateHidden = true
    v = Math.max(this.min, Math.min(this.max, v))
    this._value = this._round(v)
    this._render()
    if (updateHidden) this._syncHidden()
    if (this.onInput) this.onInput(this._value, this)
  }

  /**
   * @private
   * @param {number} v
   * @returns {number} The value rounded to the configured number of decimal places.
   */
  _round(v) {
    var f = Math.pow(10, this.decimals)
    return Math.round(v * f) / f
  }

  /**
   * @private
   * Update the display element with the current formatted value.
   */
  _render() {
    if (this.valueDisplay) {
      this.valueDisplay.textContent = this.prefix + this._value.toFixed(this.decimals) + this.suffix
    }
  }

  /**
   * @private
   * Write the current value to the hidden input and dispatch a change event.
   */
  _syncHidden() {
    if (this.hiddenInput) {
      this.hiddenInput.value = this._value
      var evt = document.createEvent('HTMLEvents')
      evt.initEvent('change', true, false)
      this.hiddenInput.dispatchEvent(evt)
    }
  }

  /**
   * @private
   * @param {MouseEvent} e
   * Handle mousedown to start a drag scrub.
   */
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

  /**
   * @private
   * @param {MouseEvent} e
   * Handle mousemove during a drag scrub to update the value.
   */
  _onMouseMove(e) {
    if (!this._dragging) return
    var dx = e.clientX - this._dragStartX
    var step = this.step
    if (e.altKey) step = this.fineStep
    if (e.shiftKey) step = this.coarseStep
    if (Math.abs(dx) > 2) this._dragMoved = true
    this.setValue(this._dragStartValue + dx * step)
  }

  /**
   * @private
   * @param {MouseEvent} e
   * Handle mouseup to stop dragging; either commit or enter edit mode.
   */
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

  /**
   * @private
   * Switch to keyboard edit mode.
   */
  _enterEditMode() {
    this._editMode = true
    this._savedValue = this._value
    this.container.classList.add('is-editing')
    this.editField.value = this._value.toFixed(this.decimals)
    this.editField.focus()
    this.editField.select()
    if (this.onFocus) this.onFocus(this._value, this)
  }

  /**
   * @private
   * Exit keyboard edit mode without saving.
   */
  _exitEditMode() {
    this._editMode = false
    this.container.classList.remove('is-editing')
  }

  /**
   * @private
   * Commit the edited value (on Enter or blur).
   */
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

  /**
   * @private
   * Revert to the saved value (on Escape).
   */
  _revertEdit() {
    this.setValue(this._savedValue)
    this._exitEditMode()
  }

  /**
   * @private
   * @param {KeyboardEvent} e
   * Handle arrow keys, Home/End, and Enter/Space for the scrub container.
   */
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

  /**
   * @private
   * @param {KeyboardEvent} e
   * Handle Enter (commit) and Escape (revert) in the edit field.
   */
  _onEditKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); this._commitEdit() }
    else if (e.key === 'Escape') { e.preventDefault(); this._revertEdit() }
  }
}

/**
 * @memberof Zaiku
 * @type {typeof ZaikuAccordion}
 */
Zaiku.Accordion = ZaikuAccordion

/**
 * @memberof Zaiku
 * @type {typeof ZaikuScrub}
 */
Zaiku.Scrub = ZaikuScrub

/**
 * @class ZaikuDropdown
 * @classdesc Dropdown menu component with submenu support and auto-placement.
 * Applied to elements with class `.dropdown` (excluding `.popover`).
 */
class ZaikuDropdown {
  /**
   * @param {Element|string} container - The dropdown container element or CSS selector.
   * @param {Object} [opts] - Global options object containing {@link Zaiku.defaults.dropdown}.
   */
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

  /**
   * @private
   * Initialize event listeners for toggle, outside click, Escape key, submenus, and item selection.
   */
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

  /**
   * @private
   * Initialize submenu hover/click behavior and positioning.
   */
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

  /**
   * @private
   * @param {Element} item - The submenu item to keep open.
   * Close all sibling submenus of the given item.
   */
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

  /**
   * @private
   * @param {Element} item - The submenu parent item.
   * @param {Element} nestedMenu - The nested dropdown-menu element.
   * Position a submenu to avoid overflow (dropstart / vertical flip).
   */
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

  /**
   * @private
   * Close all open submenus within this dropdown.
   */
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

  /**
   * Toggle the dropdown open/closed.
   */
  toggle() {
    if (this.container.classList.contains('show')) {
      this.close()
    } else {
      this.open()
    }
  }

  /**
   * Open the dropdown, closing any other open dropdowns first.
   */
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

  /**
   * Close the dropdown and all submenus.
   */
  close() {
    this.container.classList.remove('show', 'dropup')
    this._closeAllSubmenus()
    if (this.onClose) this.onClose(this)
  }
}

/**
 * @memberof Zaiku
 * @type {typeof ZaikuDropdown}
 */
Zaiku.Dropdown = ZaikuDropdown

/**
 * @namespace ZaikuHoverSliderEffects
 * @description Built-in GSAP transition effects for the hover slider.
 * Each effect exposes `leave(el, dir)` and `appear(el, dir, done)` functions.
 * @property {Object} fade - Opacity and scale crossfade.
 * @property {Object} slide - Sliding directional transition.
 * @property {Object} kenburns - Ken Burns zoom effect.
 * @property {Object} blur - Blur-to-clear transition.
 * @property {Object} zoom - Scale zoom transition with bounce.
 * @property {Object} rotate - Rotation transition.
 * @property {Object} skew - Skew transform transition.
 */
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

/**
 * @class ZaikuHoverSlider
 * @classdesc Hover-driven image or content slider that advances based on mouse movement
 * velocity. Triggered via `data-zaiku-hover-slider` attribute. Supports GSAP effects,
 * counters, and pagination.
 */
class ZaikuHoverSlider {
  /**
   * @param {Element|string} container - The slider container element or CSS selector.
   * @param {Object} [opts] - Global options object containing {@link Zaiku.defaults.hoverSlider}.
   */
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

  /**
   * @private
   * Initialize the hover slider: set up initial state, effects, counter, pagination,
   * and mouse event listeners.
   */
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

  /**
   * @private
   * Create and append the slide counter overlay element.
   */
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

  /**
   * @private
   * Create and append pagination dots overlay element.
   */
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

  /**
   * @private
   * @param {number} timestamp - Current timestamp from requestAnimationFrame.
   * Animation loop that advances the slide based on accumulated time and mouse velocity.
   */
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

  /**
   * Navigate to the slide at the given index.
   * @param {number} index - Target slide index.
   */
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

  /**
   * @private
   * @returns {string|null} The resolved effect type name.
   */
  _effectType() {
    return typeof this.effects === 'string' ? this.effects : (this.effects && this.effects.type) || null
  }

  /**
   * @private
   * @param {number} to - Target slide index.
   * @param {number} from - Previous slide index.
   * Animate the transition between slides using GSAP effects.
   */
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

  /**
   * @private
   * Update the counter and pagination UI to reflect the current slide.
   */
  _updateUI() {
    if (this._counterEl) this._counterEl.textContent = (this.current + 1) + '/' + this.total
    if (this._pagItems) {
      for (var i = 0; i < this._pagItems.length; i++) {
        this._pagItems[i].classList.toggle('active', i === this.current)
      }
    }
  }

  /**
   * Advance to the next slide.
   */
  next() {
    var next = this.current + 1
    if (this.loop) next = next % this.total
    else next = Math.min(next, this.total - 1)
    this.gotoSlide(next)
  }

  /**
   * Go to the previous slide.
   */
  prev() {
    var prev = this.current - 1
    if (this.loop) prev = ((prev % this.total) + this.total) % this.total
    else prev = Math.max(0, prev)
    this.gotoSlide(prev)
  }

  /**
   * Programmatically start the hover-slider animation loop.
   */
  start() {
    this.isHovering = true
    this.velocity = 0
    this.accumulator = 0
    if (!this.rafId) this._tick(performance.now())
    if (this.onStart) this.onStart(this)
  }

  /**
   * Programmatically stop the hover-slider animation loop.
   */
  stop() {
    this.isHovering = false
    this.velocity = 0
    if (this.onFinish) this.onFinish(this)
  }

  /**
   * Update the hover-slider options at runtime.
   * @param {Object} opts - Partial options object with hover-slider properties.
   * @returns {ZaikuHoverSlider} This instance for chaining.
   */
  setOptions(opts) {
    if (!opts) return this
    var keys = ['speed', 'speedBoost', 'loop', 'resetOnLeave', 'moveOnly', 'forwardOnly', 'delay', 'effects', 'showCounter', 'showPagination', 'onSlide', 'onStart', 'onFinish']
    for (var i = 0; i < keys.length; i++) {
      if (opts[keys[i]] !== undefined) this[keys[i]] = opts[keys[i]]
    }
    return this
  }

  /**
   * @private
   * @param {Element} el - The slide element.
   * @param {string} src - Image URL.
   * Preload a background image for a slide.
   */
  _loadSlide(el, src) {
    if (!src) return
    var img = new Image()
    img.onload = function () {
      el.style.backgroundImage = 'url(' + src + ')'
    }
    img.src = src
  }

  /**
   * Destroy the hover-slider instance: stop animation, kill GSAP tweens, cancel RAF.
   */
  destroy() {
    this.stop()
    if (this._hasGSAP && this.effects) gsap.killTweensOf(this.slides)
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }
}

/**
 * @memberof Zaiku
 * @type {typeof ZaikuHoverSlider}
 */
Zaiku.HoverSlider = ZaikuHoverSlider

/**
 * @class ZaikuLazyLoader
 * @classdesc Lazy-loads images and background images using IntersectionObserver.
 * Watches `data-zaiku-lazy` elements and dynamically observes new DOM nodes via MutationObserver.
 */
class ZaikuLazyLoader {
  /**
   * @param {Object} [opts] - Global options object containing {@link Zaiku.defaults.lazyLoader}.
   */
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

  /**
   * @private
   * Initialize the IntersectionObserver and MutationObserver.
   */
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

  /**
   * @private
   * @param {Element} el - The element to observe.
   * Start observing an element and show a loading indicator.
   */
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

  /**
   * @private
   * @param {Element} el
   * Load the element's image source, apply it, and clean up.
   */
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

  /**
   * @private
   * @param {Element} el
   * Remove the loading indicator and apply the loaded class.
   */
  _cleanup(el) {
    var indicator = el.querySelector('.lazy-loading-indicator')
    if (indicator) indicator.remove()
    el.classList.remove('lazy-loading')
    el.classList.add(this.loadedClass)
  }

  /**
   * Manually observe a lazy-load element.
   * @param {Element} el - The element to observe.
   */
  observe(el) {
    if (this._observer) this._add(el)
  }

  /**
   * Destroy the lazy loader: disconnect both observers.
   */
  destroy() {
    if (this._observer) this._observer.disconnect()
    if (this._mo) this._mo.disconnect()
  }
}

/**
 * @memberof Zaiku
 * @type {typeof ZaikuLazyLoader}
 */
Zaiku.LazyLoader = ZaikuLazyLoader

/**
 * @class ZaikuElasticCards
 * @classdesc Interactive card row that expands the hovered card and collapses neighbors.
 * Triggered via `data-zaiku-card-elastic` attribute.
 */
class ZaikuElasticCards {
  /**
   * @param {Element|string} container - The container element or CSS selector.
   * @param {Object} [opts] - Global options object containing {@link Zaiku.defaults.elasticCards}.
   */
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

  /**
   * @private
   * Initialize mouse event listeners on the container and each card.
   */
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

  /**
   * @private
   * Reset all cards to equal width.
   */
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

  /**
   * @private
   * @param {number} index - Index of the hovered card.
   * Apply proportional widths: expand the hovered card, shrink neighbors.
   */
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

  /**
   * @private
   * @returns {number} The computed gap between cards in pixels.
   */
  _getGap() {
    var style = getComputedStyle(this.container)
    var g = style.gap || style.columnGap
    if (g) {
      var m = parseFloat(g)
      return isNaN(m) ? 0 : m
    }
    return 0
  }

  /**
   * Destroy the elastic cards instance: remove resize listener and reset card widths.
   */
  destroy() {
    window.removeEventListener('resize', this._resize)
    for (var i = 0; i < this._cards.length; i++) {
      this._cards[i].style.width = ''
    }
  }
}

/**
 * @class ZaikuSlider
 * @classdesc Responsive carousel/slider component with drag/swipe, autoplay, breakpoints,
 * pagination, counter, and timer support. Triggered via `data-zaiku-slider` attribute.
 */
class ZaikuSlider {
  /**
   * @param {Element|string} container - The slider container element or CSS selector.
   * @param {Object} [opts] - Global options object containing {@link Zaiku.defaults.slider}.
   */
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

  /**
   * @private
   * Initialize the slider: build track, apply breakpoints, set up controls/pagination/drag,
   * and start autoplay if configured.
   */
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

  /**
   * @private
   * Find or create the slider track element.
   */
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

  /**
   * @private
   * Calculate and apply slide widths/heights based on slidesPerView and gap.
   */
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

  /**
   * @private
   * Determine the effective slidesPerView based on viewport width breakpoints.
   */
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

  /**
   * @private
   * Debounced resize handler that recalculates slide sizes and repositions.
   */
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

  /**
   * @private
   * Create and append previous/next navigation buttons.
   */
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

  /**
   * @private
   * Create and append pagination dots.
   */
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

  /**
   * @private
   * Create and append the slide counter element.
   */
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

  /**
   * @private
   * Update pagination dots and counter text to reflect the current slide.
   */
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

  /**
   * @private
   * Initialize drag/swipe interaction on the slider track.
   */
  _initDrag() {
    var self = this
    var startPos = 0
    var startTranslate = 0
    var dragging = false
    var track = this._track

    /**
     * @private
     * @returns {number}
     */
    function getMaxTranslate() {
      var spv = self._slidesPerView || self.slidesPerView
      return -((self._slides.length - spv) * self._slideStep)
    }

    /**
     * @private
     * @param {Event} e
     * @returns {number}
     */
    function getPointerPos(e) {
      return self._axis.client === 'clientY'
        ? (e.clientY || (e.touches && e.touches[0].clientY))
        : (e.clientX || (e.touches && e.touches[0].clientX))
    }

    /**
     * @private
     * @param {Event} e
     */
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

    /**
     * @private
     * @param {Event} e
     */
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

    /**
     * @private
     * @param {Event} e
     */
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

  /**
   * @private
   * @returns {number}
   */
  _getTranslate() {
    return this._currentTranslate
  }

  /**
   * @private
   * Set up event listeners to pause autoplay when the mouse enters the container.
   */
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

  /**
   * @private
   * Pause the autoplay timer animation, recording the current progress.
   */
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

  /**
   * @private
   * Resume the autoplay timer animation from the previously paused progress.
   */
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

  /**
   * Navigate to the slide at the given index.
   * @param {number} index - Target slide index.
   * @param {boolean} [animate=true] - Whether to animate the transition.
   */
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

  /**
   * @private
   * @param {number} index
   * @param {boolean} animate
   * Perform the visual slide transition (CSS transform or GSAP animation).
   */
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

  /**
   * Advance to the next slide.
   */
  next() {
    this.goTo(this._current + 1)
  }

  /**
   * Go to the previous slide.
   */
  prev() {
    this.goTo(this._current - 1)
  }

  /**
   * Get the current slide index.
   * @returns {number}
   */
  getCurrent() {
    return this._current
  }

  /**
   * Get the total number of slides.
   * @returns {number}
   */
  getTotal() {
    return this._slides.length
  }

  /**
   * Update slider options at runtime.
   * @param {Object} opts - Partial options object with slider properties to update.
   */
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

  /**
   * Add a slide to the slider at the specified index.
   * @param {Element} el - The slide element to insert.
   * @param {number} [index] - Insert position (appended if omitted or out of bounds).
   */
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

  /**
   * Remove a slide at the given index.
   * @param {number} index - Index of the slide to remove.
   */
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

  /**
   * Start autoplay.
   */
  start() {
    if (this._autoTimer) return
    if (this._slides.length <= 1) return
    this._buildTimer()
    this._autoTimer = true
    this._resetTimer()
  }

  /**
   * @private
   * Build the autoplay timer indicator element (bar or pie style).
   */
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

  /**
   * @private
   * Reset the autoplay timer animation back to the start.
   */
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

  /**
   * Stop autoplay and reset the timer indicator.
   */
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

  /**
   * Destroy the slider instance: stop autoplay, remove event listeners, clean up DOM.
   */
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

/**
 * @memberof Zaiku
 * @type {typeof ZaikuSlider}
 */
Zaiku.Slider = ZaikuSlider

/**
 * @constant
 * @type {string[]}
 * @default
 * @description Full month names used by {@link ZaikuCalendar} for date formatting.
 */
var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
/**
 * @constant
 * @type {string[]}
 * @default
 * @description Abbreviated month names used by {@link ZaikuCalendar} for date formatting.
 */
var MONTHS_MIN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
/**
 * @constant
 * @type {string[]}
 * @default
 * @description Full day-of-week names used by {@link ZaikuCalendar} for date formatting.
 */
var DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
/**
 * @constant
 * @type {string[]}
 * @default
 * @description Abbreviated day-of-week names used by {@link ZaikuCalendar} for date formatting.
 */
var DAYS_MIN = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

/**
 * @class ZaikuCalendar
 * @classdesc Date-picker calendar component supporting single, multiple, and range selection.
 * Triggered via `data-zaiku-calendar` attribute. Can render inline or as a popover attached
 * to a target input.
 */
class ZaikuCalendar {
  /**
   * @param {Element|string} container - The calendar container element or CSS selector.
   * @param {Object} [opts] - Global options object containing {@link Zaiku.defaults.calendar}.
   */
  constructor(container, opts) {
    if (typeof container === 'string') container = document.querySelector(container)
    if (!container) return
    if (container.zaiku && container.zaiku.calendarInstance) return container.zaiku.calendarInstance

    this.container = container
    var cfg = (opts && opts.calendar) || opts || {}

    this.type = container.getAttribute('data-type') || cfg.type || 'single'
    this.format = container.getAttribute('data-format') || cfg.format || 'YYYY-MM-DD'
    this.firstDayOfWeek = parseInt(container.getAttribute('data-first-day')) || cfg.firstDayOfWeek || 1
    this.panels = parseInt(container.getAttribute('data-panels')) || cfg.panels || 1
    this.panelGap = parseFloat(container.getAttribute('data-panel-gap')) || cfg.panelGap || 1
    this.minDate = container.getAttribute('data-min-date') || cfg.minDate || null
    this.maxDate = container.getAttribute('data-max-date') || cfg.maxDate || null
    this.disabledDates = JSON.parse(container.getAttribute('data-disabled-dates') || cfg.disabledDates || 'null')
    this.disabledDays = JSON.parse(container.getAttribute('data-disabled-days') || cfg.disabledDays || 'null')
    this.preventPastMonths = container.hasAttribute('data-prevent-past-months') || cfg.preventPastMonths || false
    this.preventPastDays = container.hasAttribute('data-prevent-past-days') || cfg.preventPastDays || false
    this.splitRange = container.hasAttribute('data-split-range') || cfg.splitRange || false
    this.minStay = parseInt(container.getAttribute('data-min-stay')) || cfg.minStay || 0
    this.onSelect = cfg.onSelect
    this.onOpen = cfg.onOpen
    this.onClose = cfg.onClose
    this.onDayClick = cfg.onDayClick
    this.onDateSelect = cfg.onDateSelect
    this.onRangeStart = cfg.onRangeStart
    this.onRangeEnd = cfg.onRangeEnd
    this.onMonthChange = cfg.onMonthChange
    this.dayFilter = cfg.dayFilter
    this.blockedDates = JSON.parse(container.getAttribute('data-blocked-dates') || cfg.blockedDates || 'null')
    this.onBlockedClick = cfg.onBlockedClick
    this.enableDateDetails = container.hasAttribute('data-enable-date-details') || cfg.enableDateDetails || false
    this.onDetailOpen = cfg.onDetailOpen
    this.detailPlacement = container.getAttribute('data-detail-placement') || cfg.detailPlacement || 'bottom'
    this.activeDayColor = container.getAttribute('data-active-day-color') || cfg.activeDayColor || null
    this.activeDayColorClass = container.getAttribute('data-active-day-color-class') || cfg.activeDayColorClass || null
    this.calendarBgColor = container.getAttribute('data-calendar-bg-color') || cfg.calendarBgColor || null
    this.calendarBgColorClass = container.getAttribute('data-calendar-bg-color-class') || cfg.calendarBgColorClass || null
    this.todayColor = container.getAttribute('data-today-color') || cfg.todayColor || null
    this.todayColorClass = container.getAttribute('data-today-color-class') || cfg.todayColorClass || null
    this._detailPopoverEl = null
    this._currentDetailDate = null
    this._target = document.querySelector(container.getAttribute('data-target'))
    this._inline = !this._target

    var now = new Date()
    this._viewYear = now.getFullYear()
    this._viewMonth = now.getMonth()
    this._selectedDates = []
    this._rangeStart = null
    this._rangeEnd = null
    this._rangeSegments = null

    if (cfg.value) this._setInitialValue(cfg.value)

    container.zaiku = container.zaiku || {}
    container.zaiku.calendarInstance = this

    this._build()
    if (!this._inline) this._initPopover()
  }

  /**
   * @private
   * @param {Object|string|Array} val - Initial value.
   */
  _setInitialValue(val) {
    if (this.type === 'range' && val && val.start && val.end) {
      this._rangeStart = this._parseDate(val.start)
      this._rangeEnd = this._parseDate(val.end)
    } else if (this.type === 'multiple' && Array.isArray(val)) {
      this._selectedDates = val.map(function (d) { return new Date(d) })
    } else if (val) {
      this._selectedDates = [this._parseDate(val)]
    }
  }

  /**
   * @private
   * @param {string} str - Date string in 'YYYY-MM-DD' format.
   * @returns {Date|null}
   */
  _parseDate(str) {
    if (!str) return null
    var parts = str.split('-')
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
  }

  /**
   * @private
   * @param {Date} d - Date to format.
   * @returns {string}
   */
  _formatDate(d) {
    return this.formatDate(d, this.format)
  }

  /**
   * Format a Date to a string using the given format pattern.
   * Supports YYYY/YY/yyyy/yy, MMMM/MMM/MM, D/d/DD/dd, dddd/ddd.
   * @param {Date} d - Date to format.
   * @param {string} [fmt] - Format pattern (defaults to instance format).
   * @returns {string}
   */
  formatDate(d, fmt) {
    if (!d) return ''
    if (!fmt) fmt = this.format || 'YYYY-MM-DD'
    var y = d.getFullYear()
    var m = d.getMonth()
    var day = d.getDate()
    var wd = d.getDay()
    var map = {
      'YYYY': y,
      'yyyy': y,
      'YY': String(y).slice(-2),
      'yy': String(y).slice(-2),
      'MMMM': MONTHS[m],
      'MMM': MONTHS_MIN[m],
      'MM': ('0' + (m + 1)).slice(-2),
      'DD': ('0' + day).slice(-2),
      'dd': ('0' + day).slice(-2),
      'dddd': DAYS[wd],
      'ddd': DAYS_MIN[wd]
    }
    var keys = ['YYYY','yyyy','MMMM','MMM','dddd','ddd','YY','yy','MM','DD','dd']
    var result = fmt
    for (var i = 0; i < keys.length; i++) {
      result = result.split(keys[i]).join(map[keys[i]])
    }
    result = result.replace(/D(?!D)/g, day).replace(/d(?!d)/g, day)
    return result
  }

  /**
   * @private
   * @param {Date} a
   * @param {Date} b
   * @returns {boolean}
   */
  _dateEquals(a, b) {
    return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  }

  /**
   * @private
   * @param {number} y - Year.
   * @param {number} m - Month (0-indexed).
   * @returns {number} Number of days in the month.
   */
  _daysInMonth(y, m) {
    return new Date(y, m + 1, 0).getDate()
  }

  /**
   * @private
   * @param {number} y - Year.
   * @param {number} m - Month (0-indexed).
   * @param {number} d - Day of month.
   * @returns {number} Day of week (0=Sunday).
   */
  _dayOfWeek(y, m, d) {
    return new Date(y, m, d).getDay()
  }

  /**
   * @private
   * @param {number} y - Year.
   * @param {number} m - Month (0-indexed).
   * @param {number} d - Day of month.
   * @returns {boolean}
   */
  _isDisabled(y, m, d) {
    var date = new Date(y, m, d)
    if (this.dayFilter && !this.dayFilter(date)) return true
    if (this.preventPastDays) {
      var today = new Date(); today.setHours(0, 0, 0, 0)
      if (date < today) return true
    }
    if (this.minDate && date < this._parseDate(this.minDate)) return true
    if (this.maxDate && date > this._parseDate(this.maxDate)) return true
    if (this.disabledDates) {
      var ds = this._formatDate(date)
      for (var i = 0; i < this.disabledDates.length; i++) {
        if (this.disabledDates[i] === ds) return true
      }
    }
    if (this.disabledDays) {
      var dw = date.getDay()
      for (var i = 0; i < this.disabledDays.length; i++) {
        if (this.disabledDays[i] === dw) return true
      }
    }
    return false
  }

  /**
   * @private
   * @param {number} y
   * @param {number} m
   * @param {number} d
   * @returns {boolean}
   */
  _isSelected(y, m, d) {
    for (var i = 0; i < this._selectedDates.length; i++) {
      if (this._dateEquals(this._selectedDates[i], new Date(y, m, d))) return true
    }
    return false
  }

  /**
   * @private
   * @param {number} y
   * @param {number} m
   * @param {number} d
   * @returns {boolean}
   */
  _isToday(y, m, d) {
    var t = new Date()
    return t.getFullYear() === y && t.getMonth() === m && t.getDate() === d
  }

  /**
   * @private
   * @param {number} y
   * @param {number} m
   * @param {number} d
   * @returns {Object|null} Blocked date entry or null.
   */
  _getBlocked(y, m, d) {
    if (!this.blockedDates) return null
    var ds = this._formatDate(new Date(y, m, d))
    for (var i = 0; i < this.blockedDates.length; i++) {
      if (this.blockedDates[i].date === ds) return this.blockedDates[i]
    }
    return null
  }

  /**
   * @private
   * @param {number} y
   * @param {number} m
   * @param {number} d
   * @returns {boolean}
   */
  _inRange(y, m, d) {
    if (!this._rangeStart) return false
    var date = new Date(y, m, d)
    if (this._rangeEnd) {
      return date >= this._rangeStart && date <= this._rangeEnd
    }
    return this._dateEquals(date, this._rangeStart)
  }

  /**
   * @private
   * Build the calendar DOM structure including panels, headers, grids, and popover elements.
   */
  _build() {
    this.container.innerHTML = ''
    this._panelsEl = document.createElement('div')
    this._panelsEl.className = 'zaiku-calendar-panels'
    this._panelsEl.style.gap = this.panelGap + 'rem'

    if (this.panels > 1) {
      this._buildGroupHeader()
    }

    for (var i = 0; i < this.panels; i++) {
      this._renderPanel(i)
    }

    this.container.appendChild(this._panelsEl)
    this.container.classList.add('zaiku-calendar')
    if (this.panels > 1) this.container.classList.add('zaiku-calendar-grouped')
    if (this.enableDateDetails) this._initDetailPopover()
    if (this.calendarBgColor) this.container.style.backgroundColor = this.calendarBgColor
    if (this.calendarBgColorClass) this.container.classList.add(this.calendarBgColorClass)
  }

  /**
   * @private
   * Build the navigation header used when multiple panels are displayed.
   */
  _buildGroupHeader() {
    var hdr = document.createElement('div')
    hdr.className = 'zaiku-calendar-group-header'
    var prev = document.createElement('button')
    prev.className = 'zaiku-calendar-nav zaiku-calendar-prev'
    prev.innerHTML = '‹'
    var self = this
    prev.addEventListener('click', function () { self._navigate(-1) })
    var title = document.createElement('span')
    title.className = 'zaiku-calendar-title'
    this._groupTitle = title
    this._updateGroupTitle()
    var next = document.createElement('button')
    next.className = 'zaiku-calendar-nav'
    next.innerHTML = '›'
    next.addEventListener('click', function () { self._navigate(1) })
    hdr.appendChild(prev)
    hdr.appendChild(title)
    hdr.appendChild(next)
    this.container.appendChild(hdr)
  }

  /**
   * @private
   * Update the group header title text to reflect the current view range.
   */
  _updateGroupTitle() {
    if (!this._groupTitle) return
    if (this.panels === 1) return
    var m = this._viewMonth
    var y = this._viewYear
    var endM = (m + this.panels - 1) % 12
    var endY = y + Math.floor((m + this.panels - 1) / 12)
    this._groupTitle.textContent = MONTHS[m] + ' ' + y + ' - ' + MONTHS[endM] + ' ' + endY
  }

  /**
   * @private
   * @param {number} offset - Panel offset from the current view month.
   * Render a single month panel within the calendar.
   */
  _renderPanel(offset) {
    var m = (this._viewMonth + offset) % 12
    var y = this._viewYear + Math.floor((this._viewMonth + offset) / 12)
    if (m < 0) { m += 12; y -= 1 }

    var panel = document.createElement('div')
    panel.className = 'zaiku-calendar-panel'

    if (this.panels === 1) {
      var hdr = document.createElement('div')
      hdr.className = 'zaiku-calendar-header'
      var prev = document.createElement('button')
      prev.className = 'zaiku-calendar-nav zaiku-calendar-prev'
      prev.innerHTML = '‹'
      var self = this
      prev.addEventListener('click', function () { self._navigate(-1) })
      var title = document.createElement('span')
      title.className = 'zaiku-calendar-title'
      title.textContent = MONTHS[m] + ' ' + y
      var next = document.createElement('button')
      next.className = 'zaiku-calendar-nav'
      next.innerHTML = '›'
      next.addEventListener('click', function () { self._navigate(1) })
      hdr.appendChild(prev)
      hdr.appendChild(title)
      hdr.appendChild(next)
      panel.appendChild(hdr)
    }

    var grid = document.createElement('div')
    grid.className = 'zaiku-calendar-grid'

    var weekdays = document.createElement('div')
    weekdays.className = 'zaiku-calendar-weekdays'
    for (var d = 0; d < 7; d++) {
      var wd = document.createElement('span')
      wd.className = 'zaiku-calendar-weekday'
      wd.textContent = DAYS_MIN[(d + this.firstDayOfWeek) % 7]
      weekdays.appendChild(wd)
    }
    grid.appendChild(weekdays)

    var startDow = this._dayOfWeek(y, m, 1)
    var daysInMonth = this._daysInMonth(y, m)
    var prevDays = this._daysInMonth(y, m - 1 < 0 ? 11 : m - 1, y - (m < 1 ? 1 : 0))
    var startOffset = (startDow - this.firstDayOfWeek + 7) % 7
    var totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7

    var self = this
    var week = null
    for (var i = 0; i < totalCells; i++) {
      if (i % 7 === 0) {
        week = document.createElement('div')
        week.className = 'zaiku-calendar-week'
        grid.appendChild(week)
      }
      var cellDay, cellMonth, cellYear, isOther = false
      if (i < startOffset) {
        cellDay = prevDays - startOffset + i + 1
        cellMonth = m - 1 < 0 ? 11 : m - 1
        cellYear = m < 1 ? y - 1 : y
        isOther = true
      } else if (i >= startOffset + daysInMonth) {
        cellDay = i - startOffset - daysInMonth + 1
        cellMonth = m + 1 > 11 ? 0 : m + 1
        cellYear = m > 10 ? y + 1 : y
        isOther = true
      } else {
        cellDay = i - startOffset + 1
        cellMonth = m
        cellYear = y
      }

      var cell = document.createElement('div')
      cell.className = 'zaiku-calendar-day-cell'
      var btn = document.createElement('button')
      btn.className = 'zaiku-calendar-day'
      btn.textContent = cellDay
      if (isOther) btn.classList.add('other-month')
      if (this._isToday(cellYear, cellMonth, cellDay)) btn.classList.add('today')
      var blockedData = this._getBlocked(cellYear, cellMonth, cellDay)
      var isDisabled = this._isDisabled(cellYear, cellMonth, cellDay) || !!blockedData
      if (isDisabled) btn.classList.add('disabled')
      if (blockedData) {
        btn.classList.add('blocked')
        btn.dataset.blockedLabel = blockedData.label || ''
      }
      if (this._isSelected(cellYear, cellMonth, cellDay)) btn.classList.add('selected')

      if (this.type === 'range') {
        var date = new Date(cellYear, cellMonth, cellDay)
        if (this._rangeStart && this._rangeEnd && date > this._rangeStart && date < this._rangeEnd) {
          btn.classList.add('in-range')
        }
        if (this._dateEquals(date, this._rangeStart)) btn.classList.add('range-start')
        if (this._dateEquals(date, this._rangeEnd)) btn.classList.add('range-end')
      }

      if (btn.classList.contains('selected') || btn.classList.contains('range-start') || btn.classList.contains('range-end')) {
        if (this.activeDayColor) btn.style.backgroundColor = this.activeDayColor
        if (this.activeDayColorClass) btn.classList.add(this.activeDayColorClass)
      }
      if (btn.classList.contains('today')) {
        if (this.todayColor) btn.style.color = this.todayColor
        if (this.todayColorClass) btn.classList.add(this.todayColorClass)
      }

      if (!isDisabled) {
        ;(function (cy, cm, cd, b) {
          b.addEventListener('click', function () {
            self._lastClickedCell = b
            self._selectDate(cy, cm, cd)
          })
        }(cellYear, cellMonth, cellDay, btn))
      }
      if (blockedData) {
        ;(function (cy, cm, cd, bd, b) {
          b.addEventListener('click', function (e) {
            e.stopPropagation()
            if (self.onBlockedClick) self.onBlockedClick(new Date(cy, cm, cd), bd, self)
          })
        }(cellYear, cellMonth, cellDay, blockedData, btn))
      }

      cell.appendChild(btn)
      week.appendChild(cell)
    }

    panel.appendChild(grid)
    this._panelsEl.appendChild(panel)
  }

  /**
   * @private
   * @param {number} y
   * @param {number} m
   * @param {number} d
   * Handle date selection based on the current selection type.
   */
  _selectDate(y, m, d) {
    var date = new Date(y, m, d)

    var cellRect = null
    if (this.enableDateDetails && this._lastClickedCell) {
      cellRect = this._lastClickedCell.getBoundingClientRect()
    }

    if (this.onDayClick) this.onDayClick(date, this)

    if (this.type === 'single') {
      this._selectedDates = [date]
      if (this.onDateSelect) this.onDateSelect(date, this)
    } else if (this.type === 'multiple') {
      var idx = -1
      for (var i = 0; i < this._selectedDates.length; i++) {
        if (this._dateEquals(this._selectedDates[i], date)) { idx = i; break }
      }
      if (idx >= 0) this._selectedDates.splice(idx, 1)
      else this._selectedDates.push(date)
      if (this.onDateSelect) this.onDateSelect(date, this)
    } else if (this.type === 'range') {
      if (!this._rangeStart || (this._rangeStart && this._rangeEnd)) {
        this._rangeStart = date
        this._rangeEnd = null
        this._rangeSegments = null
        if (this.onRangeStart) this.onRangeStart(date, this)
      } else {
        if (date < this._rangeStart) {
          this._rangeEnd = this._rangeStart
          this._rangeStart = date
        } else {
          this._rangeEnd = date
        }
        if (this.splitRange) this._splitRange()
        if (this.onRangeEnd) this.onRangeEnd(this._rangeStart, this._rangeEnd, this)
      }
    }

    this._render()
    if (this.onSelect) this.onSelect(this.getValue(), this)
    if (!this._inline) this._writeToTarget()
    if (this.enableDateDetails && date) {
      this._openDateDetail(date, cellRect)
      this._lastClickedCell = null
    }
  }

  /**
   * Get the currently selected value(s) according to the calendar type.
   * @returns {string|Object|Array|null}
   */
  getValue() {
    if (this.type === 'range') {
      if (this.splitRange && this._rangeSegments) return this._rangeSegments
      return { start: this._formatDate(this._rangeStart), end: this._formatDate(this._rangeEnd) }
    }
    if (this.type === 'multiple') return this._selectedDates.map(function (d) { return this._formatDate(d) }, this)
    return this._formatDate(this._selectedDates[0] || null)
  }

  /**
   * @private
   * Split the selected range into segments around disabled dates.
   * Filters segments by minStay if configured.
   */
  _splitRange() {
    if (!this._rangeStart || !this._rangeEnd) return
    var segments = []
    var current = new Date(this._rangeStart)
    var segStart = new Date(current)
    while (current <= this._rangeEnd) {
      var y = current.getFullYear()
      var m = current.getMonth()
      var d = current.getDate()
      if (this._isDisabled(y, m, d)) {
        if (segStart < current) {
          var segEnd = new Date(current)
          segEnd.setDate(segEnd.getDate() - 1)
          segments.push({ start: this._formatDate(segStart), end: this._formatDate(segEnd) })
        }
        segStart = new Date(current)
        segStart.setDate(segStart.getDate() + 1)
      }
      current.setDate(current.getDate() + 1)
    }
    if (segStart <= this._rangeEnd) {
      segments.push({ start: this._formatDate(segStart), end: this._formatDate(this._rangeEnd) })
    }
    if (this.minStay > 0) {
      segments = segments.filter(function (s) {
        var diff = Math.round((new Date(s.end) - new Date(s.start)) / 86400000)
        return diff >= this.minStay
      }, this)
    }
    this._rangeSegments = segments.length > 0 ? segments : null
  }

  /**
   * @private
   * @param {number} delta - Direction and number of months to navigate (-1 or 1).
   */
  _navigate(delta) {
    if (delta < 0 && this.preventPastMonths) {
      var targetMonth = this._viewMonth + delta
      var targetYear = this._viewYear
      if (targetMonth < 0) { targetMonth += 12; targetYear -= 1 }
      var now = new Date()
      if (targetYear < now.getFullYear() || (targetYear === now.getFullYear() && targetMonth < now.getMonth())) {
        return
      }
    }
    this._viewMonth += delta
    if (this._viewMonth < 0) { this._viewMonth += 12; this._viewYear -= 1 }
    if (this._viewMonth > 11) { this._viewMonth -= 12; this._viewYear += 1 }
    this._updateGroupTitle()
    this._render()
    if (this.onMonthChange) this.onMonthChange(this._viewYear, this._viewMonth, this)
  }

  /**
   * Navigate to the previous month.
   */
  prevMonth() {
    this._navigate(-1)
  }

  /**
   * Navigate to the next month.
   */
  nextMonth() {
    this._navigate(1)
  }

  /**
   * Check whether a given date falls on a weekday.
   * @param {Date|string} date - Date object or date string.
   * @returns {boolean}
   */
  isWeekday(date) {
    var d = date instanceof Date ? date : this._parseDate(date)
    return d && d.getDay() !== 0 && d.getDay() !== 6
  }

  /**
   * @private
   * Re-render all calendar panels and update navigation state.
   */
  _render() {
    this._panelsEl.innerHTML = ''
    for (var i = 0; i < this.panels; i++) this._renderPanel(i)
    this._updateNavState()
  }

  /**
   * @private
   * Enable/disable the previous-month navigation button based on preventPastMonths.
   */
  _updateNavState() {
    this.container.querySelectorAll('.zaiku-calendar-prev').forEach(function (btn) {
      btn.removeAttribute('disabled')
    })
    if (!this.preventPastMonths) return
    var now = new Date()
    var atBoundary = this._viewYear < now.getFullYear() || (this._viewYear === now.getFullYear() && this._viewMonth <= now.getMonth())
    if (atBoundary) {
      this.container.querySelectorAll('.zaiku-calendar-prev').forEach(function (btn) {
        btn.setAttribute('disabled', 'disabled')
      })
    }
  }

  /**
   * @private
   * Initialize popover behavior when the calendar targets an input element.
   */
  _initPopover() {
    if (!this._target) return
    var self = this
    this.container.classList.add('zaiku-calendar-popover')
    this._target.addEventListener('click', function (e) { e.preventDefault(); self.toggle() })
    this.container.addEventListener('click', function () {
      self._clickedInside = true
    })
    document.addEventListener('click', function (e) {
      if (self._clickedInside) { self._clickedInside = false; return }
      if (self.container.classList.contains('show') && !self.container.contains(e.target) && e.target !== self._target && !self._target.contains(e.target)) {
        self.close()
      }
    })
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') self.close()
    })
  }

  /**
   * Toggle the calendar popover open/closed.
   */
  toggle() {
    if (this.container.classList.contains('show')) this.close()
    else this.open()
  }

  /**
   * Open the calendar popover.
   */
  open() {
    this.container.classList.add('show')
    if (this.onOpen) this.onOpen(this)
  }

  /**
   * Close the calendar popover.
   */
  close() {
    this.container.classList.remove('show')
    if (this.onClose) this.onClose(this)
  }

  /**
   * @private
   * Write the current selection to the target input element's value.
   */
  _writeToTarget() {
    if (!this._target || this._target.tagName !== 'INPUT') return
    var val = this.getValue()
    if (this.type === 'range') {
      if (this.splitRange && Array.isArray(val)) {
        this._target.value = val.map(function (s) { return s.start + ' — ' + s.end }).join(' | ')
      } else if (val && val.start) {
        this._target.value = val.start + ' — ' + val.end
      }
    } else if (this.type === 'multiple' && Array.isArray(val)) {
      this._target.value = val.join(', ')
    } else {
      this._target.value = val || ''
    }
  }

  /**
   * @private
   * Initialize the date-detail popover element and its event listeners.
   */
  _initDetailPopover() {
    if (this._detailPopoverEl) return
    var el = document.createElement('div')
    el.className = 'dropdown popover zaiku-calendar-detail-popover'
    el.setAttribute('data-popover-placement', 'bottom')
    var menu = document.createElement('div')
    menu.className = 'dropdown-menu'
    el.appendChild(menu)
    this.container.appendChild(el)
    this._detailPopoverEl = el
    var self = this
    this.container.addEventListener('click', function () {
      self._detailClickedInside = true
    })
    document.addEventListener('click', function (e) {
      if (self._detailClickedInside) { self._detailClickedInside = false; return }
      if (!self._detailPopoverEl.classList.contains('show')) return
      if (!self._detailPopoverEl.contains(e.target)) {
        self.closePopover()
      }
    })
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && self._detailPopoverEl.classList.contains('show')) {
        self.closePopover()
      }
    })
  }

  /**
   * @private
   * @param {Date} date - The clicked date.
   * @param {DOMRect|null} cellRect - Bounding rect of the clicked cell for positioning.
   * Open the detail popover for a specific date.
   */
  _openDateDetail(date, cellRect) {
    if (!this._detailPopoverEl) this._initDetailPopover()
    this._currentDetailDate = date
    var menu = this._detailPopoverEl.querySelector('.dropdown-menu')
    menu.innerHTML = ''
    if (this.onDetailOpen) this.onDetailOpen(menu, date, this)
    var placement = this.detailPlacement || 'bottom'
    this._detailPopoverEl.setAttribute('data-popover-placement', placement)
    if (cellRect) {
      var cr = this.container.getBoundingClientRect()
      var left = cellRect.left - cr.left
      var top = cellRect.top - cr.top
      this._detailPopoverEl.style.left = (left + cellRect.width / 2) + 'px'
      if (placement === 'right') {
        this._detailPopoverEl.style.top = top + 'px'
      } else if (placement === 'top') {
        this._detailPopoverEl.style.top = (top - 4) + 'px'
      } else if (placement === 'left') {
        this._detailPopoverEl.style.top = top + 'px'
      } else {
        this._detailPopoverEl.style.top = (top + cellRect.height + 4) + 'px'
      }
      this._detailPopoverEl.classList.add('show')
      var pw = this._detailPopoverEl.offsetWidth
      var ph = this._detailPopoverEl.offsetHeight
      if (placement === 'right') {
        this._detailPopoverEl.style.left = (cellRect.right - cr.left + 4) + 'px'
      } else if (placement === 'top') {
        this._detailPopoverEl.style.top = (top - ph - 4) + 'px'
        this._detailPopoverEl.style.left = (left + cellRect.width / 2) + 'px'
      } else if (placement === 'left') {
        this._detailPopoverEl.style.left = (cellRect.left - cr.left - pw - 4) + 'px'
        this._detailPopoverEl.style.top = (top + cellRect.height / 2 - ph / 2) + 'px'
      }
    } else {
      this._detailPopoverEl.classList.add('show')
    }
  }

  /**
   * Close the date-detail popover.
   */
  closePopover() {
    if (!this._detailPopoverEl) return
    this._detailPopoverEl.classList.remove('show')
    var menu = this._detailPopoverEl.querySelector('.dropdown-menu')
    menu.innerHTML = ''
    this._currentDetailDate = null
  }

  /**
   * Destroy the calendar instance, clean up the detail popover, and remove the instance reference.
   */
  destroy() {
    if (this._detailPopoverEl) {
      this.closePopover()
      this._detailPopoverEl.parentNode.removeChild(this._detailPopoverEl)
      this._detailPopoverEl = null
    }
    this.container.zaiku.calendarInstance = null
  }
}

/**
 * @memberof Zaiku
 * @type {typeof ZaikuCalendar}
 */
Zaiku.Calendar = ZaikuCalendar
