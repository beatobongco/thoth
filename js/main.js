/* TODO:
* Make this usable not only for me (can load lunr lang)
* put line numbers
* for selfsearch also `notes`, dont include stuff with no title
* keyboard control for selecting links after ctrl+O
* allow linking to self's id's (h1, h2)
* implement mermaid and lang syntax highlighting
*/

/*
  Main app should take care of initial loading stuff
  And display thoth title / logo
  Also hold mainstate
*/

var app = new Vue({
  el: '#app',
  data: {
    mode: 'loader',
    target: null
  },
  methods: {
    setMode: function (mode) {
      this.mode = mode
    },
    setTarget: function (target) {
      this.target = target
    }
  },
  template: `
    <div class="app">
      <thoth-loader
        v-if="mode === 'loader'"></thoth-loader>
      <thoth-editor
        v-if="mode === 'editor'"
        :target="target"></thoth-editor>
    </div>
  `
})