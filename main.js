/* TODO:
MAKE NON DESTRUCTIVE CARET
Make this usable not only for me (can load lunr lang)
put line numbers
1. localstorage autosave (snapshots and gallery)
3. for selfsearch also `notes`, dont include stuff with no title
4. keyboard control for selecting links after ctrl+O
* allow custom links with ctrl+o
6. ctrl+l for selecting lines like in sublime https://stackoverflow.com/questions/13650534/how-to-select-line-of-text-in-textarea

* Make the textarea dark or a color that is more noticable and friendly to eyes
   or dark theme
   Bullet point a whole selection per line
*/

// SETTINGS
var AUTOSAVE_INTERVAL = 5000
var POST_URL = 'https://github.com/beatobongco/TIL/new/master/day_notes'
var CARET = '<span class="cursor blinking-cursor">|</span>'
// util
function getSelectionText () {
  if (window.getSelection) {
    return window.getSelection().toString()
  } else if (document.selection && document.selection.type !== 'Control') {
    return document.selection.createRange().text
  }
}

if (!String.prototype.splice) {
  /**
   * {JSDoc}
   *
   * The splice() method changes the content of a string by removing a range of
   * characters and/or adding new characters.
   *
   * @this {String}
   * @param {number} start Index at which to start changing the string.
   * @param {number} delCount An integer indicating the number of old chars to remove.
   * @param {string} newSubStr The String that is spliced in.
   * @return {string} A new string with the spliced substring.
   */
  String.prototype.splice = function (start, delCount, newSubStr) {
    return this.slice(0, start) + newSubStr + this.slice(start + Math.abs(delCount))
  }
}

