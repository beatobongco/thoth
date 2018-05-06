/* TODO:
* Make this usable not only for me (can load lunr lang)
* for selfsearch also `notes`, dont include stuff with no title
*/

/*
  Main app should display thoth title / logo
  Also hold mainstate
*/

var app = new Vue({
  el: '#app',
  data: {
    mode: 'loader',
    post: null
  },
  methods: {
    setMode: function (mode) {
      this.mode = mode
    },
    setPost: function (post) {
      this.post = post
    }
  },
  template: `
    <div class="app">
      <thoth-loader
        v-if="mode === 'loader'"></thoth-loader>
      <thoth-editor
        v-if="mode === 'editor'"
        :initialPost="post"></thoth-editor>
    </div>
  `
})
