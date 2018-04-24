/* TODO:
* Make this usable not only for me (can load lunr lang)
* put line numbers
* localstorage autosave (snapshots and gallery)
* for selfsearch also `notes`, dont include stuff with no title
* keyboard control for selecting links after ctrl+O
* allow custom links with ctrl+o allow these links to include id's
*/

var app = new Vue({
  el: '#app',
  data: {
    mode: 'editor'
  }
})