var app = new Vue({
  el: '#app',
  data: {
    caretPos: {},
    autosave: null,
    autosaving: false,
    autosaveDate: null,
    toSearch: null,
    modal: null,
    store: null,
    modalContents: null,
    lastPull: null,
    idx: null,
    showRaw: false,
    input: '',
    output: '',
    ghostOutput: ''
  },
  watch: {
    input: function () {
      this.markedWithCaret()
    }
  },
  mounted: function () {
    localforage
      .getItem('lunr')
      .then(function (value) {
        if (value) {
          app.idx = lunr.Index.load(JSON.parse(value))
          localforage
            .getItem('store')
            .then(function (value) {
              app.store = JSON.parse(value)
              localforage
                .getItem('lastPull')
                .then(function (value) {
                  app.lastPull = new Date(value).toLocaleString()
                })
            })
        } else {
          var url = 'https://beatobongco.com/selfsearch/'
          window.alert('No data detected. You will be redirected to ' + url)
          window.location.href = url
        }
      })

    localforage.getItem('thoth', function (err, val) {
      app.input = val
      app.autosave = setInterval(function () {
        localforage.setItem('thoth', app.input).then(function () {
          app.autosaveDate = new Date().toLocaleString()
        })
      }, AUTOSAVE_INTERVAL)
    })

    this.$refs.editor.focus()
  },
  updated: function () {
    this.updateCaretPos()
  },
  methods: {
    updateCaretPos: function () {
      var caret = document.getElementById('caret')
      if (caret) {
        var gc = document.getElementById('ghostCaret')
        var scrollTop = this.$refs.output.scrollTop
        gc.style.top = caret.offsetTop - scrollTop + 'px'
        gc.style.left = caret.offsetLeft + 'px'
        gc.style.fontSize = getComputedStyle(caret).fontSize
      }
    },
    focusEditor: function () {
      this.$refs.editor.focus()
    },
    highlightLine: function () {
      // TODO: fix
      var tarea = this.$refs.editor
      var _lineNum = tarea.value.substr(0, tarea.selectionEnd).split('\n').length - 1 // this is wrong
      console.log(_lineNum)
      function getLineStartEnd (lineNum) {
        var lines = tarea.value.split('\n')

        // calculate start/end
        var startPos = 0
        var endPos = 0

        for (var x = 0; x < lines.length; x++) {
          if (x === lineNum) {
            break
          }
          startPos += (lines[x].length + 1)
        }

        var max = lines.length - 1
        endPos = lines[lineNum > max ? max : lineNum].length + startPos

        return [startPos, endPos]
      }

      var positions = getLineStartEnd(_lineNum)

      if (tarea.selectionEnd === positions[1]) {
        var tmpStart = tarea.selectionStart
        positions = getLineStartEnd(_lineNum + 1)
        positions[0] = tmpStart
      }

      tarea.selectionStart = positions[0]
      tarea.selectionEnd = positions[1]
    },
    scrollToCaret: function () {
      var cursor = document.querySelector('#caret')
      if (cursor) {
        var cursorPos = cursor.getClientRects()[0].top
        var outputRect = this.$refs.output.getClientRects()[0]
        var gc = document.querySelector('#ghostCaret')
        var ghostHeight = parseInt(getComputedStyle(gc).height)
        console.log(ghostHeight)
        // console.log(cursorPos, outputRect.height)
        if (cursorPos > outputRect.height) {
          // console.log('triggered')
          cursor.scrollIntoView(false)
          this.$refs.output.scrollTop += cursorPos - outputRect.height + ghostHeight
        } else if (cursorPos < outputRect.top) {
          console.log('true')
          cursor.scrollIntoView(true)
          console.log(outputRect.top, cursorPos, outputRect.top - cursorPos)
          app.$refs.output.scrollTop -= outputRect.top - cursorPos + ghostHeight
        }
      } else {
        // if no cursor just mirror
        // this.$refs.output.scrollTop
      }
    },
    markedWithCaret: function () {
      // bug: caret shows in ``` code ```
      var _val = this.input
      this.$nextTick(function () {
        var caret = CARET
        // if (this.showRaw) {
        //   caret = '|'
        // }
        // https://stackoverflow.com/questions/2812253/invisible-delimiter-for-strings-in-html
        var outputWithCaret = _val.splice(this.$refs.editor.selectionEnd, 0, '<span id="caret">&zwnj;</span>')
        this.output = marked(outputWithCaret)
        // check all codeblocks and change to pre or something if contains zwnj
        // this.ghostOutput = marked(outputWithCaret)

        this.scrollToCaret()
      })
    },
    hideCaretClone: function () {
      this.output = this.output.replace(CARET, '')
    },
    multilineFormat: function (modifier, doDelete) {
      // TODO: keep the highlight
      var selectedText = getSelectionText()
      var sel = this.$refs.editor

      if (selectedText) {
        var newText = ''
        var _splitted = selectedText.split('\n')
        for (var i = 0; i < _splitted.length; i++) {
          if (doDelete) {
            newText += _splitted[i].replace('\t', '')
          } else {
            newText += modifier + _splitted[i]
          }

          if (i < _splitted.length - 1) {
            newText += '\n'
          }
        }
        this.input = this.input.splice(sel.selectionStart, sel.selectionEnd - sel.selectionStart, newText)
        this.updateCaretPosition(newText.length, sel.selectionStart)
      } else {
        this.appendText(modifier)
      }
    },
    formatText: function (modifier) {
      var selectedText = getSelectionText()
      var sel = this.$refs.editor
      var newText = null
      if (selectedText) {
        newText = modifier + selectedText + modifier
        this.input = this.input.splice(sel.selectionStart, sel.selectionEnd - sel.selectionStart, newText)
        this.updateCaretPosition(newText.length)
      } else {
        this.appendText(modifier)
      }
    },
    updateCaretPosition: function (end, start) {
      let _end = this.$refs.editor.selectionStart + end
      this.$nextTick(function () {
        this.$refs.editor.selectionEnd = _end
        if (start) {
          this.$refs.editor.selectionStart = start
        }
      })
    },
    appendText: function (text) {
      this.input = this.input.splice(this.$refs.editor.selectionEnd, 0, text)
      this.updateCaretPosition(text.length)
    },
    insertLink: function (url, selectionObj) {
      var text = '[' + selectionObj.text + '](' + url + ')'
      this.input = this.input.splice(selectionObj.start,
                                     selectionObj.end - selectionObj.start,
                                     text)
      this.modal = false
      this.$refs.editor.focus()
      this.updateCaretPosition(text.length)
    },
    triggerModal: function (mode) {
      var selectedText = getSelectionText()
      var sel = this.$refs.editor
      var selectionObj = {
        text: selectedText,
        start: sel.selectionStart,
        end: sel.selectionEnd
      }

      if (this.modal) {
        this.modal = false
      } else if (mode === 'search' && selectedText.length > 0) {
        var carcors = getCaretCoordinates(this.$refs.editor, this.$refs.editor.selectionEnd)
        var _top = document.querySelector('.main-col').getBoundingClientRect().top
        var results = this.idx.search(selectedText)
        if (results.length > 0) {
          this.modal = {
            mode: mode,
            data: {
              selection: selectionObj,
              contents: results,
              top: carcors.top + _top - this.$refs.editor.scrollTop + 'px',
              left: carcors.left + 'px'
            }
          }
        }
      }
    },
    closeModal: function () {
      this.modal = false
    },
    copyAndGo: function () {
      this.$refs.editor.select()
      document.execCommand('Copy')
      window.open(POST_URL)
    },
    toggleRaw: function () {
      this.showRaw = !this.showRaw
    }
  }
})
