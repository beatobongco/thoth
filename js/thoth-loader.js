/*
  A component that allows you to do load stuff from a
  public github URL as well as local storage.
*/

Vue.component('thoth-loader', {
  data: function () {
    return {
      apiURL: API_URL,
      results: []
    }
  },
  mounted: function () {
    this.load()
  },
  methods: {
    load: function () {
      superagent
        .get(this.apiURL)
        .then(function (res) {
          this.results = res.body
        }.bind(this))
    },
    loadNote: function (note) {
      app.setMode('editor')
      note['thothSource'] = 'github'
      app.setTarget(note)
    },
    createNew: function () {
      app.setMode('editor')
    }
  },
  template: `
  <ul>
    <li>
      <a href="#" @click.prevent="createNew">
        Create new note
      </a>
    </li>
    <li v-for="res in results">
      <a href="#"
        @click.prevent="loadNote(res)">
        {{res.name}}
      </a>
    </li>
  </ul>
  `
})
