document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.input-tags').forEach(function (container) {
    initTagInput(container)
  })
})

function initTagInput(container) {
  var input = container.querySelector('.input-tags-field')
  if (!input || input.disabled) return

  container.querySelectorAll('.badge').forEach(function (badge) {
    addRemoveButton(badge)
  })

  input.addEventListener('keydown', function (e) {
    if (e.key === ',' || e.key === ' ') {
      e.preventDefault()
      var value = input.value.trim()
      if (value) {
        addTag(container, value)
        input.value = ''
      }
      return
    }

    if (e.key === 'Backspace' && input.value === '') {
      e.preventDefault()
      var active = container.querySelector('.badge-active')
      if (active) {
        active.remove()
        var badges = container.querySelectorAll('.input-tags > .badge')
        if (badges.length > 0) {
          badges[badges.length - 1].classList.add('badge-active')
        }
      } else {
        var badges = container.querySelectorAll('.input-tags > .badge')
        if (badges.length > 0) {
          badges[badges.length - 1].classList.add('badge-active')
        }
      }
      return
    }

    deactivateTags(container)
  })

  input.addEventListener('input', function () {
    deactivateTags(container)
  })
}

function addTag(container, text) {
  var badge = document.createElement('span')
  badge.className = 'badge badge-secondary'
  badge.textContent = text
  addRemoveButton(badge)

  var input = container.querySelector('.input-tags-field')
  input.parentNode.insertBefore(badge, input)
  deactivateTags(container)
}

function addRemoveButton(badge) {
  if (badge.querySelector('.tag-remove')) return
  var btn = document.createElement('button')
  btn.type = 'button'
  btn.className = 'tag-remove'
  btn.innerHTML = '&times;'
  btn.setAttribute('aria-label', 'Remove tag')
  btn.addEventListener('click', function (e) {
    e.stopPropagation()
    var container = badge.closest('.input-tags')
    badge.remove()
    deactivateTags(container)
    var input = container.querySelector('.input-tags-field')
    if (input) input.focus()
  })
  badge.appendChild(btn)
}

function deactivateTags(container) {
  container.querySelectorAll('.badge-active').forEach(function (badge) {
    badge.classList.remove('badge-active')
  })
}
