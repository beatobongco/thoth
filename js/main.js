/* TODO:
* Make this usable not only for me (can load lunr lang)
* put line numbers
* localstorage autosave (snapshots and gallery)
* for selfsearch also `notes`, dont include stuff with no title
* keyboard control for selecting links after ctrl+O
* allow custom links with ctrl+o allow these links to include id's
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
    target: {}
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
      <github-loader
        v-if="mode === 'loader'"></github-loader>
      <thoth-editor
        v-if="mode === 'editor'"
        :target="target"></thoth-editor>
    </div>
  `
})
