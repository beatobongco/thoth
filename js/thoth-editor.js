Vue.component('thoth-editor', {
  props: ['mode', 'initialPost'],
  data: function () {
    return {
      caretPos: {},
      autosave: null,
      autosaveDate: null,
      toSearch: null,
      modal: null,
      store: null,
      lastPull: null,
      idx: null,
      showRaw: false,
      input: this.initialPost.content,
      output: '',
      ghostOutput: '',
      filename: this.initialPost.name,
    }
  },
  watch: {
    input: function () {
      this.markedWithCaret()
    },
    filename: function (newVal, oldVal) {
      let _this = this
      localforage.removeItem(this.initialPost.keyPrefix + oldVal).then(function () {
        _this.save()
      })
    }
  },
  mounted: function () {
    // get lunr database for searching own notes
    let app = this
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

    // TODO: offer refresh/sync button with github
    // that warns
    this.autosave = setInterval(this.save, AUTOSAVE_INTERVAL)
    this.$refs.editor.focus()

    this.markedWithCaret()
  },
  beforeDestroy: function () {
    clearTimeout(this.autosave)
    this.autosave = null
  },
  updated: function () {
    this.updateCaretPos()
  },
  methods: {
    getSaveKey: function () {
      if (this.filename) {
        return this.initialPost.keyPrefix + this.filename
      }
      return null
    },
    getPostURL: function () {
      if (this.filename === this.initialPost.name) {
        return this.initialPost.postURL
      }
      return POST_URL + this.filename + '&message=Create ' + this.filename
    },
    deleteNote: function () {
      let _this = this
      console.log('deleting', this.getSaveKey())
      localforage.removeItem(this.getSaveKey()).then(function () {
        _this.goBack()
      })
    },
    save: function () {
      // only save when has a filename, autosave is active, and there is content on a non-default filename
      if (this.filename === this.initialPost.name && (!this.input || this.input.length === 0)) {
        return
      }
      if (this.getSaveKey() && this.autosave) {
        let _this = this
        console.log('saving', _this.getSaveKey())
        localforage.setItem(_this.getSaveKey(), _this.input).then(function () {
          _this.autosaveDate = new Date().toLocaleString()
        })
      }
    },
    goBackAndSave: function () {
      this.save()
      this.goBack()
    },
    goBack: function () {
      app.setMode('loader')
      app.setPost(null)
    },
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
        if (cursorPos > outputRect.height) {
          cursor.scrollIntoView(false)
          this.$refs.output.scrollTop += cursorPos - outputRect.height + ghostHeight
        } else if (cursorPos < outputRect.top) {
          cursor.scrollIntoView(true)
          this.$refs.output.scrollTop -= outputRect.top - cursorPos + ghostHeight
        }
      } else {
        // if no cursor just mirror
        // this.$refs.output.scrollTop
      }
    },
    markedWithMermaid: function () {
      this.output = marked(this.input)
      this.$nextTick(function () {
        mermaid.init(undefined, '.lang-mermaid')
      })
    },
    markedWithCaret: function () {
      var _val = this.input
      // https://stackoverflow.com/questions/2812253/invisible-delimiter-for-strings-in-html
      var invisibleCaret = '<span id="caret">&zwnj;</span>'
      var outputWithCaret = _val.splice(this.$refs.editor.selectionEnd, 0, invisibleCaret)
      var output = marked(outputWithCaret)
      // check all codeblocks and change to pre or something if contains zwnj
      // check all code tags, replace caret with static shit
      // TODO: insert mermaid if found <code class="lang-mermaid"></code>
      // this means that drop-in highlighting libs can be used
      var outputDiv = document.createElement('div')
      outputDiv.innerHTML = output
      var codeTags = outputDiv.getElementsByTagName('code')
      for (var i = 0; i < codeTags.length; i++) {
        var escapedInviCaret = '&lt;span id="caret"&gt;&amp;zwnj;&lt;/span&gt;'
        if (codeTags[i].innerHTML.indexOf(escapedInviCaret) > -1) {
          var tempDiv = document.createElement('div')
          tempDiv.className = 'fake-code'
          tempDiv.innerHTML = codeTags[i].innerHTML .replace(escapedInviCaret, invisibleCaret)
          codeTags[i].parentNode.replaceChild(tempDiv, codeTags[i])
        }
      }
      this.output = outputDiv.innerHTML
      this.$nextTick(function () {
        mermaid.init(undefined, '.lang-mermaid')
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
    formatCode: function () {
      this.formatText('\n```\n')
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
        this.modal = {
          mode: mode,
          data: {
            input: '',
            selection: selectionObj,
            contents: results,
            top: carcors.top + _top - this.$refs.editor.scrollTop + 'px',
            left: carcors.left + 'px'
          }
        }
        this.$nextTick(function () { this.$refs.modalInput.focus() })
      }
    },
    closeModal: function () {
      this.modal = false
    },
    copyAndGo: function () {
      this.$refs.editor.select()
      document.execCommand('Copy')
      window.open(this.getPostURL())
    },
    toggleRaw: function () {
      this.showRaw = !this.showRaw
    }
  },
  template: `
  <div class="thoth-editor"
    @keydown.esc.prevent="closeModal">
    <div class="wrapper">
      <div
        class="modal-wrapper"
        v-if="modal"
        @click.self="closeModal">
        <div
          class="modal"
          v-if="modal.mode === 'search'"
          :style="{top: modal.data.top, left: modal.data.left}"
        >
          <ul>
            <li>
              <input
                ref="modalInput"
                type="text"
                v-model="modal.data.input"
                @keydown.enter.prevent="insertLink(modal.data.input, modal.data.selection)">
            </li>
            <li v-for="content in modal.data.contents">
              <a href="#" @click.prevent="insertLink(store[content.ref].id, modal.data.selection)">{{store[content.ref].title}}</a>
            </li>
          </ul>
        </div>
      </div>
      <div class="offset-container">
        <div class="flex">
          <h1>thoth</h1>
          <div class="last-pull" v-if="lastPull">
            <small>
              Search database: {{lastPull}}
              <span v-if="autosaveDate">
                | Last autosaved: {{autosaveDate}}
              </span>
            </small>
          </div>
        </div>
        <div class="controls">
          <button @click="goBackAndSave">Back</button>
          <input type="text" v-model="filename">
          <button
            v-if="initialPost.thothSource === 'local'"
            @click="deleteNote"
            >Delete</button>
        </div>
      </div>
      <div class="row main-row">
        <div class="col-xs-12 col-sm-6 main-col">
          <textarea
            ref="editor"
            class="editor overflow-y"
            v-model="input"
            @click="markedWithCaret"
            @keydown="markedWithCaret"
            @focus="markedWithCaret"
            @keydown.ctrl.shift.l="multilineFormat('* ')"
            @keydown.tab.shift.prevent="multilineFormat('\t', doDelete=true)"
            @keydown.tab.exact.prevent="multilineFormat('\t')"
            @keydown.ctrl.b="formatText('**')"
            @keydown.ctrl.i="formatText('*')"
            @keydown.ctrl.191="formatCode"
            @keydown.ctrl.k.prevent="triggerModal('search')"
            @keydown.ctrl.l.prevent="highlightLine"
            @keydown.ctrl.s.prevent="copyAndGo"
            @keydown.ctrl.e.prevent="toggleRaw"
            @blur="hideCaretClone"
          ></textarea>
        </div>
        <div class="col-xs-12 col-sm-6 main-col">
          <div class="ghostCaret blinking-cursor" id="ghostCaret" :style="{top: caretPos.top, left: caretPos.left}">|</div>
          <div
            v-if="showRaw"
            class="raw overflow-y">{{output}}</div>
          <div
            v-else
            ref="output"
            class="output overflow-y"
            v-html="output"></div>
        </div>
      </div>
    </div>
  </div>
  `
})
