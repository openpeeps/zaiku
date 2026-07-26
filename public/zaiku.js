var Zaiku = Zaiku || {}

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

Zaiku.init = function (options) {
  var opts = extend({}, Zaiku.defaults)
  if (options) extend(opts, options)

  document.querySelectorAll('.input-tags').forEach(function (container) {
    new Zaiku.TagInput(container, opts)
  })

  document.querySelectorAll('form[data-zaiku-validation]').forEach(function (form) {
    new Zaiku.FormValidation(form, opts)
  })
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
